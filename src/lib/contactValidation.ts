/**
 * Shared email / phone input validation for every registration entry point.
 *
 * Registrations used to accept whatever the visitor typed. Two shapes caused
 * real damage in production:
 *
 *  - Emails with no TLD (`someone@gmail`) — accepted, then every confirmation
 *    and reminder email bounced silently.
 *  - Phone numbers carrying the dialling code twice (`+234 +234 803 669 7611`),
 *    because the lead-page form pairs a dialling-code <select> with a free-text
 *    number box and nothing stopped the visitor typing the code into both.
 *    Anything past E.164's 15-digit ceiling was rejected downstream.
 *
 * So: repair what can be repaired unambiguously (a dialling code typed into the
 * number box, a national trunk `0`, spaces and punctuation), and reject the rest
 * loudly at the form instead of storing it.
 */

/** E.164 allows at most 15 digits including the country code; 7 is the shortest real number. */
export const PHONE_MIN_DIGITS = 7
export const PHONE_MAX_DIGITS = 15

export const EMAIL_ERROR = 'Please enter a valid email address.'
export const PHONE_ERROR = `Please enter a valid mobile number (${PHONE_MIN_DIGITS}–${PHONE_MAX_DIGITS} digits, without the country code).`

// Deliberately stricter than the RFC: a domain must carry a dotted TLD of two or
// more letters, which is the part that lets `someone@gmail` through otherwise.
const EMAIL_RE =
  /^[^\s@,;:<>()[\]\\"]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/

const digitsOnly = (value: string): string => value.replace(/[^0-9]/g, '')

/** Trim + lowercase. Storage and lookups are already case-insensitive; this makes it explicit. */
export function normalizeEmail(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase()
}

export function isValidEmail(raw: string | null | undefined): boolean {
  const email = normalizeEmail(raw)
  // The length cap keeps a pathological input from reaching the regex at all.
  return email.length <= 254 && EMAIL_RE.test(email)
}

export interface NormalizedPhone {
  /** E.164 (`+` then 7–15 digits) when the input was understood, `null` when it was blank or unusable. */
  e164: string | null
  /** Set only when a non-empty input could not be salvaged. */
  error?: string
}

/**
 * Fold a dialling-code selection and a typed number into one E.164 string.
 *
 * A `+` typed into the number box means the visitor supplied their own dialling
 * code, so it wins over the selector — which is usually still sitting on its
 * `+1` default and is what produced the doubled-prefix numbers.
 */
export function normalizePhone(
  raw: string | null | undefined,
  countryCode?: string | null
): NormalizedPhone {
  const input = (raw ?? '').trim()
  if (!input) return { e164: null }

  const cc = digitsOnly(countryCode ?? '')
  let national = digitsOnly(input)

  if (!input.startsWith('+')) {
    // The code typed into the number box as bare digits, duplicating the selector.
    // Only strip it when what remains is still long enough to be a real number,
    // so a genuine number that merely starts with those digits survives.
    if (cc && national.startsWith(cc) && national.length - cc.length >= PHONE_MIN_DIGITS) {
      national = national.slice(cc.length)
    }
    // National trunk prefix — "0413…" is dialled as "+61 413…", never "+61 0413…".
    national = national.replace(/^0+/, '')
    national = cc + national
  }

  if (national.length < PHONE_MIN_DIGITS || national.length > PHONE_MAX_DIGITS) {
    return { e164: null, error: PHONE_ERROR }
  }

  return { e164: `+${national}` }
}
