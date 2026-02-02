/**
 * Server-side Canvas API helpers
 */

import { CanvasAssignment, CanvasAssignmentGroup, CanvasCourse, CanvasLinkHeader } from '../canvas/types';
import { createServiceClient } from './supabase';
import { decryptToken } from './encryption';

/**
 * Get Canvas token for user: read connection (platform=canvas), then lms_secrets (service role), decrypt.
 */
export async function getCanvasTokenForUser(userId: string): Promise<string | null> {
  try {
    const serviceClient = createServiceClient();
    const { data: connection, error: connectionError } = await serviceClient
      .from('lms_connections')
      .select('id')
      .eq('owner_id', userId)
      .eq('platform', 'canvas')
      .maybeSingle();

    if (connectionError || !connection) return null;

    const { data: secret, error: secretError } = await serviceClient
      .from('lms_secrets')
      .select('token_ciphertext, token_iv')
      .eq('connection_id', connection.id)
      .maybeSingle();

    if (secretError || !secret) return null;

    try {
      return decryptToken({
        ciphertext: secret.token_ciphertext,
        iv: secret.token_iv,
      });
    } catch {
      return null;
    }
  } catch (error) {
    console.error('Error getting Canvas token for user:', userId, error);
    return null;
  }
}

/**
 * Fetch JSON from Canvas API with proper error handling
 */
export async function fetchCanvasJson<T>(
  baseUrl: string,
  path: string,
  token: string
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('Canvas token expired; please reconnect');
  }
  if (!response.ok) {
    throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function parseLinkHeader(linkHeader: string | null): CanvasLinkHeader {
  if (!linkHeader) return {};
  const links: CanvasLinkHeader = {};
  const linkRegex = /<([^>]+)>;\s*rel="([^"]+)"/g;
  let match;
  while ((match = linkRegex.exec(linkHeader)) !== null) {
    const [, url, rel] = match;
    links[rel as keyof CanvasLinkHeader] = url;
  }
  return links;
}

/**
 * Paginate through Canvas courses
 */
export async function paginateCourses(
  baseUrl: string,
  token: string
): Promise<CanvasCourse[]> {
  const allCourses: CanvasCourse[] = [];
  let nextUrl: string | null = `${baseUrl.replace(/\/$/, '')}/api/v1/courses?include[]=enrollments&per_page=50`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('Canvas token expired; please reconnect');
    }
    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
    }

    const courses: CanvasCourse[] = await response.json();
    allCourses.push(...courses);
    const linkHeader = response.headers.get('Link');
    const links = parseLinkHeader(linkHeader);
    nextUrl = links.next || null;
  }

  return allCourses;
}

/**
 * Fetch assignment groups for a course (single request, no pagination by default).
 */
export async function fetchAssignmentGroups(
  baseUrl: string,
  token: string,
  courseId: string | number
): Promise<CanvasAssignmentGroup[]> {
  const path = `/api/v1/courses/${courseId}/assignment_groups`;
  const data = await fetchCanvasJson<CanvasAssignmentGroup[]>(baseUrl, path, token);
  return Array.isArray(data) ? data : [];
}

/**
 * Get total assignment count for a course (lightweight: per_page=1, parse Link rel="last").
 * Returns null if Canvas does not include "last" in the Link header.
 */
export async function getAssignmentCount(
  baseUrl: string,
  token: string,
  courseId: string | number
): Promise<number | null> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/v1/courses/${courseId}/assignments?per_page=1`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error('Canvas token expired; please reconnect');
  }
  if (!response.ok) {
    throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
  }
  const linkHeader = response.headers.get('Link');
  const links = parseLinkHeader(linkHeader);
  const lastUrl = links.last;
  if (!lastUrl) return null;
  try {
    const parsed = new URL(lastUrl);
    const page = parsed.searchParams.get('page');
    if (page == null) return null;
    const n = parseInt(page, 10);
    return Number.isNaN(n) || n < 1 ? null : n;
  } catch {
    return null;
  }
}

/**
 * Paginate through Canvas assignments for a course (Link header, per_page=100).
 */
export async function paginateAssignments(
  baseUrl: string,
  token: string,
  courseId: string | number
): Promise<CanvasAssignment[]> {
  const all: CanvasAssignment[] = [];
  let nextUrl: string | null = `${baseUrl.replace(/\/$/, '')}/api/v1/courses/${courseId}/assignments?per_page=100`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('Canvas token expired; please reconnect');
    }
    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
    }

    const page: CanvasAssignment[] = await response.json();
    all.push(...page);
    const linkHeader = response.headers.get('Link');
    const links = parseLinkHeader(linkHeader);
    nextUrl = links.next || null;
  }

  return all;
}
