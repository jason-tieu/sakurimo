/**
 * Canvas API types for unified sync
 */

export interface CanvasSelfProfile {
  id: number;
  name?: string;
  short_name?: string;
  sortable_name?: string;
  avatar_url?: string;
  primary_email?: string;
  login_id?: string;
  integration_id?: string;
  time_zone?: string;
  locale?: string;
  effective_locale?: string;
  calendar?: {
    ics?: string;
  };
}

export interface CanvasEnrollment {
  id: number;
  type: string;
  role: string;
  role_id: number;
  user_id: number;
  enrollment_state: 'active' | 'invited' | 'creation_pending' | 'deleted' | 'rejected' | 'completed' | 'inactive';
  limit_privileges_to_course_section: boolean;
  course_integration_id?: string;
  sis_import_id?: number;
  root_account_id: number;
  user?: {
    id: number;
    name: string;
    created_at: string;
    sortable_name: string;
    short_name: string;
    sis_user_id?: string;
    integration_id?: string;
    login_id: string;
    avatar_url?: string;
    enrollments: CanvasEnrollment[];
    email: string;
    locale?: string;
    last_login?: string;
    time_zone?: string;
    bio?: string;
  };
}

export interface CanvasCourse {
  id: number;
  name: string;
  course_code?: string;
  workflow_state: 'unpublished' | 'available' | 'completed' | 'deleted';
  account_id: number;
  uuid: string;
  start_at?: string;
  grading_standard_id?: number;
  is_public?: boolean;
  created_at: string;
  course_format?: string;
  public_syllabus?: boolean;
  public_syllabus_to_auth?: boolean;
  public_description?: string;
  storage_quota_mb: number;
  storage_quota_used_mb: number;
  hide_final_grades?: boolean;
  license?: string;
  allow_student_assignment_edits?: boolean;
  allow_wiki_comments?: boolean;
  allow_student_forum_attachments?: boolean;
  open_enrollment?: boolean;
  self_enrollment?: boolean;
  restrict_enrollments_to_course_dates?: boolean;
  course_format_option?: string;
  apply_assignment_group_weights?: boolean;
  calendar?: {
    ics?: string;
  };
  time_zone?: string;
  blueprint?: boolean;
  blueprint_restrictions?: any;
  blueprint_restrictions_by_object_type?: any;
  template?: boolean;
  enrollments?: CanvasEnrollment[];
  total_students?: number;
  teachers?: CanvasEnrollment[];
  sis_course_id?: string;
  integration_id?: string;
  sis_import_id?: number;
  end_at?: string;
  public_syllabus_body?: string;
}

export interface CanvasLinkHeader {
  next?: string;
  prev?: string;
  first?: string;
  last?: string;
}

export interface CanvasAssignmentGroup {
  id: number;
  name: string;
  position?: number;
  group_weight?: number;
  assignments?: CanvasAssignment[];
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description?: string | null;
  due_at?: string | null;
  unlock_at?: string | null;
  lock_at?: string | null;
  assignment_group_id: number;
  points_possible?: number | null;
  submission_types?: string[];
  quiz_id?: number | null;
  is_quiz_assignment?: boolean;
  workflow_state?: string;
  html_url?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface CanvasSyncResponse {
  ok: boolean;
  profileSaved?: boolean;
  added?: number;
  updated?: number;
  skipped?: number;
  total?: number;
  errors?: number;
  units?: Array<{
    id: string;
    code: string | null;
    title: string;
    semester?: number | null;
    year?: number | null;
    url?: string | null;
  }>;
  error?: string;
}
