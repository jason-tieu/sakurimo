import { SupabaseClient } from '@supabase/supabase-js';
import { 
  Unit,
  Assignment, 
  Exam, 
  Event, 
  GradeItem
} from '../types';
import { 
  StoragePort, 
  AssignmentFilters, 
  ExamFilters, 
  EventFilters, 
  GradeItemFilters 
} from '../storage';
import { UNITS_TABLE, ASSIGNMENTS_TABLE, EXAMS_TABLE, EVENTS_TABLE, GRADE_ITEMS_TABLE } from '../constants';
import { cleanUnitTitle } from '../formatters/unitTitle';
import { cleanUnitCode } from '../formatters/unitCode';

export function createSupabaseStorage(supabase: SupabaseClient): StoragePort {
  return {
    // Units
    async listUnits(): Promise<Unit[]> {
      // Get current user for RLS
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Failed to get user information: ${userError.message}`);
      }
      
      if (!user) {
        return [];
      }
      
      const { data, error } = await supabase
        .from(UNITS_TABLE)
        .select('id, owner_id, code, title, term, semester, year, term_display, campus, url, unit_url, instructor, credits, description, canvas_course_id, created_at, updated_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    },

    async getUnit(id: string): Promise<Unit | null> {
      const { data, error } = await supabase
        .from(UNITS_TABLE)
        .select('id, owner_id, code, title, term, semester, year, term_display, campus, url, unit_url, instructor, credits, description, canvas_course_id, created_at, updated_at')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }
      return data;
    },

    async createUnit(unitData: Omit<Unit, 'id' | 'owner_id' | 'created_at'>): Promise<Unit> {
      // Get current user for RLS
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Failed to get user information: ${userError.message}`);
      }
      
      if (!user) {
        throw new Error('Please sign in to add units.');
      }

      // Clean the title and code
      const cleanedCode = cleanUnitCode(unitData.code);
      const cleanedTitle = cleanUnitTitle(unitData as Unit);

      const payload = {
        code: cleanedCode,
        title: cleanedTitle,
        term: unitData.term,
        semester: unitData.semester ?? null,
        year: unitData.year ?? null,
        term_display: unitData.term_display ?? null,
        campus: unitData.campus ?? null,
        url: unitData.url ?? null,
        unit_url: unitData.unit_url ?? null,
        instructor: unitData.instructor ?? null,
        credits: unitData.credits ?? null,
        description: unitData.description ?? null,
        canvas_course_id: unitData.canvas_course_id ?? null,
        updated_at: unitData.updated_at ?? null,
      };
      
      try {
        const { data, error } = await supabase
          .from(UNITS_TABLE)
          .insert([payload])
          .select('id, owner_id, code, title, term, semester, year, term_display, campus, url, unit_url, instructor, credits, description, canvas_course_id, created_at, updated_at')
          .single();
        
        if (error) {
          throw new Error(`Database error: ${error.message} (${error.code})`);
        }
        
        if (!data) {
          throw new Error('No data returned from database insert');
        }
        
        return data;
      } catch (insertError) {
        throw insertError;
      }
    },

    async updateUnit(id: string, updates: Partial<Omit<Unit, 'id' | 'owner_id' | 'created_at'>>): Promise<Unit | null> {
      // Clean the title and code if they're being updated
      const processedUpdates = { ...updates };
      if (updates.code) {
        processedUpdates.code = cleanUnitCode(updates.code);
      }
      if (updates.title != null && updates.code != null) {
        processedUpdates.title = cleanUnitTitle({ ...updates, title: updates.title, code: updates.code } as Unit);
      }

      const { data, error } = await supabase
        .from(UNITS_TABLE)
        .update(processedUpdates)
        .eq('id', id)
        .select('id, owner_id, code, title, term, semester, year, term_display, campus, url, unit_url, instructor, credits, description, canvas_course_id, created_at, updated_at')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }
      return data;
    },

    async deleteUnit(id: string): Promise<boolean> {
      const { error } = await supabase
        .from(UNITS_TABLE)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },


    // Assignments
    async listAssignments(filters?: AssignmentFilters): Promise<Assignment[]> {
      let query = supabase
        .from(ASSIGNMENTS_TABLE)
        .select('*')
        .order('due_at', { ascending: true });

      if (filters?.unitId) {
        query = query.eq('unit_id', filters.unitId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.dueBefore) {
        query = query.lte('due_at', filters.dueBefore.toISOString());
      }
      if (filters?.dueAfter) {
        query = query.gte('due_at', filters.dueAfter.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async getAssignment(id: string): Promise<Assignment | null> {
      const { data, error } = await supabase
        .from(ASSIGNMENTS_TABLE)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },

    async createAssignment(assignmentData: Omit<Assignment, 'id'>): Promise<Assignment> {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(`Failed to get user information: ${userError.message}`);
      if (!user) throw new Error('Please sign in to add assignments.');

      const { data, error } = await supabase
        .from(ASSIGNMENTS_TABLE)
        .insert([{
          ...assignmentData,
          owner_id: user.id,
        }])
        .select()
        .single();
      
      if (error) {
        throw new Error(`Database error: ${error.message} (${error.code})`);
      }
      if (!data) throw new Error('No data returned from database insert');
      
      return data;
    },

    async updateAssignment(id: string, updates: Partial<Omit<Assignment, 'id'>>): Promise<Assignment | null> {
      const { data, error } = await supabase
        .from(ASSIGNMENTS_TABLE)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },

    async deleteAssignment(id: string): Promise<boolean> {
      const { error } = await supabase
        .from(ASSIGNMENTS_TABLE)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },

    // Exams
    async listExams(filters?: ExamFilters): Promise<Exam[]> {
      let query = supabase
        .from(EXAMS_TABLE)
        .select('*')
        .order('starts_at', { ascending: true });

      if (filters?.unitId) {
        query = query.eq('unit_id', filters.unitId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async getExam(id: string): Promise<Exam | null> {
      const { data, error } = await supabase
        .from(EXAMS_TABLE)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },

    async createExam(examData: Omit<Exam, 'id'>): Promise<Exam> {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(`Failed to get user information: ${userError.message}`);
      if (!user) throw new Error('Please sign in to add exams.');

      const { data, error } = await supabase
        .from(EXAMS_TABLE)
        .insert([{
          ...examData,
          owner_id: user.id,
        }])
        .select()
        .single();
      
      if (error) {
        throw new Error(`Database error: ${error.message} (${error.code})`);
      }
      if (!data) throw new Error('No data returned from database insert');
      
      return data;
    },

    async updateExam(id: string, updates: Partial<Omit<Exam, 'id'>>): Promise<Exam | null> {
      const { data, error } = await supabase
        .from(EXAMS_TABLE)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },

    async deleteExam(id: string): Promise<boolean> {
      const { error } = await supabase
        .from(EXAMS_TABLE)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },

    // Events
    async listEvents(filters?: EventFilters): Promise<Event[]> {
      let query = supabase
        .from(EVENTS_TABLE)
        .select('*')
        .order('starts_at', { ascending: true });

      if (filters?.unitId) {
        query = query.eq('unit_id', filters.unitId);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.from) {
        query = query.gte('starts_at', filters.from.toISOString());
      }
      if (filters?.to) {
        query = query.lte('ends_at', filters.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async createEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(`Failed to get user information: ${userError.message}`);
      if (!user) throw new Error('Please sign in to add events.');

      const { data, error } = await supabase
        .from(EVENTS_TABLE)
        .insert([{
          ...eventData,
          owner_id: user.id,
        }])
        .select()
        .single();
      
      if (error) {
        throw new Error(`Database error: ${error.message} (${error.code})`);
      }
      if (!data) throw new Error('No data returned from database insert');
      
      return data;
    },

    async updateEvent(id: string, updates: Partial<Omit<Event, 'id'>>): Promise<Event | null> {
      const { data, error } = await supabase
        .from(EVENTS_TABLE)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },

    async deleteEvent(id: string): Promise<boolean> {
      const { error } = await supabase
        .from(EVENTS_TABLE)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },

    // Grades
    async listGradeItems(filters?: GradeItemFilters): Promise<GradeItem[]> {
      let query = supabase
        .from(GRADE_ITEMS_TABLE)
        .select('*')
        .order('due_date', { ascending: true });

      if (filters?.unitId) {
        query = query.eq('unit_id', filters.unitId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async createGradeItem(gradeItemData: Omit<GradeItem, 'id'>): Promise<GradeItem> {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(`Failed to get user information: ${userError.message}`);
      if (!user) throw new Error('Please sign in to add grade items.');

      const { data, error } = await supabase
        .from(GRADE_ITEMS_TABLE)
        .insert([{
          ...gradeItemData,
          owner_id: user.id,
        }])
        .select()
        .single();
      
      if (error) {
        throw new Error(`Database error: ${error.message} (${error.code})`);
      }
      if (!data) throw new Error('No data returned from database insert');
      
      return data;
    },

    async updateGradeItem(id: string, updates: Partial<Omit<GradeItem, 'id'>>): Promise<GradeItem | null> {
      const { data, error } = await supabase
        .from(GRADE_ITEMS_TABLE)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },

    async deleteGradeItem(id: string): Promise<boolean> {
      const { error } = await supabase
        .from(GRADE_ITEMS_TABLE)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },

    // Utilities
    async clearAll(): Promise<void> {
      // Delete in order to respect foreign key constraints
      await supabase.from(GRADE_ITEMS_TABLE).delete().neq('id', '');
      await supabase.from(ASSIGNMENTS_TABLE).delete().neq('id', '');
      await supabase.from(EXAMS_TABLE).delete().neq('id', '');
      await supabase.from(EVENTS_TABLE).delete().neq('id', '');
      await supabase.from(UNITS_TABLE).delete().neq('id', '');
    },

    async exportJSON(): Promise<string> {
      const [units, assignments, exams, events, grades] = await Promise.all([
        this.listUnits(),
        this.listAssignments(),
        this.listExams(),
        this.listEvents(),
        this.listGradeItems(),
      ]);

      return JSON.stringify({
        units,
        assignments,
        exams,
        events,
        grades,
      }, null, 2);
    },

    async importJSON(data: string): Promise<void> {
      const imported = JSON.parse(data) as {
        units: Unit[];
        assignments: Assignment[];
        exams: Exam[];
        events: Event[];
        grades: GradeItem[];
      };

      // Clear existing data first
      await this.clearAll();

      // Insert in order to respect foreign key constraints
      if (imported.units.length > 0) {
        await supabase.from(UNITS_TABLE).insert(imported.units);
      }
      if (imported.assignments.length > 0) {
        await supabase.from(ASSIGNMENTS_TABLE).insert(imported.assignments);
      }
      if (imported.exams.length > 0) {
        await supabase.from(EXAMS_TABLE).insert(imported.exams);
      }
      if (imported.events.length > 0) {
        await supabase.from(EVENTS_TABLE).insert(imported.events);
      }
      if (imported.grades.length > 0) {
        await supabase.from(GRADE_ITEMS_TABLE).insert(imported.grades);
      }
    },
  };
}
