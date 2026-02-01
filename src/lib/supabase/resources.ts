import { SupabaseClient } from '@supabase/supabase-js';
import { Resource } from '../types';

const BUCKET_NAME = 'sakurimo-resources';

export interface UploadResult {
  url: string;
  path: string;
  resource: Resource;
}

export interface ResourceUploadOptions {
  title: string;
  unitId: string;
  type: Resource['type'];
  description?: string;
  tags?: string[];
}

export class ResourcesHelper {
  constructor(private supabase: SupabaseClient) {}

  async uploadFile(
    file: File,
    options: ResourceUploadOptions
  ): Promise<UploadResult> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload file to bucket
    const { error: uploadError } = await this.supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    // Create resource record
    const resource: Omit<Resource, 'id'> = {
      unitId: options.unitId,
      title: options.title,
      type: options.type,
      url: publicUrl,
      ...(options.description && { description: options.description }),
      ...(options.tags && { tags: options.tags }),
      addedAt: new Date(),
    };

    const { data: resourceData, error: resourceError } = await this.supabase
      .from('resources')
      .insert([resource])
      .select()
      .single();

    if (resourceError) throw resourceError;

    return {
      url: publicUrl,
      path: filePath,
      resource: resourceData,
    };
  }

  async listResources(unitId?: string): Promise<Resource[]> {
    let query = this.supabase
      .from('resources')
      .select('*')
      .order('added_at', { ascending: false });

    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async deleteResource(id: string): Promise<boolean> {
    // Get resource to find file path
    const { data: resource, error: fetchError } = await this.supabase
      .from('resources')
      .select('url')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Extract file path from URL
    const url = new URL(resource.url);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(-2).join('/'); // Get user_id/filename

    // Delete from storage
    const { error: storageError } = await this.supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (storageError) {
    }

    // Delete from database
    const { error: dbError } = await this.supabase
      .from('resources')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;
    return true;
  }

  async getResourceUrl(id: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('resources')
      .select('url')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data.url;
  }
}

export function createResourcesHelper(supabase: SupabaseClient): ResourcesHelper {
  return new ResourcesHelper(supabase);
}
