import { describe, it, expect, vi, afterEach } from 'vitest'

// The module binds the API key at import time; set it before importing so
// registerUserToWebinar doesn't short-circuit with "not configured".
process.env.WEBINARJAM_API_KEY = 'test-key'
const { matchScheduleForSession, registerUserToWebinar } = await import('../webinarjam')

// Mirrors the real /webinar response for UM - NEW OFFER ADS AUG 2 (id 167).
const schedules = [
  { schedule: 1098, date: '2026-09-03 19:45', time: '19:45', timezone: 'America/New_York', comment: 'Just in time' },
  { schedule: 1101, date: '2026-09-04 11:00', time: '11:00', timezone: 'America/New_York', comment: 'Every day, 11:00 AM' },
  { schedule: 1100, date: '2026-09-04 19:00', time: '19:00', timezone: 'America/New_York', comment: 'Every day, 7:00 PM' },
]

describe('matchScheduleForSession', () => {
  it('matches a recurring block by the registrant-local wall-clock time', () => {
    // 10:00 UTC in September is 11:00 in London (BST) — the 11 AM daily block.
    const id = matchScheduleForSession(schedules, new Date('2026-09-04T10:00:00Z'), 'Europe/London')
    expect(id).toBe('1101')
  })

  it('falls back to the Just in time block for a JIT pick', () => {
    // 23:10 UTC is 09:10 in Sydney — no recurring block runs at :10.
    const id = matchScheduleForSession(schedules, new Date('2026-09-03T23:10:00Z'), 'Australia/Sydney')
    expect(id).toBe('1098')
  })

  it('falls back to the Just in time block without a timezone', () => {
    expect(matchScheduleForSession(schedules, new Date('2026-09-04T10:00:00Z'), null)).toBe('1098')
  })

  it('falls back to the Just in time block on an unknown timezone', () => {
    expect(matchScheduleForSession(schedules, new Date('2026-09-04T10:00:00Z'), 'Not/AZone')).toBe('1098')
  })

  it('refuses an ambiguous wall-clock match rather than guessing the block', () => {
    const ambiguous = [
      ...schedules,
      { schedule: 1102, date: '2026-09-07 11:00', time: '11:00', timezone: 'America/New_York', comment: 'Every Monday, 11:00 AM' },
    ]
    const id = matchScheduleForSession(ambiguous, new Date('2026-09-04T10:00:00Z'), 'Europe/London')
    expect(id).toBe('1098')
  })

  it('returns null when nothing matches and no Just in time block exists', () => {
    const noJit = schedules.filter((s) => s.comment !== 'Just in time')
    expect(matchScheduleForSession(noJit, new Date('2026-09-04T02:23:00Z'), 'Europe/London')).toBeNull()
  })
})

describe('registerUserToWebinar retries', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const successBody = JSON.stringify({
    status: 'success',
    user: { live_room_url: 'https://event.webinarjam.com/go/live/1/x', replay_room_url: 'https://event.webinarjam.com/go/replay/1/x' },
  })

  it('retries a network failure and captures the link on the second attempt', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response(successBody, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await registerUserToWebinar('167', '1098', { firstName: 'Yasmin', email: 'y@example.com' }, 'everwebinar')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.success).toBe(true)
    expect(result.liveRoomUrl).toBe('https://event.webinarjam.com/go/live/1/x')
  })

  it('retries a 5xx response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('oops', { status: 502 }))
      .mockResolvedValueOnce(new Response(successBody, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await registerUserToWebinar('167', '1098', { firstName: 'Yasmin', email: 'y@example.com' }, 'everwebinar')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.success).toBe(true)
  })

  it('does not retry a validation error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('unprocessable', { status: 422 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await registerUserToWebinar('167', '0', { firstName: 'Yasmin', email: 'y@example.com' }, 'everwebinar')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(false)
  })
})
