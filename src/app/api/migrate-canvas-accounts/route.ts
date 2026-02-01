import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Legacy migration route. New schema uses lms_connections + lms_secrets only;
 * lms_accounts is no longer part of the Canvas integration flow.
 */
export async function POST() {
  return NextResponse.json({
    ok: true,
    message: 'Schema updated; lms_accounts migration no longer applicable.',
    migrated: 0,
  });
}
