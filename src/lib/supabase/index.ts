import { createClient as createBrowserClient } from './client';
import { createClient as createServerClient } from './server';

export async function getSupabase() {
  if (typeof window === 'undefined') {
    return createServerClient();
  }
  return createBrowserClient();
}

export { createClient as createBrowserClient } from './client';
export { createClient as createServerClient } from './server';
export { updateSession } from './proxy';
