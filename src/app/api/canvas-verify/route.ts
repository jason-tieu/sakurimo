import { NextRequest, NextResponse } from 'next/server';
import { isAllowedCanvasHost } from '@/lib/institutions';

export async function POST(request: NextRequest) {
  try {
    const { base_url, token } = await request.json();

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

    // Use same endpoint as sync: /api/v1/users/self/profile
    const baseUrl = base_url.replace(/\/$/, '');
    const canvasResponse = await fetch(`${baseUrl}/api/v1/users/self/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!canvasResponse.ok) {
      const status = canvasResponse.status;
      const body = await canvasResponse.text();
      let message: string;
      if (status === 401) {
        message = 'Invalid access token. Please check your token and try again.';
      } else if (status === 403) {
        message = 'Access denied. Your token may have expired or lack permission.';
      } else if (status >= 500) {
        message = 'Canvas is temporarily unavailable. Please try again later.';
      } else {
        message = 'Couldn\'t verify with Canvas. Please check your token and try again.';
      }
      console.warn('Canvas verify failed', { status, body: body.slice(0, 200) });
      return NextResponse.json(
        { success: false, error: message },
        { status: status === 401 ? 401 : 500 }
      );
    }

    const profile = await canvasResponse.json();

    // Profile endpoint returns primary_email, name, etc.
    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name ?? profile.short_name ?? '',
        email: profile.primary_email ?? profile.login_id ?? '',
        avatar_url: profile.avatar_url,
      },
    });

  } catch (error) {
    console.error('Canvas verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Couldn\'t reach Canvas right now—please try again.' },
      { status: 500 }
    );
  }
}
