'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from './client';
import { syncUserProfile } from './profileSync';
import type { SupabaseClient, User, Session } from '@supabase/supabase-js';

interface SupabaseContextType {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | null>(null);

interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false); // Session check complete
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false); // Auth state change complete
        
        // Sync user profile on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          syncUserProfile(supabase, session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, session, user, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  
  return context;
}

export function useSession() {
  const context = useContext(SupabaseContext);
  
  if (!context) {
    throw new Error('useSession must be used within a SupabaseProvider');
  }
  
  return {
    session: context.session,
    user: context.user,
    isLoading: context.isLoading,
  };
}
