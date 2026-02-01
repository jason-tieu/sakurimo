/**
 * Server-side Supabase helpers
 * MUST NOT be imported by any "use client" component or client bundle.
 */

import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Safety check: ensure this is only used server-side
if (typeof window !== 'undefined') {
  throw new Error('Server Supabase helpers must not be imported in client-side code');
}

/**
 * Create service-role Supabase client for elevated permissions
 */
export function createServiceClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create RLS Supabase client for user-scoped operations
 */
export function createRLSClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing required environment variables: SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Authenticate user from JWT token using service client
 */
export async function authenticateUserFromToken(accessToken: string) {
  const supabase = createServiceClient();
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    throw new Error('Invalid or expired access token');
  }
  
  return user;
}
