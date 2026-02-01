/**
 * Legacy canvas-sync: verifies stored Canvas connection and returns profile.
 * For unit sync, use POST /api/canvas/sync with Bearer token.
 * Auth via cookies (same as verify-connection).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/server/supabase';
import { decryptToken } from '@/lib/server/encryption';
import { isAllowedCanvasHost } from '@/lib/institutions';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'You must be signed in.' },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();
    const { data: conn, error: connError } = await serviceClient
      .from('lms_connections')
      .select('id, base_url')
      .eq('owner_id', user.id)
      .eq('platform', 'canvas')
      .maybeSingle();

    if (connError || !conn) {
      return NextResponse.json(
        { success: false, error: connError ? 'Failed to load connection' : 'Canvas not connected' },
        connError ? { status: 500 } : { status: 404 }
      );
    }

    const baseUrl = (conn.base_url ?? '').replace(/\/$/, '');
    if (!isAllowedCanvasHost(baseUrl)) {
      return NextResponse.json({ success: false, error: 'Invalid Canvas host.' }, { status: 400 });
    }

    const { data: secret, error: secretError } = await serviceClient
      .from('lms_secrets')
      .select('token_ciphertext, token_iv')
      .eq('connection_id', conn.id)
      .maybeSingle();

    if (secretError || !secret) {
      return NextResponse.json(
        { success: false, error: secretError ? 'Failed to load token' : 'Token missing; reconnect' },
        secretError ? { status: 500 } : { status: 401 }
      );
    }

    let token: string;
    try {
      token = decryptToken({
        ciphertext: secret.token_ciphertext,
        iv: secret.token_iv,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Token corrupted; reconnect' },
        { status: 401 }
      );
    }

    const res = await fetch(`${baseUrl}/api/v1/users/self/profile`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json(
          { success: false, error: 'Canvas token expired; please reconnect.', disconnected: true },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Could not verify with Canvas.' },
        { status: 502 }
      );
    }

    const profile = await res.json();
    return NextResponse.json({
      success: true,
      message: 'Connection verified',
      profile: { id: profile.id, name: profile.name ?? profile.short_name ?? '' },
    });
  } catch (error) {
    console.error('Canvas sync (verify) error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify connection.' },
      { status: 500 }
    );
  }
}
