import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/serverClient';
import { createServiceClient } from '@/lib/server/supabase';
import { encryptToken } from '@/lib/server/encryption';
import { isAllowedCanvasHost } from '@/lib/institutions';

export const runtime = 'nodejs';

const allowedOrigins = ['http://localhost:3000', 'https://sakurimo.vercel.app'];

function checkCORS(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return !origin || allowedOrigins.includes(origin);
}

export async function POST(request: NextRequest) {
  try {
    if (!checkCORS(request)) {
      return NextResponse.json(
        { success: false, error: 'CORS policy violation' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      platform = 'canvas',
      institution = 'QUT',
      base_url,
      display_name,
      token,
    } = body as {
      platform?: string;
      institution?: string;
      base_url?: string;
      display_name?: string;
      token?: string;
    };

    if (!base_url || !isAllowedCanvasHost(base_url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Canvas host. Only whitelisted universities are supported.' },
        { status: 400 }
      );
    }
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Access token is required.' },
        { status: 400 }
      );
    }

    const supabase = createClientFromRequest(request);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Canvas store auth error:', userError);
      return NextResponse.json(
        { success: false, error: 'You must be signed in to connect Canvas.' },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();
    const now = new Date().toISOString();

    const { data: existingConnection } = await supabase
      .from('lms_connections')
      .select('id')
      .eq('owner_id', user.id)
      .eq('platform', platform)
      .maybeSingle();

    const connectionId = existingConnection?.id ?? crypto.randomUUID();
    const isUpdate = !!existingConnection;

    const connectionPayload = {
      id: connectionId,
      owner_id: user.id,
      platform,
      institution: institution ?? 'QUT',
      base_url: base_url.replace(/\/$/, ''),
      display_name: display_name ?? null,
      last_synced_at: existingConnection ? undefined : null,
      updated_at: now,
    };

    const { error: connectionError } = isUpdate
      ? await supabase
          .from('lms_connections')
          .update({
            institution: connectionPayload.institution,
            base_url: connectionPayload.base_url,
            display_name: connectionPayload.display_name,
            updated_at: connectionPayload.updated_at,
          })
          .eq('id', connectionId)
          .eq('owner_id', user.id)
      : await supabase.from('lms_connections').insert({
          ...connectionPayload,
          created_at: now,
        });

    if (connectionError) {
      console.error('Error storing connection:', connectionError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to ${isUpdate ? 'update' : 'store'} connection.`,
          details: connectionError.message,
        },
        { status: 500 }
      );
    }

    let encryptedData: { ciphertext: string; iv: string };
    try {
      encryptedData = encryptToken(token);
    } catch (err) {
      console.error('Encryption error:', err);
      if (!isUpdate) {
        await supabase.from('lms_connections').delete().eq('id', connectionId).eq('owner_id', user.id);
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to encrypt token.',
          details: err instanceof Error ? err.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    const secretPayload = {
      connection_id: connectionId,
      token_ciphertext: encryptedData.ciphertext,
      token_iv: encryptedData.iv,
      updated_at: now,
    };

    const { error: secretError } = await serviceClient
      .from('lms_secrets')
      .upsert(
        { ...secretPayload, created_at: isUpdate ? undefined : now },
        { onConflict: 'connection_id' }
      );

    if (secretError) {
      console.error('Error storing secret:', secretError);
      if (!isUpdate) {
        await supabase.from('lms_connections').delete().eq('id', connectionId).eq('owner_id', user.id);
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to store encrypted token.',
          details: secretError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connectionId,
      action: isUpdate ? 'updated' : 'created',
    });
  } catch (error) {
    console.error('Canvas storage error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save Canvas connection. Please try again.' },
      { status: 500 }
    );
  }
}
