import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, authenticateUserFromToken } from '@/lib/server/supabase';
import {
  fetchAssignmentGroups,
  getAssignmentCount,
  paginateAssignments,
} from '@/lib/server/canvas';
import { upsertAssignment } from '@/server/db/assignments';
import { isAllowedCanvasHost } from '@/lib/institutions';
import { decryptToken } from '@/lib/server/encryption';
import { keywordLabel } from '@/lib/formatters/assignment';
import type { CanvasAssignment, CanvasAssignmentGroup } from '@/lib/canvas/types';

export const runtime = 'nodejs';

const allowedOrigins = ['http://localhost:3000', 'https://sakurimo.vercel.app'];

function checkCORS(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return !origin || allowedOrigins.includes(origin);
}

function assignmentType(a: CanvasAssignment): 'quiz' | 'assignment' {
  const st = a.submission_types ?? [];
  if (Array.isArray(st) && st.includes('online_quiz')) return 'quiz';
  if (a.quiz_id != null) return 'quiz';
  if (a.is_quiz_assignment === true) return 'quiz';
  return 'assignment';
}

function enc(line: object): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(line) + '\n');
}

export async function POST(request: NextRequest) {
  try {
    if (!checkCORS(request)) {
      return NextResponse.json({ ok: false, error: 'CORS policy violation' }, { status: 403 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Authorization header with Bearer token is required.' },
        { status: 401 }
      );
    }

    const user = await authenticateUserFromToken(authHeader.substring(7));
    if (!user?.id) {
      return NextResponse.json(
        { ok: false, error: 'No session user; cannot sync assignments.' },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();

    const { data: conn, error: connError } = await serviceClient
      .from('lms_connections')
      .select('id, owner_id, platform, institution, base_url')
      .eq('owner_id', user.id)
      .eq('platform', 'canvas')
      .maybeSingle();

    if (connError || !conn) {
      return NextResponse.json(
        { ok: false, error: connError ? 'Failed to fetch Canvas connection' : 'Canvas not connected' },
        connError ? { status: 500 } : { status: 400 }
      );
    }

    const baseUrl = (conn.base_url ?? '').replace(/\/$/, '');
    if (!isAllowedCanvasHost(baseUrl)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid Canvas host.' },
        { status: 400 }
      );
    }

    const { data: secret, error: secretError } = await serviceClient
      .from('lms_secrets')
      .select('token_ciphertext, token_iv')
      .eq('connection_id', conn.id)
      .maybeSingle();

    if (secretError || !secret) {
      return NextResponse.json(
        { ok: false, error: secretError ? 'Failed to fetch token' : 'Canvas token missing; reconnect' },
        secretError ? { status: 500 } : { status: 401 }
      );
    }

    let token: string;
    try {
      token = decryptToken({
        ciphertext: secret.token_ciphertext,
        iv: secret.token_iv,
      });
    } catch (err) {
      console.error('Decrypt error:', err);
      return NextResponse.json(
        { ok: false, error: 'Canvas token corrupted; reconnect' },
        { status: 401 }
      );
    }

    const { data: units, error: unitsError } = await serviceClient
      .from('units')
      .select('id, owner_id, external_id')
      .eq('owner_id', user.id)
      .eq('platform', 'canvas');

    if (unitsError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to load units' },
        { status: 500 }
      );
    }

    if (!units?.length) {
      return new Response(
        JSON.stringify({
          type: 'done',
          ok: true,
          unitsProcessed: 0,
          assignmentsUpserted: 0,
          assignmentsSkipped: 0,
          errors: [] as string[],
        }) + '\n',
        {
          headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    const now = new Date().toISOString();

    const stream = new ReadableStream({
      async start(controller) {
        let assignmentsUpserted = 0;
        let assignmentsSkipped = 0;
        const errors: string[] = [];
        let totalAssignmentCount: number | null = null;

        // Pre-count assignments so we can show "X of Y" (per-assignment, not per-unit).
        try {
          let sum = 0;
          for (const unit of units) {
            const courseId = unit.external_id;
            if (!courseId) continue;
            const count = await getAssignmentCount(baseUrl, token, courseId);
            if (count == null) {
              sum = 0;
              break;
            }
            sum += count;
          }
          totalAssignmentCount = sum > 0 ? sum : null;
        } catch {
          totalAssignmentCount = null;
        }

        const sendProgress = () => {
          controller.enqueue(
            enc({
              type: 'progress',
              current: assignmentsUpserted,
              ...(totalAssignmentCount != null ? { total: totalAssignmentCount } : {}),
            })
          );
        };

        for (const unit of units) {
          const courseId = unit.external_id;
          if (!courseId) {
            errors.push(`Unit ${unit.id} has no external_id`);
            sendProgress();
            continue;
          }

          let groups: CanvasAssignmentGroup[] = [];
          try {
            groups = await fetchAssignmentGroups(baseUrl, token, courseId);
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown';
            errors.push(`Unit ${unit.id} (course ${courseId}): assignment_groups: ${msg}`);
            sendProgress();
            continue;
          }

          const groupNameById = new Map<number, string>();
          for (const g of groups) {
            if (g.id != null) groupNameById.set(g.id, g.name ?? '');
          }

          let assignments: CanvasAssignment[] = [];
          try {
            assignments = await paginateAssignments(baseUrl, token, courseId);
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown';
            errors.push(`Unit ${unit.id} (course ${courseId}): assignments: ${msg}`);
            sendProgress();
            continue;
          }

          for (const a of assignments) {
            if (a.id == null || a.name == null) {
              assignmentsSkipped++;
              continue;
            }

            const groupName =
              a.assignment_group_id != null ? groupNameById.get(a.assignment_group_id) ?? null : null;
            const label = keywordLabel(a.name, groupName);
            const type = assignmentType(a);

            try {
              await upsertAssignment(serviceClient, {
                user_id: unit.owner_id,
                unit_id: unit.id,
                source: 'canvas',
                external_id: String(a.id),
                external_quiz_id: a.quiz_id != null ? String(a.quiz_id) : null,
                title: a.name,
                description_html: a.description ?? null,
                type,
                label,
                assignment_group_id: a.assignment_group_id != null ? String(a.assignment_group_id) : null,
                assignment_group_name: groupName ?? null,
                due_at: a.due_at ?? null,
                unlock_at: a.unlock_at ?? null,
                lock_at: a.lock_at ?? null,
                points_possible: a.points_possible != null ? Number(a.points_possible) : null,
                state: a.workflow_state ?? null,
                html_url: a.html_url ?? null,
                submission_types: a.submission_types ?? null,
                external_updated_at: a.updated_at ?? null,
                last_synced_at: now,
                raw: a,
              });
              assignmentsUpserted++;
              sendProgress();
            } catch (err) {
              assignmentsSkipped++;
              errors.push(`Assignment ${a.id}: ${err instanceof Error ? err.message : 'Unknown'}`);
            }
          }
        }

        controller.enqueue(
          enc({
            type: 'done',
            ok: true,
            unitsProcessed: units.length,
            assignmentsUpserted,
            assignmentsSkipped,
            errors,
          })
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Assignments sync stream error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to sync assignments. Please try again.' },
      { status: 500 }
    );
  }
}
