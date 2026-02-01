import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/serverClient';

export const runtime = 'nodejs';

const allowedOrigins = ['http://localhost:3000', 'https://sakurimo.vercel.app'];

function checkCORS(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return !origin || allowedOrigins.includes(origin);
}

export async function GET(request: NextRequest) {
  try {
    if (!checkCORS(request)) {
      return NextResponse.json(
        { success: false, error: 'CORS policy violation' },
        { status: 403 }
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

    const { data: connections, error } = await supabase
      .from('lms_connections')
      .select('id, owner_id, platform, institution, base_url, display_name, last_synced_at, created_at, updated_at')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch connections.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connections: connections ?? [],
    });
  } catch (err) {
    console.error('Integrations fetch error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch integrations. Please try again.' },
      { status: 500 }
    );
  }
}
