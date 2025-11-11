/**
 * A/B Testing Library
 * 
 * Handles visitor test group assignment using cookie-based persistence
 * and hash-based consistent assignment for traffic splitting.
 */

import { cookies } from 'next/headers';

const VISITOR_COOKIE_NAME = 'webinar_visitor_id';
const TEST_GROUP_COOKIE_NAME = 'webinar_test_group';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Generate a unique visitor ID
 */
function generateVisitorId(): string {
  return crypto.randomUUID();
}

/**
 * Get visitor ID from cookie (read-only for Server Components)
 * If no visitor ID exists, generates one but doesn't set the cookie
 * Cookie setting should be handled by client-side or Server Actions
 */
export async function getVisitorId(): Promise<string> {
  const cookieStore = await cookies();
  let visitorId = cookieStore.get(VISITOR_COOKIE_NAME)?.value;
  
  if (!visitorId) {
    // Generate a visitor ID but don't set cookie in Server Component
    // The cookie will be set by the client or Server Action
    visitorId = generateVisitorId();
  }
  
  return visitorId;
}

/**
 * Hash-based consistent assignment
 * Uses visitor ID + webinar ID to deterministically assign test group
 * 
 * @param visitorId Unique visitor identifier
 * @param webinarId Webinar identifier
 * @param trafficSplitPercent Percentage of traffic for Group A (0-100)
 * @returns "A" or "B"
 */
export async function assignTestGroup(
  visitorId: string,
  webinarId: string,
  trafficSplitPercent: number
): Promise<'A' | 'B'> {
  // Create a hash from visitor ID + webinar ID using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(`${visitorId}-${webinarId}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Convert first 8 characters to number (0-4294967295)
  const hashValue = parseInt(hash.substring(0, 8), 16);
  
  // Calculate percentage (0-100)
  const percentage = (hashValue % 100) + 1;
  
  // Assign group based on traffic split
  return percentage <= trafficSplitPercent ? 'A' : 'B';
}

/**
 * Get visitor's test group for a specific webinar
 * Checks cookie first, then assigns consistently if needed
 * Note: This is read-only in Server Components. Cookie setting should be done client-side.
 * 
 * @param webinarId Webinar identifier
 * @param trafficSplitPercent Percentage of traffic for Group A (default 50)
 * @returns "A" or "B"
 */
export async function getVisitorTestGroup(
  webinarId: string,
  trafficSplitPercent: number = 50
): Promise<'A' | 'B'> {
  const cookieStore = await cookies();
  const visitorId = await getVisitorId();
  
  // Check if this visitor already has a test group assigned for this webinar
  const cookieName = `${TEST_GROUP_COOKIE_NAME}_${webinarId}`;
  let testGroup = cookieStore.get(cookieName)?.value as 'A' | 'B' | undefined;
  
  if (!testGroup || (testGroup !== 'A' && testGroup !== 'B')) {
    // Assign test group consistently based on hash
    testGroup = await assignTestGroup(visitorId, webinarId, trafficSplitPercent);
    
    // Note: Cookie will be set by client-side code
    // We can't set cookies in Server Components in Next.js 14+
  }
  
  return testGroup;
}

/**
 * Get test configuration for a visitor
 * Returns which variants to show based on test group
 * 
 * @param webinar Webinar object with A/B testing configuration
 * @param testGroup Visitor's test group ("A" or "B")
 * @returns Configuration object with variant selections
 */
