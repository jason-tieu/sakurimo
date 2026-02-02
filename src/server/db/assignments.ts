/**
 * Database operations for public.assignments
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type AssignmentUpsertPayload = {
  user_id: string;
  unit_id: string;
  source: string;
  external_id: string;
  external_quiz_id: string | null;
  title: string;
  description_html: string | null;
  type: 'quiz' | 'assignment';
  label: string | null;
  assignment_group_id: string | null;
  assignment_group_name: string | null;
  due_at: string | null;
  unlock_at: string | null;
  lock_at: string | null;
  points_possible: number | null;
  state: string | null;
  html_url: string | null;
  submission_types: unknown;
  external_updated_at: string | null;
  last_synced_at: string;
  raw: unknown;
};

/**
 * Upsert assignment using (unit_id, source, external_id) as conflict target.
 */
export async function upsertAssignment(
  svc: SupabaseClient,
  payload: AssignmentUpsertPayload
): Promise<void> {
  const { error } = await svc
    .from('assignments')
    .upsert(payload, { onConflict: 'unit_id,source,external_id' });

  if (error) {
    throw new Error(`Failed to upsert assignment: ${error.message}`);
  }
}
