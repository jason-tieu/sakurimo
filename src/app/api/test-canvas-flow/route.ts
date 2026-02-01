/**
 * Test endpoint for Canvas flow
 * This is for development/testing only - remove in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, authenticateUserFromToken } from '@/lib/server/supabase';
import { encryptToken, decryptToken } from '@/lib/server/encryption';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Test endpoint not available in production' },
        { status: 404 }
      );
    }

    const { testToken } = await request.json();

    if (!testToken) {
      return NextResponse.json(
        { success: false, error: 'testToken is required' },
        { status: 400 }
      );
    }

    // Test encryption/decryption
    console.log('Testing encryption with token:', testToken.substring(0, 10) + '...');
    
    const encrypted = encryptToken(testToken);
    console.log('Encrypted successfully:', {
      hasCiphertext: !!encrypted.ciphertext,
      hasIV: !!encrypted.iv
    });

    const decrypted = decryptToken(encrypted);
    console.log('Decrypted successfully:', decrypted === testToken);

    // Test service client
    const serviceClient = createServiceClient();
    console.log('Service client created successfully');

    return NextResponse.json({
      success: true,
      encryptionTest: decrypted === testToken,
      serviceClientTest: !!serviceClient,
      message: 'All tests passed'
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
