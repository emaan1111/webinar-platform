import { describe, it, expect } from 'vitest'
import { buildWebinarPushFields } from '../emaan'

const base = {
  externalWebinarId: 'ext_1',
  webinarName: 'UM - Test',
  sessionType: 'everwebinar' as const,
}

describe('buildWebinarPushFields', () => {
  it('sends no attendance fields on a registration push', () => {
    const fields = buildWebinarPushFields({
      ...base,
      scheduledStartTime: new Date('2026-09-01T01:00:00Z'),
    })
    expect(fields.webinar_time).toBe('2026-09-01T01:00:00.000Z')
    expect(fields).not.toHaveProperty('webinar_attended_live')
    expect(fields).not.toHaveProperty('webinar_attended_replay')
  })

  it('keeps live and replay attendance apart', () => {
    const fields = buildWebinarPushFields({
      ...base,
      attended: false,
      watchTimeMinutes: 0,
      attendedReplay: true,
      replayMinutes: 42,
    })
    expect(fields.webinar_attended_live).toBe(false)
    expect(fields.webinar_minutes_live).toBe(0)
    expect(fields.webinar_attended_replay).toBe(true)
    expect(fields.webinar_minutes_replay).toBe(42)
  })

  it('omits webinar_time on an attendance-only push so Emaan keeps its own session time', () => {
    const fields = buildWebinarPushFields({
      ...base,
      scheduledStartTime: null,
      attended: true,
      watchTimeMinutes: 84,
    })
    expect(fields.webinar_time).toBeUndefined()
    expect(fields.webinar_attended_live).toBe(true)
  })
})
