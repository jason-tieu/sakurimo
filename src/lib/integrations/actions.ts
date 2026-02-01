'use client';

export interface SyncCanvasResult {
  ok: boolean;
  error?: string;
  added?: number;
  updated?: number;
  skipped?: number;
  total?: number;
  errors?: number;
}

/**
 * Sync Canvas units (POST /api/canvas/sync). Requires Bearer token.
 */
export async function syncCanvas(accessToken: string): Promise<SyncCanvasResult> {
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
    if (!data.ok) {
      return { ok: false, error: data.error || 'Canvas sync failed' };
    }
    return {
      ok: true,
      added: data.added ?? 0,
      updated: data.updated ?? 0,
      skipped: data.skipped ?? 0,
      total: data.total ?? 0,
      errors: data.errors ?? 0,
    };
  } catch (error) {
    console.error('Canvas sync error:', error);
    return {
      ok: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}
