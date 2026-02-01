import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/serverClient';
import { createServiceClient, authenticateUserFromToken } from '@/lib/server/supabase';

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

    const { connection_id } = await request.json();

    if (!connection_id) {
      return NextResponse.json(
        { success: false, error: 'Connection ID is required.' },
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

    console.log('Disconnecting connection for user:', {
      connectionId: connection_id,
      userId: user.id,
      email: user.email
    });

    // Create service client for database operations
    const serviceClient = createServiceClient();
    const anonClient = createClientFromRequest(request);

    // First, verify the connection belongs to the user
    const { data: connection, error: fetchError } = await anonClient
      .from('lms_connections')
      .select('id, owner_id, provider')
      .eq('id', connection_id)
      .eq('owner_id', user.id)
      .single();

    if (fetchError || !connection) {
      console.error('Connection not found or access denied:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Connection not found or access denied.' },
        { status: 404 }
      );
    }

    console.log('Found connection to disconnect:', {
      connectionId: connection.id,
      provider: connection.provider,
      ownerId: connection.owner_id
    });

    // Delete the connection from lms_connections using anon client (respects RLS)
    const { error: connectionError } = await anonClient
      .from('lms_connections')
      .delete()
      .eq('id', connection_id)
      .eq('owner_id', user.id);

    if (connectionError) {
      console.error('Error deleting connection:', connectionError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to delete connection.',
          details: connectionError.message 
        },
        { status: 500 }
      );
    }

    // Delete the associated secrets using service client
    const { error: secretError } = await serviceClient
      .from('lms_secrets')
      .delete()
      .eq('connection_id', connection_id);

    if (secretError) {
      console.error('Error deleting secrets:', secretError);
      // Don't fail the request if secrets deletion fails, as the connection is already deleted
      console.warn('Connection deleted but secrets cleanup failed:', secretError.message);
    }

    console.log('Successfully disconnected connection:', {
      connectionId: connection_id,
      provider: connection.provider,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Connection disconnected successfully'
    });

  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect. Please try again.' },
      { status: 500 }
    );
  }
}
