/**
 * Canvas API integration functions
 * Handles communication with Canvas Edge Functions
 */

import { isAllowedCanvasHost } from './institutions';
import { CanvasSelfProfile, LMSAccount } from './types';

export interface CanvasProfile {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface CanvasVerifyResponse {
  success: boolean;
  profile?: CanvasProfile;
  error?: string;
}

export interface CanvasStoreResponse {
  success: boolean;
  connectionId?: string;
  action?: 'created' | 'updated';
  error?: string;
}

export interface CanvasSyncResponse {
  success: boolean;
  message?: string;
  syncedAt?: string;
  disconnected?: boolean;
  error?: string;
}

/**
 * Get the current user's access token
 */
function getAccessToken(): string {
  // This will be called from components that have access to the session
  // We'll pass the token as a parameter to avoid circular dependencies
  throw new Error('getAccessToken must be called with a token parameter');
}

/**
 * Verify Canvas access token with the specified base URL
 */
export async function verifyCanvasToken(baseUrl: string, token: string): Promise<CanvasVerifyResponse> {
  // Security check: ensure the base URL is whitelisted
  if (!isAllowedCanvasHost(baseUrl)) {
    throw new Error('Invalid Canvas host. Only whitelisted universities are supported.');
  }

  try {
    const response = await fetch('/api/canvas-verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base_url: baseUrl,
        token: token,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to verify Canvas token');
    }

    return await response.json();
  } catch (error) {
    console.error('Canvas verification error:', error);
    throw new Error('Couldn\'t reach Canvas right now—please try again.');
  }
}

/**
 * Store Canvas connection after successful verification
 */
export async function storeCanvasConnection(
  baseUrl: string, 
  token: string, 
  profile: CanvasProfile | undefined,
  accessToken: string
): Promise<CanvasStoreResponse> {
  // Security check: ensure the base URL is whitelisted
  if (!isAllowedCanvasHost(baseUrl)) {
    throw new Error('Invalid Canvas host. Only whitelisted universities are supported.');
  }

  if (!accessToken) {
    throw new Error('Access token is required for storing Canvas connection');
  }

  try {
    const response = await fetch('/api/canvas-store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        base_url: baseUrl,
        token: token,
        profile: profile,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to store Canvas connection');
    }

    return await response.json();
  } catch (error) {
    console.error('Canvas storage error:', error);
    throw new Error('Failed to save Canvas connection. Please try again.');
  }
}

/**
 * Sync Canvas data
 */
export async function syncCanvasData(connectionId: string, accessToken: string): Promise<CanvasSyncResponse> {
  if (!accessToken) {
    throw new Error('Access token is required for syncing Canvas data');
  }

  try {
    const response = await fetch('/api/canvas-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        connection_id: connectionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to sync Canvas data');
    }

    return await response.json();
  } catch (error) {
    console.error('Canvas sync error:', error);
    throw new Error('Failed to sync Canvas data. Please try again.');
  }
}

/**
 * Map Canvas profile to LMS account fields
 */
export function mapCanvasProfileToAccount(profile: CanvasSelfProfile, baseUrl: string): Partial<LMSAccount> {
  const s = (v: string | null | undefined) => v?.trim();
  const name = s(profile.name);
  const short_name = s(profile.short_name);
  const sortable_name = s(profile.sortable_name);
  const avatar_url = s(profile.avatar_url);
  const primary_email = s(profile.primary_email);
  const login_id = s(profile.login_id);
  const integration_id = s(profile.integration_id);
  const time_zone = s(profile.time_zone);
  const locale = s(profile.locale);
  const effective_locale = s(profile.effective_locale);
  const calendar_ics = s(profile.calendar?.ics);
  return {
    external_user_id: profile.id.toString(),
    ...(name && { name }),
    ...(short_name && { short_name }),
    ...(sortable_name && { sortable_name }),
    ...(avatar_url && { avatar_url }),
    ...(primary_email && { primary_email }),
    ...(login_id && { login_id }),
    ...(integration_id && { integration_id }),
    ...(time_zone && { time_zone }),
    ...(locale && { locale }),
    ...(effective_locale && { effective_locale }),
    ...(calendar_ics && { calendar_ics }),
    last_profile_sync_at: new Date().toISOString(),
  };
}
