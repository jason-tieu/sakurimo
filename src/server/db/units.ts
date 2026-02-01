/**
 * Database operations for units (public.units schema)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { parseSemesterYear } from '../../lib/canvas/parse';
import { cleanUnitTitle } from '../utils/unitTitle';
import { cleanUnitCode } from '../utils/unitCode';

export type UnitPayload = {
  owner_id: string;
  platform: string;
  institution: string;
  external_id: string;
  code?: string | null;
  title: string;
  year?: number | null;
  semester?: number | null;
};

export interface UnitResult {
  id: string;
  code: string | null;
  title: string;
  semester?: number | null;
  year?: number | null;
}

const PLATFORM_CANVAS = 'canvas';
const INSTITUTION_QUT = 'QUT';

/**
 * Parse course code like MXB202_25se2 → code: 'MXB202', year: 2025, semester: 2
 */
function parseCodeYearSemester(
  courseCode: string
): { code: string; year: number | null; semester: number | null } {
  const cleanedCode = cleanUnitCode(courseCode) ?? courseCode;
  const parsed = parseSemesterYear(courseCode);
  return {
    code: cleanedCode || courseCode,
    year: parsed?.year ?? null,
    semester: parsed?.semester ?? null,
  };
}

/**
 * Upsert unit using (owner_id, platform, external_id) as conflict target.
 * Maps Canvas course → units: external_id = String(canvasCourse.id), platform = 'canvas', institution from connection or 'QUT'.
 */
export async function upsertUnit(
  svc: SupabaseClient,
  course: { id: number; name?: string; course_code?: string; sis_course_id?: string },
  ownerId: string,
  _willInsert: boolean,
  institution: string = INSTITUTION_QUT
): Promise<{ unitId: string; isInsert: boolean }> {
  const courseCode = course.course_code ?? course.sis_course_id ?? course.name ?? '';
  const { code, year, semester } = parseCodeYearSemester(courseCode);
  const rawTitle = course.name ?? 'Untitled Course';
  const cleanedTitle = cleanUnitTitle(rawTitle, code);

  const payload: UnitPayload = {
    owner_id: ownerId,
    platform: PLATFORM_CANVAS,
    institution: institution || INSTITUTION_QUT,
    external_id: String(course.id),
    code: code || null,
    title: cleanedTitle,
    year: year ?? null,
    semester: semester ?? null,
  };

  const { data, error } = await svc
    .from('units')
    .upsert(payload, { onConflict: 'owner_id,platform,external_id' })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to upsert unit: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from upsert');
  }

  return { unitId: data.id, isInsert: true };
}

/**
 * List user's units (RLS or service client). Order: year DESC, semester DESC.
 */
export async function listMyUnits(
  client: SupabaseClient,
  owner_id: string
): Promise<UnitResult[]> {
  const { data, error } = await client
    .from('units')
    .select('id, code, title, semester, year')
    .eq('owner_id', owner_id)
    .order('year', { ascending: false, nullsFirst: false })
    .order('semester', { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to list units: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    semester: row.semester,
    year: row.year,
  }));
}
