/**
 * Database operations for units
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cleanSyllabus, primaryTeacherName } from '../utils/canvas';
import { parseSemesterYear } from '../../lib/canvas/parse';
import { cleanUnitTitle } from '../utils/unitTitle';
import { cleanUnitCode } from '../utils/unitCode';

export type UnitPayload = {
  owner_id: string;
  canvas_course_id: number;
  code?: string | null;
  title: string;
  url?: string | null;
  unit_url?: string | null;
  semester?: number | null;
  year?: number | null;
  term?: string | null;
  instructor?: string | null;
  credits?: number | null;
  campus?: string | null;
  description?: string | null;
};

export interface UnitSourcePayload {
  unit_id: string;
  provider: string;
  external_course_id: string;
  external_account_id?: string | null;
  external_sis_id?: string | null;
}

export interface EnrollmentPayload {
  owner_id: string;
  unit_id: string;
  source: string;
  role: string;
  semester?: number | null;
  year?: number | null;
}

export interface UnitResult {
  id: string;
  code: string | null;
  title: string;
  semester?: number | null;
  year?: number | null;
  url?: string | null;
}

/**
 * Upsert unit using (owner_id, canvas_course_id) as conflict target
 * Builds payload from Canvas course data
 */
export async function upsertUnit(
  svc: SupabaseClient,
  course: any,
  ownerId: string,
  willInsert: boolean
): Promise<{ unitId: string; isInsert: boolean }> {
  // Build payload from Canvas course data
  // Parse semester/year from course code (e.g., "MXB202_25se2" → year: 2025, semester: 2)
  const courseCode = course.course_code ?? course.sis_course_id ?? course.name ?? '';
  const semesterYear = parseSemesterYear(courseCode);
  const semester = semesterYear?.semester ?? null;
  const year = semesterYear?.year ?? null;
  const term = semester && year ? `S${semester} ${year}` : null;

  // Clean the title and code
  const rawTitle = course.name ?? 'Untitled Course';
  const rawCode = course.course_code ?? course.sis_course_id ?? null;
  const cleanedCode = cleanUnitCode(rawCode);
  const cleanedTitle = cleanUnitTitle(rawTitle, rawCode); // Use raw code for title cleaning since it needs the full code to match

  const payload: UnitPayload = {
    owner_id: ownerId,
    canvas_course_id: course.id,
    code: cleanedCode,
    title: cleanedTitle,
    url: course.html_url ?? null,
    unit_url: course.calendar?.ics ?? null,
    semester,
    year,
    term,
    instructor: primaryTeacherName(course) ?? null,
    credits: null,
    campus: null,
    description: cleanSyllabus(course.syllabus_body) ?? null,
  };

  // Use upsert with explicit conflict target
  const { data, error } = await svc
    .from('units')
    .upsert(payload, { onConflict: 'owner_id,canvas_course_id' })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to upsert unit: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from upsert');
  }

  return { unitId: data.id, isInsert: willInsert };
}

/**
 * Upsert unit source mapping
 */
export async function upsertUnitSource(
  svc: SupabaseClient,
  args: { unit_id: string; provider: 'canvas'|'manual'; external_course_id: string; external_account_id?: string | null; external_sis_id?: string | null }
): Promise<void> {
  const { error } = await svc
    .from('unit_sources')
    .upsert({
      unit_id: args.unit_id,
      provider: args.provider,
      external_course_id: args.external_course_id,
      external_account_id: args.external_account_id ?? null,
      external_sis_id: args.external_sis_id ?? null,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'provider,external_course_id' });
  if (error) throw error;
}

/**
 * Upsert enrollment
 */
export async function upsertEnrollment(
  svc: SupabaseClient,
  args: { owner_id: string; unit_id: string; source: 'canvas'|'manual'; role?: string | null; semester?: number | null; year?: number | null }
): Promise<void> {
  const { error } = await svc
    .from('unit_enrollments')
    .upsert({
      owner_id: args.owner_id,
      unit_id: args.unit_id,
      source: args.source,
      role: args.role ?? 'StudentEnrollment',
      semester: args.semester ?? null,
      year: args.year ?? null,
      created_at: new Date().toISOString(),
    }, { onConflict: 'owner_id,unit_id,source' });
  if (error) throw error;
}

/**
 * List user's units
 */
export async function listMyUnits(
  rls: SupabaseClient,
  owner_id: string
): Promise<UnitResult[]> {
  const { data: enrollments, error } = await rls
    .from('unit_enrollments')
    .select(`
      unit_id,
      role,
      semester,
      year,
      units!inner (
        id,
        code,
        title,
        url,
        semester,
        year
      )
    `)
    .eq('owner_id', owner_id);

  if (error) {
    throw new Error(`Failed to list units: ${error.message}`);
  }

  if (!enrollments) {
    return [];
  }

  // Transform and deduplicate units (Supabase returns units as array for relation)
  const unitMap = new Map<string, UnitResult>();
  const unitsList = Array.isArray(enrollments) ? enrollments : [];

  for (const enrollment of unitsList) {
    const units = enrollment.units;
    const items = Array.isArray(units) ? units : (units ? [units] : []);
    for (const unit of items) {
      if (unit && !unitMap.has(unit.id)) {
        unitMap.set(unit.id, {
          id: unit.id,
          code: unit.code,
          title: unit.title,
          semester: unit.semester,
          year: unit.year,
          url: unit.url,
        });
      }
    }
  }

  return Array.from(unitMap.values());
}
