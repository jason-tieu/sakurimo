import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, authenticateUserFromToken } from '@/lib/server/supabase';
import { fetchCanvasJson, paginateCourses } from '@/lib/server/canvas';
import { mapCanvasProfileToAccountFields, pickEnrollmentRole } from '@/lib/canvas/map';
import { upsertUnit, upsertUnitSource, upsertEnrollment } from '@/server/db/units';
import { CanvasSelfProfile } from '@/lib/canvas/types';
import { isAllowedCanvasHost } from '@/lib/institutions';

// Ensure this runs on Node.js runtime (not Edge)
export const runtime = 'nodejs';

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://sakurimo.vercel.app',
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
        { ok: false, error: 'CORS policy violation' },
        { status: 403 }
      );
    }

    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Authorization header with Bearer token is required.' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);

    // 1) get session; require uid
    let user;
    try {
      user = await authenticateUserFromToken(accessToken);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { ok: false, error: 'Invalid or expired access token.' },
        { status: 401 }
      );
    }

    if (!user?.id) {
      return NextResponse.json(
        { ok: false, error: 'No session user; cannot sync units.' },
        { status: 401 }
      );
    }

    console.log('Canvas sync request for user:', {
      id: user.id,
      email: user.email,
    });

    // Create clients
    const serviceClient = createServiceClient();

    // 2) read connection (server-only, service role)
    const { data: conn, error: connError } = await serviceClient
      .from('lms_connections')
      .select('id, owner_id, provider, account_identifier, status')
      .eq('owner_id', user.id)
      .eq('provider', 'canvas')
      .eq('status', 'connected')
      .maybeSingle();

    if (connError) {
      console.error('Error fetching Canvas connection:', connError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch Canvas connection' },
        { status: 500 }
      );
    }

    if (!conn) {
      return NextResponse.json(
        { ok: false, error: 'Canvas not connected' },
        { status: 400 }
      );
    }

    // Get the access token from lms_secrets
    const { data: secret, error: secretError } = await serviceClient
      .from('lms_secrets')
      .select('ciphertext_base64, iv_base64')
      .eq('connection_id', conn.id)
      .maybeSingle();

    if (secretError) {
      console.error('Error fetching Canvas secret:', secretError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch Canvas token' },
        { status: 500 }
      );
    }

    if (!secret) {
      return NextResponse.json(
        { ok: false, error: 'Canvas token missing; reconnect' },
        { status: 401 }
      );
    }

    // Decrypt the token
    let token;
    try {
      const { decryptToken } = await import('@/lib/encryption');
      token = decryptToken({
        ciphertext: secret.ciphertext_base64,
        iv: secret.iv_base64
      });
    } catch (error) {
      console.error('Error decrypting Canvas token:', error);
      return NextResponse.json(
        { ok: false, error: 'Canvas token corrupted; reconnect' },
        { status: 401 }
      );
    }

    // 3) read (or create) account
    const { data: acctData } = await serviceClient
      .from('lms_accounts')
      .select('*')
      .eq('owner_id', user.id)
      .eq('provider', 'canvas')
      .eq('base_url', conn.account_identifier) // ensure exact match
      .maybeSingle();
    let acct = acctData;

    // 4) fetch profile first if account missing OR external_user_id null
    const baseUrl = conn.account_identifier;

    // Security check: validate base URL is whitelisted
    if (!isAllowedCanvasHost(baseUrl)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid Canvas host. Only whitelisted universities are supported.' },
        { status: 400 }
      );
    }

    if (!acct || !acct.external_user_id) {
      try {
        const profile = await fetchCanvasJson<CanvasSelfProfile>(baseUrl, '/api/v1/users/self/profile', token);
        const fields = mapCanvasProfileToAccountFields(profile);
        const { data: upserted } = await serviceClient
          .from('lms_accounts')
          .upsert({
            owner_id: user.id,
            provider: 'canvas',
            base_url: baseUrl,
            ...fields,
          }, { onConflict: 'owner_id,provider,base_url' })
          .select('*')
          .maybeSingle();
        acct = upserted ?? acct;
      } catch (error) {
        console.error('Profile sync error:', error);
        // Continue with course sync even if profile fails
      }
    }

    // 5) paginate courses
    let courses;
    try {
      courses = await paginateCourses(baseUrl, token);
    } catch (error) {
      console.error('Canvas API error:', error);
      
      if (error instanceof Error && error.message.includes('Canvas token expired')) {
        return NextResponse.json(
          { ok: false, error: 'Canvas token expired; please reconnect' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { ok: false, error: `Canvas API error: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 502 }
      );
    }

    // 6) Pre-check existing units for accurate counting
    const { data: existingUnits, error: existingError } = await serviceClient
      .from('units')
      .select('canvas_course_id')
      .eq('owner_id', user.id);

    if (existingError) {
      console.error('Error fetching existing units:', existingError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch existing units' },
        { status: 500 }
      );
    }

    const existingSet = new Set(existingUnits?.map(r => String(r.canvas_course_id)) ?? []);

    // 7) Upsert units + sources + enrollments
    let added = 0, updated = 0, skipped = 0;
    const errors: string[] = [];
    
    for (const c of courses) {
      try {
        // Skip courses without required data
        if (!c.id) {
          skipped++;
          errors.push(`Course missing ID`);
          continue;
        }

        if (!c.name) {
          skipped++;
          errors.push(`Course ${c.id} missing name`);
          continue;
        }

        // Skip courses that are not available and have no enrollments
        const hasAnyEnrollment = c.enrollments && c.enrollments.length > 0;
        if (c.workflow_state && c.workflow_state !== 'available') { 
          skipped++; 
          continue; 
        }
        if (!hasAnyEnrollment) { 
          skipped++; 
          continue; 
        }

        const willInsert = !existingSet.has(String(c.id));
        const role = pickEnrollmentRole(c);

        const { unitId, isInsert } = await upsertUnit(serviceClient, c, user.id, willInsert);
        
        if (isInsert) {
          added++;
          existingSet.add(String(c.id)); // Add to set for future iterations
        } else {
          updated++;
        }

        await upsertUnitSource(serviceClient, {
          unit_id: unitId,
          provider: 'canvas',
          external_course_id: String(c.id),
          external_account_id: c.account_id ? String(c.account_id) : null,
          external_sis_id: c.sis_course_id || null,
        });

        await upsertEnrollment(serviceClient, {
          owner_id: user.id,
          unit_id: unitId,
          source: 'canvas',
          role,
          semester: null, // Will be derived from course data
          year: null, // Will be derived from course data
        });

        console.log(`${isInsert ? 'Added' : 'Updated'} course ${c.id} (${c.course_code || 'no-code'})`);
      } catch (error) {
        console.error(`Error processing course ${c.id}:`, error);
        skipped++;
        errors.push(`Course ${c.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // 8) Build summary
    const summary = { 
      added, 
      updated, 
      skipped, 
      total: courses.length, 
      errors: errors.length 
    };

    console.log('Canvas sync completed:', summary);

    // Log 2 example rows for debugging
    if (added > 0 || updated > 0) {
      const { data: sampleUnits } = await serviceClient
        .from('units')
        .select('canvas_course_id, code, title, term')
        .eq('owner_id', user.id)
        .limit(2);
      
      if (sampleUnits && sampleUnits.length > 0) {
        console.log('Sample units:', sampleUnits.map(u => ({
          id: u.canvas_course_id,
          code: u.code,
          title: u.title,
          term: u.term
        })));
      }
    }

    return NextResponse.json({
      ok: true,
      profileSaved: Boolean(acct?.external_user_id),
      ...summary
    });

  } catch (error) {
    console.error('Canvas sync error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to sync Canvas data. Please try again.' },
      { status: 500 }
    );
  }
}
