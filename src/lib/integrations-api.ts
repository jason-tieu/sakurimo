/**
 * Integrations API functions
 * Uses session (cookies); pass credentials: 'include' for same-origin requests.
 */

export interface LMSConnection {
  id: string;
  owner_id: string;
  platform: string;
  institution: string;
  base_url: string;
  display_name: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationsResponse {
  success: boolean;
  connections?: LMSConnection[];
  error?: string;
}

export async function fetchLMSConnections(): Promise<IntegrationsResponse> {
  try {
    const response = await fetch('/api/integrations', {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch connections');
    }
    return await response.json();
  } catch (error) {
    console.error('Integrations fetch error:', error);
    throw new Error('Failed to fetch integrations. Please try again.');
  }
}

export async function disconnectLMSConnection(connectionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/integrations/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ connection_id: connectionId }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to disconnect');
    }
    return await response.json();
  } catch (error) {
    console.error('Disconnect error:', error);
    throw new Error('Failed to disconnect. Please try again.');
  }
}
