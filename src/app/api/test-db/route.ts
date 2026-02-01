import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Test database connection by querying lms_connections
    const { data, error } = await supabase
      .from('lms_connections')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Database test error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: data
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
