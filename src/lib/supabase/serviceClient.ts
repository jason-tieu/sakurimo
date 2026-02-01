/**
 * DEPRECATED: Service-role client has been moved to server-only code.
 *
 * In API routes and server code, use:
 *   import { createServiceClient, authenticateUserFromToken } from '@/lib/server/supabase';
 *
 * This file does not reference SUPABASE_SERVICE_ROLE_KEY and must not re-export
 * server/supabase, so it is safe in any bundle. If you import this from client
 * code, you will get the error below at runtime.
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'Do not import service client in browser. Use createClient from @/lib/supabase/browserClient or SupabaseProvider.'
  );
}

// No re-export: do not pull in @/lib/server/supabase here (it contains the service role key).
// All API routes should import directly from '@/lib/server/supabase'.
