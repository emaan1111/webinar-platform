/**
 * Referral System Utilities
 * Generate and validate referral codes
 */

/**
 * Generate a unique referral code
 * Format: 6 characters, alphanumeric, uppercase
 * Example: "ABC123", "XYZ789"
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Build referral link for a webinar
 */
export function buildReferralLink(
  webinarSlug: string,
  referralCode: string,
  baseUrl?: string
): string {
  // Priority: 1) Provided baseUrl, 2) NEXT_PUBLIC_APP_URL, 3) NEXTAUTH_URL, 4) Request host
  const base = baseUrl || 
               process.env.NEXT_PUBLIC_APP_URL || 
               process.env.NEXTAUTH_URL ||
               (typeof window !== 'undefined' ? window.location.origin : '') ||
               (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
               'https://webinar-platform-production.up.railway.app';
  return `${base}/w/${webinarSlug}?ref=${referralCode}`;
}

/**
 * Extract referral code from URL parameters
 */
export function extractReferralCode(searchParams: URLSearchParams): string | null {
  const ref = searchParams.get('ref');
  return ref && isValidReferralCode(ref) ? ref : null;
}
