/**
 * USD -> AUD conversion for the reports table.
 *
 * Ad spend arrives from Facebook in the ad account's currency (AUD) while sales
 * are priced in USD, so profit and ROI were subtracting one from the other.
 * Everything that has to be compared is converted to AUD here.
 *
 * The rate is fetched once a day and cached in memory. A reports request must
 * never fail because an FX host is down, so every failure path falls back to the
 * last good rate, then to FX_USD_AUD, then to a constant — and the result always
 * says which, so the UI can disclose a stale or fallback rate rather than
 * presenting it as live.
 */

export type RateSource = 'live' | 'cached' | 'env' | 'fallback'

export type UsdAudRate = {
  rate: number
  source: RateSource
  /** When the live rate was fetched. Null when no live fetch has ever succeeded. */
  fetchedAt: Date | null
}

/**
 * Last-resort rate, used only when the API is unreachable and FX_USD_AUD is
 * unset. The ECB rate on 2026-09-11; it will drift, which is why anything using
 * it is reported with source 'fallback' so the UI can say so rather than
 * presenting it as a live quote.
 */
const FALLBACK_USD_AUD = 1.3942

/**
 * Frankfurter: ECB reference rates, no API key, no rate limit worth worrying
 * about. Use the .dev host — api.frankfurter.app now 301s here, and a redirect
 * is one more thing to fail on.
 */
const RATE_URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=AUD'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

let cached: { rate: number; fetchedAt: Date } | null = null
let inFlight: Promise<UsdAudRate> | null = null

/** A plausible USD->AUD quote. Guards against an API returning junk. */
function isSaneRate(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0.5 && n < 5
}

function envRate(): number | null {
  const raw = process.env.FX_USD_AUD
  if (!raw) return null
  const parsed = Number(raw)
  return isSaneRate(parsed) ? parsed : null
}

function withoutLiveRate(): UsdAudRate {
  if (cached) return { rate: cached.rate, source: 'cached', fetchedAt: cached.fetchedAt }
  const fromEnv = envRate()
  if (fromEnv !== null) return { rate: fromEnv, source: 'env', fetchedAt: null }
  return { rate: FALLBACK_USD_AUD, source: 'fallback', fetchedAt: null }
}

/**
 * How many AUD one USD buys. Served from cache for a day; on any failure the
 * caller still gets a usable rate, flagged with where it came from.
 */
export async function getUsdAudRate(now: Date = new Date()): Promise<UsdAudRate> {
  if (cached && now.getTime() - cached.fetchedAt.getTime() < ONE_DAY_MS) {
    return { rate: cached.rate, source: 'cached', fetchedAt: cached.fetchedAt }
  }

  // Collapse concurrent refreshes; a reports page load fans out several queries.
  if (inFlight) return inFlight

  inFlight = (async (): Promise<UsdAudRate> => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(RATE_URL, { signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`FX API returned ${res.status}`)

      const body = await res.json()
      const rate = body?.rates?.AUD
      if (!isSaneRate(rate)) throw new Error(`FX API returned an implausible rate: ${rate}`)

      cached = { rate, fetchedAt: now }
      return { rate, source: 'live', fetchedAt: now }
    } catch (err) {
      console.error('[fx] USD->AUD lookup failed, falling back:', err)
      return withoutLiveRate()
    } finally {
      inFlight = null
    }
  })()

  return inFlight
}

/** Convert a USD amount to AUD. */
export const usdToAud = (usd: number, rate: number): number => usd * rate

/** Test seam: drop the cached rate. */
export function __resetFxCacheForTests() {
  cached = null
  inFlight = null
}
