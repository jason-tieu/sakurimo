import { StoragePort } from '../storage';
import { createMockStorage } from './mockStorage';
import { createSupabaseStorage } from './supabaseAdapter';
import { getSupabase } from '../supabase';

export async function createStorage(): Promise<StoragePort> {
  const driver = process.env.STORAGE_DRIVER || 'mock';
  
  if (driver === 'supabase') {
    const supabase = await getSupabase();
    return createSupabaseStorage(supabase);
  }
  
  // Default to mock storage
  return createMockStorage();
}

// Export individual adapters for direct use if needed
export { createMockStorage } from './mockStorage';
export { createSupabaseStorage } from './supabaseAdapter';
