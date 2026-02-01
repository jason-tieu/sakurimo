import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, authenticateUserFromToken } from '@/lib/server/supabase';
import { fetchCanvasJson, paginateCourses } from '@/lib/server/canvas';
import { upsertUnit } from '@/server/db/units';
import { isAllowedCanvasHost } from '@/lib/institutions';
import { decryptToken } from '@/lib/server/encryption';

export const runtime = 'nodejs';

const allowedOrigins = ['http://localhost:3000', 'https://sakurimo.vercel.app'];

function checkCORS(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return !origin || allowedOrigins.includes(origin);
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
        { ok: false, error: 'No session user; cannot sync units.' },
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

    let courses;
    try {
      courses = await paginateCourses(baseUrl, token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('expired')) {
        return NextResponse.json({ ok: false, error: 'Canvas token expired; please reconnect' }, { status: 401 });
      }
      return NextResponse.json({ ok: false, error: `Canvas API error: ${msg}` }, { status: 502 });
    }

    const { data: existingUnits } = await serviceClient
      .from('units')
      .select('external_id')
      .eq('owner_id', user.id);
    const existingSet = new Set((existingUnits ?? []).map((r) => r.external_id));

    let added = 0,
      updated = 0,
      skipped = 0;
    const errors: string[] = [];
    const institution = conn.institution ?? 'QUT';

    for (const c of courses) {
      if (!c.id || !c.name) {
        skipped++;
        if (!c.id) errors.push('Course missing ID');
        else errors.push(`Course ${c.id} missing name`);
        continue;
      }
      const hasEnrollment = c.enrollments && c.enrollments.length > 0;
      if (c.workflow_state && c.workflow_state !== 'available') {
        skipped++;
        continue;
      }
      if (!hasEnrollment) {
        skipped++;
        continue;
      }

      try {
        const willInsert = !existingSet.has(String(c.id));
        const { isInsert } = await upsertUnit(serviceClient, c, user.id, willInsert, institution);
        if (isInsert) {
          added++;
          existingSet.add(String(c.id));
        } else {
          updated++;
        }
      } catch (err) {
        skipped++;
        errors.push(`Course ${c.id}: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }

    await serviceClient
      .from('lms_connections')
      .update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', conn.id)
      .eq('owner_id', user.id);

    return NextResponse.json({
      ok: true,
      added,
      updated,
      skipped,
      total: courses.length,
      errors: errors.length,
    });
  } catch (error) {
    console.error('Canvas sync error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to sync Canvas data. Please try again.' },
      { status: 500 }
    );
  }
}
