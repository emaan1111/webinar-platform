import { describe, it, expect } from 'vitest'
// Relative import: the `@/` alias does not resolve inside test files here.
import {
  EXTERNAL_SETTINGS_FIELDS,
  INTERNAL_SETTINGS_FIELDS,
  SCHEDULE_FIELDS,
  diffSettings,
  labelForField,
  pickSettings,
  toWritableValue,
} from '../webinarSettingsFields'

describe('pickSettings', () => {
  it('captures only the tracked fields', () => {
    const row = { title: 'Fajr class', hostId: 'user_1', secret: 'nope' }
    expect(pickSettings(row, ['title', 'hostId'])).toEqual({ title: 'Fajr class', hostId: 'user_1' })
  })

  it('turns a missing field into null so it compares equal to an explicit null', () => {
    expect(pickSettings({}, ['thankYouUrl'])).toEqual({ thankYouUrl: null })
    expect(pickSettings({ thankYouUrl: null }, ['thankYouUrl'])).toEqual({ thankYouUrl: null })
  })

  it('stores dates as ISO strings, matching what comes back out of JSON', () => {
    const at = new Date('2026-09-10T11:00:00.000Z')
    expect(pickSettings({ liveZoomAt: at }, ['liveZoomAt'])).toEqual({
      liveZoomAt: '2026-09-10T11:00:00.000Z',
    })
  })
})

describe('diffSettings', () => {
  it('reports nothing when a save re-submits identical values', () => {
    const snapshot = { jitLeadMinutes: 15, showJustInTime: true, thankYouUrl: null }
    expect(diffSettings(snapshot, { ...snapshot })).toEqual([])
  })

  it('names only the fields that moved', () => {
    const before = { jitLeadMinutes: 15, showJustInTime: true, name: 'Ramadan' }
    const after = { jitLeadMinutes: 20, showJustInTime: true, name: 'Ramadan' }
    expect(diffSettings(before, after)).toEqual(['jitLeadMinutes'])
  })

  it('treats a live Date and its stored ISO string as unchanged', () => {
    const before = { liveZoomAt: new Date('2026-09-10T11:00:00.000Z') }
    const after = { liveZoomAt: '2026-09-10T11:00:00.000Z' }
    expect(diffSettings(before as any, after)).toEqual([])
  })

  it('treats a missing key and an explicit null as unchanged', () => {
    expect(diffSettings({ replayUrl: null }, {})).toEqual([])
  })

  it('collapses a changed schedule list to one entry rather than a per-row diff', () => {
    const before = {
      schedules: [{ scheduleType: 'specific', scheduledAt: '2026-09-10T11:00:00.000Z' }],
    }
    const after = {
      schedules: [
        { scheduleType: 'specific', scheduledAt: '2026-09-10T11:00:00.000Z' },
        { scheduleType: 'justInTime', minutesFromReg: 15 },
      ],
    }
    expect(diffSettings(before, after)).toEqual(['schedules'])
  })

  it('ignores key order inside a nested object', () => {
    const before = { schedules: [{ scheduleType: 'specific', timezone: 'Asia/Karachi' }] }
    const after = { schedules: [{ timezone: 'Asia/Karachi', scheduleType: 'specific' }] }
    expect(diffSettings(before, after)).toEqual([])
  })

  it('notices a Zoom session being linked', () => {
    expect(diffSettings({ zoomSessionIds: [] }, { zoomSessionIds: ['zs_1'] })).toEqual([
      'zoomSessionIds',
    ])
  })
})

describe('toWritableValue', () => {
  it('turns a stored ISO string back into a Date for a date field', () => {
    const value = toWritableValue('liveZoomAt', '2026-09-10T11:00:00.000Z')
    expect(value).toBeInstanceOf(Date)
    expect((value as Date).toISOString()).toBe('2026-09-10T11:00:00.000Z')
  })

  it('leaves non-date fields alone', () => {
    expect(toWritableValue('jitLeadMinutes', 20)).toBe(20)
    expect(toWritableValue('thankYouUrl', '')).toBe('')
  })

  it('clears a blank or unparseable date rather than writing an invalid one', () => {
    expect(toWritableValue('replayExpiresAt', '')).toBeNull()
    expect(toWritableValue('replayExpiresAt', null)).toBeNull()
    expect(toWritableValue('liveZoomAt', 'not a date')).toBeNull()
  })
})

describe('tracked field lists', () => {
  it('leaves the external webinar identity out, so a restore cannot collide on it', () => {
    expect(EXTERNAL_SETTINGS_FIELDS).not.toContain('platform')
    expect(EXTERNAL_SETTINGS_FIELDS).not.toContain('externalWebinarId')
  })

  it('leaves the derived ClickFunnels tag ids out, so they are not phantom changes', () => {
    for (const field of [...INTERNAL_SETTINGS_FIELDS, ...EXTERNAL_SETTINGS_FIELDS]) {
      expect(field.endsWith('TagId')).toBe(false)
    }
  })

  it('has a human label for every tracked field', () => {
    const tracked = [
      ...INTERNAL_SETTINGS_FIELDS,
      ...EXTERNAL_SETTINGS_FIELDS,
      'schedules',
      'zoomSessionIds',
    ]
    const unlabelled = tracked.filter((field) => labelForField(field) === field)
    expect(unlabelled).toEqual([])
  })

  it('captures the schedule columns a restore has to write back', () => {
    expect(SCHEDULE_FIELDS).toContain('scheduleType')
    expect(SCHEDULE_FIELDS).toContain('scheduledAt')
    expect(SCHEDULE_FIELDS).toContain('minutesFromReg')
    expect(SCHEDULE_FIELDS).toContain('zoomLink')
  })
})
