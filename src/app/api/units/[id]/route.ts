import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    console.error('getUser error', userErr);
  }
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    // If it's an RLS miss, treat as 404 to avoid info leaks
    console.warn('units by id error', error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ unit: data });
}
