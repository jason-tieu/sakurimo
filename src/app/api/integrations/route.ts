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

export async function GET(request: NextRequest) {
  try {
    // CORS check
    if (!checkCORS(request)) {
      return NextResponse.json(
        { success: false, error: 'CORS policy violation' },
        { status: 403 }
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

    console.log('Fetching connections for user:', {
      id: user.id,
      email: user.email
    });

    // Create anon client for database operations (respects RLS)
    const anonClient = createClientFromRequest(request);

    // Fetch all LMS connections for this user
    const { data: connections, error: connectionsError } = await anonClient
      .from('lms_connections')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (connectionsError) {
      console.error('Error fetching connections:', connectionsError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch connections.',
          details: connectionsError.message 
        },
        { status: 500 }
      );
    }

    console.log('Successfully fetched connections:', {
      count: connections?.length || 0,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      connections: connections || []
    });

  } catch (error) {
    console.error('Integrations fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch integrations. Please try again.' },
      { status: 500 }
    );
  }
}
