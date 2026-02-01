import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/serverClient';
import { createServiceClient, authenticateUserFromToken } from '@/lib/server/supabase';
import { encryptToken } from '@/lib/encryption';
import { isAllowedCanvasHost } from '@/lib/institutions';

// Ensure this runs on Node.js runtime (not Edge)
export const runtime = 'nodejs';

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://sakurimo.vercel.app', // Add your production domain
];

function checkCORS(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return !origin || allowedOrigins.includes(origin);
}

export async function POST(request: NextRequest) {
  try {
    // CORS check
    if (!checkCORS(request)) {
      return NextResponse.json(
        { success: false, error: 'CORS policy violation' },
        { status: 403 }
      );
    }

    const { base_url, token, profile } = await request.json();
    
    console.log('Canvas store request received:', {
      base_url,
      hasToken: !!token,
      profile: profile?.name || 'No profile'
    });

    // Security check: validate base URL is whitelisted
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

    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization header with Bearer token is required.' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Authenticate user using service client
    let user;
    try {
      user = await authenticateUserFromToken(accessToken);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired access token.' },
        { status: 401 }
      );
    }

    console.log('Authenticated user:', {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || 'Unknown'
    });

    // Create service client for database operations
    const serviceClient = createServiceClient();
    const anonClient = createClientFromRequest(request);

    // Check for existing Canvas connection for this user and base_url
    console.log('Checking for existing Canvas connection:', {
      owner_id: user.id,
      provider: 'canvas',
      account_identifier: base_url
    });

    const { data: existingConnection, error: fetchError } = await anonClient
      .from('lms_connections')
      .select('id, status, access_meta')
      .eq('owner_id', user.id)
      .eq('provider', 'canvas')
      .eq('account_identifier', base_url)
      .single();

    let connectionId: string;
    let isUpdate = false;

    if (existingConnection) {
      // Update existing connection
      connectionId = existingConnection.id;
      isUpdate = true;
      console.log('Found existing connection, updating:', {
        connectionId,
        currentStatus: existingConnection.status
      });
    } else {
      // Create new connection
      connectionId = crypto.randomUUID();
      isUpdate = false;
      console.log('No existing connection found, creating new one:', {
        connectionId
      });
    }

    // Encrypt the token using AES-GCM
    let encryptedData;
    try {
      encryptedData = encryptToken(token);
    } catch (error) {
      console.error('Encryption error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to encrypt token.',
          details: error instanceof Error ? error.message : 'Unknown encryption error'
        },
        { status: 500 }
      );
    }

    // Upsert the connection in lms_connections
    const connectionData = {
      id: connectionId,
      owner_id: user.id,
      provider: 'canvas',
      account_identifier: base_url,
      access_meta: {
        profile: profile || null,
        verified_at: new Date().toISOString(),
        last_synced_at: existingConnection?.access_meta?.last_synced_at || null
      },
      status: 'connected'
    };

    console.log(`Attempting to ${isUpdate ? 'update' : 'insert'} lms_connections:`, {
      connectionId,
      owner_id: user.id,
      provider: 'canvas',
      account_identifier: base_url,
      status: 'connected',
      isUpdate
    });

    const { data: connectionResult, error: connectionError } = isUpdate
      ? await anonClient
          .from('lms_connections')
          .update(connectionData)
          .eq('id', connectionId)
          .select()
          .single()
      : await anonClient
          .from('lms_connections')
          .insert(connectionData)
          .select()
          .single();

    if (connectionError) {
      console.error('Error storing connection:', connectionError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to ${isUpdate ? 'update' : 'store'} connection in database.`,
          details: connectionError.message 
        },
        { status: 500 }
      );
    }

    console.log(`Successfully ${isUpdate ? 'updated' : 'stored'} connection:`, connectionResult);

    // Upsert the encrypted token in lms_secrets using service client
    console.log(`Attempting to ${isUpdate ? 'update' : 'insert'} lms_secrets:`, {
      connection_id: connectionId,
      hasEncryptedToken: !!encryptedData.ciphertext,
      hasIV: !!encryptedData.iv
    });

    const secretData = {
      connection_id: connectionId,
      ciphertext_base64: encryptedData.ciphertext,
      iv_base64: encryptedData.iv
    };

    const { error: secretError } = isUpdate
      ? await serviceClient
          .from('lms_secrets')
          .upsert(secretData, { 
            onConflict: 'connection_id',
            ignoreDuplicates: false 
          })
      : await serviceClient
          .from('lms_secrets')
          .insert(secretData);

    if (secretError) {
      console.error('Error storing secret:', secretError);
      // Clean up the connection if secret storage fails
      if (!isUpdate) {
        await anonClient
          .from('lms_connections')
          .delete()
          .eq('id', connectionId);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to ${isUpdate ? 'update' : 'store'} encrypted token.`,
          details: secretError.message 
        },
        { status: 500 }
      );
    }

    console.log(`Successfully ${isUpdate ? 'updated' : 'stored'} encrypted token`);

    // Also create/update lms_accounts record for profile data
    if (profile) {
      const accountData = {
        owner_id: user.id,
        provider: 'canvas',
        base_url: base_url,
        external_user_id: profile.id.toString(),
      };

      const { error: accountError } = await anonClient
        .from('lms_accounts')
        .upsert(accountData, {
          onConflict: 'owner_id,provider,base_url',
          ignoreDuplicates: false,
        });

      if (accountError) {
        console.error('Error creating/updating lms_accounts:', accountError);
        // Don't fail the entire operation if account creation fails
      } else {
        console.log('Successfully created/updated lms_accounts record');
      }
    }

    console.log(`Successfully ${isUpdate ? 'updated' : 'stored'} Canvas connection:`, {
      connectionId,
      base_url,
      profile: profile?.name || 'Unknown',
      userId: user.id,
      action: isUpdate ? 'updated' : 'created'
    });

    return NextResponse.json({
      success: true,
      connectionId,
      action: isUpdate ? 'updated' : 'created'
    });

  } catch (error) {
    console.error('Canvas storage error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save Canvas connection. Please try again.' },
      { status: 500 }
    );
  }
}