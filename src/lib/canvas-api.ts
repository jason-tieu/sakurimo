/**
 * Canvas API integration functions (client).
 * Store uses session (cookies). Verify uses POST body only. Sync units uses Bearer token.
 */

import { isAllowedCanvasHost } from './institutions';

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
  ok: boolean;
  error?: string;
  added?: number;
  updated?: number;
  skipped?: number;
  total?: number;
  errors?: number;
}

/**
 * Verify Canvas access token with the specified base URL (before storing).
 */
export async function verifyCanvasToken(baseUrl: string, token: string): Promise<CanvasVerifyResponse> {
  if (!isAllowedCanvasHost(baseUrl)) {
    throw new Error('Invalid Canvas host. Only whitelisted universities are supported.');
  }
  try {
    const response = await fetch('/api/canvas-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base_url: baseUrl, token }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to verify Canvas token');
    }
    return await response.json();
  } catch (error) {
    console.error('Canvas verification error:', error);
    throw new Error('Couldn\'t reach Canvas right now—please try again.');
  }
}

/**
 * Store Canvas connection after verification. Uses session (cookies); no Bearer token.
 */
export async function storeCanvasConnection(
  baseUrl: string,
  token: string,
  _profile?: CanvasProfile | undefined
): Promise<CanvasStoreResponse> {
  if (!isAllowedCanvasHost(baseUrl)) {
    throw new Error('Invalid Canvas host. Only whitelisted universities are supported.');
  }
  try {
    const response = await fetch('/api/canvas-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        platform: 'canvas',
        institution: 'QUT',
        base_url: baseUrl,
        token,
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to store Canvas connection');
    }
    return await response.json();
  } catch (error) {
    console.error('Canvas storage error:', error);
    throw new Error('Failed to save Canvas connection. Please try again.');
  }
}

/**
 * Sync Canvas units (POST /api/canvas/sync). Requires Bearer token.
 */
export async function syncCanvasUnits(accessToken: string): Promise<CanvasSyncResponse> {
  if (!accessToken) {
    throw new Error('Access token is required for syncing');
  }
  try {
    const response = await fetch('/api/canvas/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to sync Canvas data' };
    }
    return data;
  } catch (error) {
    console.error('Canvas sync error:', error);
    return { ok: false, error: 'Network error. Please check your connection and try again.' };
  }
}
