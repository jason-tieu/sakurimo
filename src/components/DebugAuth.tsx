'use client';

import { useSupabase } from '@/lib/supabase/SupabaseProvider';
import { useStorage } from '@/lib/storageContext';

export function DebugAuth() {
  const { session, user, supabase } = useSupabase();
  const storage = useStorage();

  const testUnitCreation = async () => {
    try {
      // Test direct Supabase call first
      const { data: { user: directUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('DebugAuth: Error getting user directly:', userError);
        return;
      }
      if (!directUser) {
        console.log('DebugAuth: No user found directly via supabase.auth.getUser()');
        return;
      }

      // Test direct Supabase insert first
      const testUnit = {
        code: 'DEBUG123',
        title: 'Debug Test Unit',
        term: 'Debug Term',
        semester: 1,
        year: new Date().getFullYear(),
        term_display: 'Debug Term',
        campus: null,
        url: null,
        unit_url: null,
        instructor: null,
        credits: null,
        description: null,
        canvas_course_id: null,
        updated_at: null,
      };

      const { data: directInsertData, error: directInsertError } = await supabase
        .from('units')
        .insert([
          {
            ...testUnit,
            owner_id: directUser.id,
          }
        ])
        .select()
        .single();

      if (directInsertError) {
        console.error('DebugAuth: Direct Supabase insert failed:', directInsertError);
      } else {
        console.log('DebugAuth: Direct Supabase insert successful:', directInsertData.id);
      }
      
      const result = await storage.createUnit(testUnit);
      console.log('DebugAuth: Unit created successfully via storage adapter:', result.id);
    } catch (error: unknown) {
      console.error('DebugAuth: Unit creation failed:', error);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h3 className="font-semibold mb-2">Debug Auth State</h3>
      <div className="space-y-2 text-sm">
        <div>Session: {session ? '✅ Active' : '❌ None'}</div>
        <div>User: {user ? `✅ ${user.email}` : '❌ None'}</div>
        <div>User ID: {user?.id || 'N/A'}</div>
      </div>
      <button 
        onClick={testUnitCreation}
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
      >
        Test Unit Creation
      </button>
    </div>
  );
}
