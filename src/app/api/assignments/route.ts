import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, authenticateUserFromToken } from '@/lib/server/supabase';
import { stripHtmlToText, formatDueDate } from '@/lib/formatters/assignment';

export const runtime = 'nodejs';

/**
 * GET /api/assignments
 * Auth user, query assignments by user_id, join units for code/title, sort due_at asc nulls last.
 * Returns normalized records for the Assignments page (camelCase, N/A for missing).
 */
export async function GET(request: NextRequest) {
  try {
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
        { ok: false, error: 'No session user.' },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();

    const { data: rows, error } = await serviceClient
      .from('assignments')
      .select(`
        id,
        unit_id,
        title,
        type,
        state,
        description_html,
        due_at,
        points_possible,
        score,
        html_url,
        units!inner ( code, title )
      `)
      .eq('user_id', user.id)
      .order('due_at', { ascending: true, nullsFirst: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    type UnitEmbed = { code: string | null; title: string | null } | { code: string | null; title: string | null }[] | null;
    type Row = {
      id: string;
      unit_id: string;
      title: string | null;
      type: string | null;
      state: string | null;
      description_html: string | null;
      due_at: string | null;
      points_possible: number | null;
      score: number | null;
      html_url: string | null;
      units: UnitEmbed;
    };

    const list = (rows ?? []).map((row: Row) => {
      const rawUnits = row.units;
      const unit = Array.isArray(rawUnits) ? rawUnits[0] ?? null : rawUnits;
      const unitCode = unit && typeof unit === 'object' && 'code' in unit ? (unit.code ?? 'N/A') : 'N/A';
      const descriptionPreview = stripHtmlToText(row.description_html);
      const dueAtFormatted = formatDueDate(row.due_at);
      return {
        id: row.id,
        unitId: row.unit_id,
        unitCode,
        title: row.title ?? 'N/A',
        type: row.type ?? 'assignment',
        status: row.state ?? 'published',
        description: descriptionPreview,
        dueAt: row.due_at,
        dueAtFormatted,
        grade: row.score != null ? row.score : null,
        maxGrade: row.points_possible != null ? row.points_possible : null,
        weight: null as number | null,
        url: row.html_url ?? null,
      };
    });

    return NextResponse.json({ ok: true, assignments: list });
  } catch (err) {
    console.error('GET /api/assignments error:', err);
    return NextResponse.json(
      { ok: false, error: 'Failed to load assignments.' },
      { status: 500 }
    );
  }
}
