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

  it('carries the mostly-attended flag for a replay-only watcher', () => {
    // Missed the live session, watched the recording past the threshold:
    // must arrive flagged mostly attended, not just replay-attended.
    const fields = buildWebinarPushFields({
      ...base,
      attended: false,
      watchTimeMinutes: 0,
      attendedReplay: true,
      replayMinutes: 55,
      mostlyAttended: true,
    })
    expect(fields.webinar_attended_live).toBe(false)
    expect(fields.webinar_attended_replay).toBe(true)
    expect(fields.webinar_mostly_attended).toBe(true)
  })

  it('sends an explicit false below the threshold, and defaults to false when omitted', () => {
    const below = buildWebinarPushFields({
      ...base,
      attended: true,
      watchTimeMinutes: 10,
      mostlyAttended: false,
    })
    expect(below.webinar_mostly_attended).toBe(false)

    const omitted = buildWebinarPushFields({
      ...base,
      attended: true,
      watchTimeMinutes: 60,
    })
    expect(omitted.webinar_mostly_attended).toBe(false)
  })

  it('omits the flag entirely on a registration push', () => {
    const fields = buildWebinarPushFields({
      ...base,
      scheduledStartTime: new Date('2026-09-01T01:00:00Z'),
    })
    expect(fields).not.toHaveProperty('webinar_mostly_attended')
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
