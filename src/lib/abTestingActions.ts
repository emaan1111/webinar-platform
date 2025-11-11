'use server';

/**
 * A/B Testing Server Actions
 * 
 * Handles cookie setting for visitor tracking and test group persistence
 */

import { cookies } from 'next/headers';

const VISITOR_COOKIE_NAME = 'webinar_visitor_id';
const TEST_GROUP_COOKIE_NAME = 'webinar_test_group';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Server Action: Set visitor ID cookie
 * This can be called from client components to persist the visitor ID
 */
export async function setVisitorIdCookie(visitorId: string) {
  const cookieStore = await cookies();
  cookieStore.set(VISITOR_COOKIE_NAME, visitorId, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Server Action: Set test group cookie
 * This can be called from client components to persist the test group
 */
export async function setTestGroupCookie(webinarId: string, testGroup: 'A' | 'B') {
  const cookieStore = await cookies();
  const cookieName = `${TEST_GROUP_COOKIE_NAME}_${webinarId}`;
  cookieStore.set(cookieName, testGroup, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}
