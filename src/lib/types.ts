// Core university tracker types

/** Authoritative shape for public.units (Supabase). */
export interface Unit {
  id: string;
  owner_id: string;          // from DB reads only; RLS enforces
  platform: string;          // default 'canvas'
  institution: string;       // default 'QUT'
  external_id: string;       // Canvas course ID (string) or manual id
  code: string | null;
  title: string;
  year: number | null;
  semester: number | null;
  created_at: string;       // ISO string
  updated_at: string | null; // ISO string
}

/** Derive term_display from year + semester (not stored in DB). */
export function unitTermDisplay(u: { year?: number | null; semester?: number | null }): string {
  if (u.year != null && u.semester != null) {
    return `S${u.semester} ${u.year}`;
  }
  return 'N/A';
}


export interface Assignment {
  id: string;
  unitId: string;
  title: string;
  type: 'assignment' | 'project' | 'lab' | 'quiz' | 'essay' | 'presentation';
  dueAt: Date;
  status: 'todo' | 'in_progress' | 'submitted' | 'graded' | 'late';
  grade?: number;
  maxGrade?: number;
  url?: string;
  description?: string;
  weight?: number; // percentage of total grade
}

export interface Exam {
  id: string;
  unitId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location?: string;
  seat?: string;
  type: 'midterm' | 'final' | 'quiz' | 'practical';
  duration?: number; // in minutes
  instructions?: string;
}

export interface Announcement {
  id: string;
  unitId?: string;
  title: string;
  body: string;
  postedAt: Date;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  attachments?: string[];
}

export interface StudyTask {
  id: string;
  title: string;
  unitId?: string;
  plannedAt?: Date;
  durationMin?: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  description?: string;
  tags?: string[];
}

export interface Event {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  type: 'class' | 'lab' | 'tutorial' | 'exam' | 'personal' | 'study';
  unitId?: string;
  location?: string;
  description?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
}

export interface GradeItem {
  id: string;
  unitId: string;
  name: string;
  weightPct: number;
  score?: number;
  maxScore?: number;
  dueDate?: Date;
  type: 'assignment' | 'exam' | 'participation' | 'project' | 'quiz';
  status: 'pending' | 'graded' | 'excused';
}

export interface UnitGrade {
  unitId: string;
  currentGrade?: number;
  letterGrade?: string;
  gpa?: number;
  items: GradeItem[];
  lastUpdated: Date;
}

export interface StudySession {
  id: string;
  unitId?: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  type: 'pomodoro' | 'focused' | 'review' | 'group';
  notes?: string;
  completed: boolean;
}

export interface Resource {
  id: string;
  unitId: string;
  title: string;
  type: 'lecture_notes' | 'lab_manual' | 'textbook' | 'video' | 'forum' | 'assignment' | 'other';
  url: string;
  description?: string;
  tags?: string[];
  addedAt: Date;
}

export interface Integration {
  id: string;
  name: string;
  type: 'canvas' | 'blackboard' | 'moodle' | 'google_calendar' | 'microsoft_teams';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  settings?: Record<string, unknown>;
}

// Canvas API types
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

export interface LMSAccount {
  id: string;
  owner_id: string;
  provider: 'canvas';
  base_url: string;
  external_user_id: string;
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
  calendar_ics?: string;
  last_profile_sync_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'assignment_due' | 'exam_reminder' | 'grade_posted' | 'announcement' | 'general';
  isRead: boolean;
  createdAt: Date;
  unitId?: string;
  actionUrl?: string;
}

export interface UserSettings {
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    assignmentReminders: boolean;
    examReminders: boolean;
    gradeUpdates: boolean;
  };
  academicYear: string;
  semester: 'semester1' | 'semester2' | 'summer' | 'winter';
  university?: string;
  studentId?: string;
}

// Utility types
export type AssignmentStatus = Assignment['status'];
export type StudyTaskStatus = StudyTask['status'];
export type EventType = Event['type'];
export type NotificationType = Notification['type'];
export type Priority = 'low' | 'medium' | 'high';

// Filter types
export interface AssignmentFilters {
  unitId?: string;
  status?: AssignmentStatus;
  dueDate?: 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'overdue';
  type?: Assignment['type'];
}

export interface EventFilters {
  unitId?: string;
  type?: EventType;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Dashboard data types
export interface DashboardStats {
  upcomingAssignments: number;
  overdueAssignments: number;
  upcomingExams: number;
  currentGPA?: number;
  studyHoursThisWeek: number;
  completedTasks: number;
}

export interface UpcomingItem {
  id: string;
  title: string;
  type: 'assignment' | 'exam' | 'class' | 'study';
  dueAt: Date;
  unitId: string;
  unitCode: string;
  priority: Priority;
}
