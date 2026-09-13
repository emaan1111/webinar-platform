import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getUsdAudRate, usdToAud, __resetFxCacheForTests } from '../fx'

const okResponse = (aud: number) => ({ ok: true, json: async () => ({ rates: { AUD: aud } }) })

describe('getUsdAudRate', () => {
  beforeEach(() => {
    __resetFxCacheForTests()
    delete process.env.FX_USD_AUD
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.FX_USD_AUD
  })

  it('returns the live rate when the API answers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(1.52)))
    const r = await getUsdAudRate()
    expect(r.rate).toBe(1.52)
    expect(r.source).toBe('live')
  })

  it('serves the cached rate for a day, without re-fetching', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(1.52))
    vi.stubGlobal('fetch', fetchMock)
    const start = new Date('2026-09-14T00:00:00Z')
    await getUsdAudRate(start)

    const sixHoursLater = new Date(start.getTime() + 6 * 60 * 60 * 1000)
    const second = await getUsdAudRate(sixHoursLater)
    expect(second.source).toBe('cached')
    expect(second.rate).toBe(1.52)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('re-fetches once the cache is over a day old', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okResponse(1.52))
      .mockResolvedValueOnce(okResponse(1.61))
    vi.stubGlobal('fetch', fetchMock)
    const start = new Date('2026-09-14T00:00:00Z')
    await getUsdAudRate(start)

    const twoDaysLater = new Date(start.getTime() + 48 * 60 * 60 * 1000)
    const fresh = await getUsdAudRate(twoDaysLater)
    expect(fresh.rate).toBe(1.61)
    expect(fresh.source).toBe('live')
  })

  // The point of the module: reports must render even when FX is unreachable.
  it('falls back to the last good rate when the API fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okResponse(1.52))
      .mockRejectedValueOnce(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)
    const start = new Date('2026-09-14T00:00:00Z')
    await getUsdAudRate(start)

    const later = new Date(start.getTime() + 48 * 60 * 60 * 1000)
    const stale = await getUsdAudRate(later)
    expect(stale.rate).toBe(1.52)
    expect(stale.source).toBe('cached')
  })

  it('falls back to FX_USD_AUD when there is no cached rate', async () => {
    process.env.FX_USD_AUD = '1.48'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const r = await getUsdAudRate()
    expect(r.rate).toBe(1.48)
    expect(r.source).toBe('env')
  })

  it('falls back to a constant when there is no cache and no env rate', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const r = await getUsdAudRate()
    expect(r.source).toBe('fallback')
    expect(r.rate).toBeGreaterThan(0)
  })

  it('rejects an implausible rate rather than trusting it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(0.0001)))
    const r = await getUsdAudRate()
    expect(r.source).toBe('fallback')
  })

  it('rejects a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
    const r = await getUsdAudRate()
    expect(r.source).toBe('fallback')
  })
})

describe('usdToAud', () => {
  it('multiplies by the rate', () => {
    expect(usdToAud(297, 1.5)).toBe(445.5)
  })
})