export function getTestConfiguration(
  webinar: {
    enableABTesting: boolean;
    testRegistrationPage: boolean;
    regPageAId: string | null;
    regPageBId: string | null;
    testSchedule: boolean;
    scheduleAIds: string | null;
    scheduleBIds: string | null;
    testOffer: boolean;
    offerAId: string | null;
    offerBId: string | null;
    testVideo: boolean;
    videoAId: string | null;
    videoBId: string | null;
  },
  testGroup: 'A' | 'B'
) {
  // If A/B testing is disabled, return default configuration
  if (!webinar.enableABTesting) {
    return {
      registrationPageId: null,
      scheduleIds: [],
      offerId: null,
      videoId: null,
      isTestGroup: false,
      testGroup: null,
    };
  }
  
  return {
    // Registration Page
    registrationPageId: webinar.testRegistrationPage
      ? (testGroup === 'A' ? webinar.regPageAId : webinar.regPageBId)
      : null,
    
    // Schedule
    scheduleIds: webinar.testSchedule
      ? parseIds(testGroup === 'A' ? webinar.scheduleAIds : webinar.scheduleBIds)
      : [],
    
    // Offer
    offerId: webinar.testOffer
      ? (testGroup === 'A' ? webinar.offerAId : webinar.offerBId)
      : null,
    
    // Video
    videoId: webinar.testVideo
      ? (testGroup === 'A' ? webinar.videoAId : webinar.videoBId)
      : null,
    
    isTestGroup: true,
    testGroup,
  };
}

/**
 * Parse comma-separated IDs into array
 */
function parseIds(idsString: string | null): string[] {
  if (!idsString) return [];
  return idsString.split(',').map(id => id.trim()).filter(id => id.length > 0);
}

/**
 * Get active test elements for a webinar
 * Returns array of element names that are being tested
 */
export function getActiveTestElements(webinar: {
  enableABTesting: boolean;
  testRegistrationPage: boolean;
  testSchedule: boolean;
  testOffer: boolean;
  testVideo: boolean;
}): Array<'registration' | 'schedule' | 'offer' | 'video'> {
  if (!webinar.enableABTesting) return [];
  
  const activeTests: Array<'registration' | 'schedule' | 'offer' | 'video'> = [];
  
  if (webinar.testRegistrationPage) activeTests.push('registration');
  if (webinar.testSchedule) activeTests.push('schedule');
  if (webinar.testOffer) activeTests.push('offer');
  if (webinar.testVideo) activeTests.push('video');
  
  return activeTests;
}

/**
 * Validate A/B test configuration
 * Returns array of validation errors
 */
export function validateABTestConfiguration(webinar: {
  enableABTesting: boolean;
  trafficSplitPercent: number;
  testRegistrationPage: boolean;
  regPageAId: string | null;
  regPageBId: string | null;
  testSchedule: boolean;
  scheduleAIds: string | null;
  scheduleBIds: string | null;
  testOffer: boolean;
  offerAId: string | null;
  offerBId: string | null;
  testVideo: boolean;
  videoAId: string | null;
  videoBId: string | null;
}): string[] {
  const errors: string[] = [];
  
  if (!webinar.enableABTesting) return errors;
  
  // Validate traffic split
  if (webinar.trafficSplitPercent < 0 || webinar.trafficSplitPercent > 100) {
    errors.push('Traffic split must be between 0 and 100');
  }
  
  // Validate at least one test is enabled
  if (!webinar.testRegistrationPage && !webinar.testSchedule && 
      !webinar.testOffer && !webinar.testVideo) {
    errors.push('At least one test must be enabled');
  }
  
  // Validate registration page test
  if (webinar.testRegistrationPage) {
    if (!webinar.regPageAId || !webinar.regPageBId) {
      errors.push('Both registration pages must be selected');
    }
    if (webinar.regPageAId === webinar.regPageBId) {
      errors.push('Registration pages must be different');
    }
  }
  
  // Validate schedule test
  if (webinar.testSchedule) {
    const scheduleAIds = parseIds(webinar.scheduleAIds);
    const scheduleBIds = parseIds(webinar.scheduleBIds);
    
    if (scheduleAIds.length === 0 || scheduleBIds.length === 0) {
      errors.push('Both schedule variants must have at least one schedule');
    }
  }
  
  // Validate offer test
  if (webinar.testOffer) {
    if (!webinar.offerAId || !webinar.offerBId) {
      errors.push('Both offers must be selected');
    }
    if (webinar.offerAId === webinar.offerBId) {
      errors.push('Offers must be different');
    }
  }
  
  // Validate video test
  if (webinar.testVideo) {
    if (!webinar.videoAId || !webinar.videoBId) {
      errors.push('Both videos must be provided');
    }
    if (webinar.videoAId === webinar.videoBId) {
      errors.push('Videos must be different');
    }
  }
  
  return errors;
}
