import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/serverClient';
import { createServiceClient } from '@/lib/server/supabase';

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

    const { connection_id } = (await request.json()) as { connection_id?: string };
    if (!connection_id) {
      return NextResponse.json(
        { success: false, error: 'Connection ID is required.' },
        { status: 400 }
      );
    }

    const supabase = createClientFromRequest(request);
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

    const { data: connection, error: fetchError } = await supabase
      .from('lms_connections')
      .select('id, owner_id, platform')
      .eq('id', connection_id)
      .eq('owner_id', user.id)
      .single();

    if (fetchError || !connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found or access denied.' },
        { status: 404 }
      );
    }

    const { error: connectionError } = await supabase
      .from('lms_connections')
      .delete()
      .eq('id', connection_id)
      .eq('owner_id', user.id);

    if (connectionError) {
      console.error('Error deleting connection:', connectionError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete connection.', details: connectionError.message },
        { status: 500 }
      );
    }

    const serviceClient = createServiceClient();
    await serviceClient.from('lms_secrets').delete().eq('connection_id', connection_id);

    return NextResponse.json({
      success: true,
      message: 'Connection disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect. Please try again.' },
      { status: 500 }
    );
  }
}
