import { describe, expect, it } from 'vitest'
import {
  parseZoomSessionMode,
  sanitizeZoomSessionMode,
  zoomSessionFilterLabel,
  zoomSessionWhere,
  ZoomSessionSlot,
} from '../zoomSessionFilter'

const at = (iso: string) => new Date(iso)

const SLOTS: ZoomSessionSlot[] = [
  // One session at 18:00 serving two external webinars...
  { webinarType: 'external', webinarId: 'extA', scheduledAt: at('2026-09-10T18:00:00.000Z') },
  { webinarType: 'external', webinarId: 'extB', scheduledAt: at('2026-09-10T18:00:00.000Z') },
  // ...another at 20:00 for one of them...
  { webinarType: 'external', webinarId: 'extA', scheduledAt: at('2026-09-10T20:00:00.000Z') },
  // ...and one internal webinar's Zoom schedule.
  { webinarType: 'internal', webinarId: 'intA', scheduledAt: at('2026-09-11T15:30:00.000Z') },
]

describe('zoomSessionWhere', () => {
  it('changes no query in the default mode', () => {
    expect(zoomSessionWhere(SLOTS, 'all', 'external')).toEqual({})
    expect(zoomSessionWhere(SLOTS, 'all', 'internal')).toEqual({})
  })

  it('only mode matches a slot time paired with a webinar that offers it', () => {
    const where = zoomSessionWhere(SLOTS, 'only', 'external')
    expect(where).toEqual({
      AND: [
        {
          OR: [
            {
              scheduledStartTime: at('2026-09-10T18:00:00.000Z'),
              externalWebinarId: { in: ['extA', 'extB'] },
            },
            {
              scheduledStartTime: at('2026-09-10T20:00:00.000Z'),
              externalWebinarId: { in: ['extA'] },
            },
          ],
        },
      ],
    })
  })

  it('keeps the two tables apart: each sees only its own slots', () => {
    const internal = zoomSessionWhere(SLOTS, 'only', 'internal')
    expect(internal).toEqual({
      AND: [
        {
          OR: [
            {
              scheduledStartTime: at('2026-09-11T15:30:00.000Z'),
              webinarId: { in: ['intA'] },
            },
          ],
        },
      ],
    })
  })

  it('exclude mode is the exact complement and keeps rows with no session time', () => {
    const where = zoomSessionWhere(SLOTS, 'exclude', 'external')
    expect(where).toEqual({
      AND: [
        {
          OR: [
            { scheduledStartTime: null },
            {
              scheduledStartTime: {
                notIn: [at('2026-09-10T18:00:00.000Z'), at('2026-09-10T20:00:00.000Z')],
              },
            },
            {
              scheduledStartTime: at('2026-09-10T18:00:00.000Z'),
              externalWebinarId: { notIn: ['extA', 'extB'] },
            },
            {
              scheduledStartTime: at('2026-09-10T20:00:00.000Z'),
              externalWebinarId: { notIn: ['extA'] },
            },
          ],
        },
      ],
    })
  })

  it('de-duplicates a webinar listed twice for the same instant', () => {
    const duplicated: ZoomSessionSlot[] = [
      { webinarType: 'external', webinarId: 'extA', scheduledAt: at('2026-09-10T18:00:00.000Z') },
      { webinarType: 'external', webinarId: 'extA', scheduledAt: at('2026-09-10T18:00:00.000Z') },
    ]
    const where = zoomSessionWhere(duplicated, 'only', 'external') as any
    expect(where.AND[0].OR).toHaveLength(1)
    expect(where.AND[0].OR[0].externalWebinarId).toEqual({ in: ['extA'] })
  })

  it('with no slots, "only" is nobody rather than everybody', () => {
    const where = zoomSessionWhere([], 'only', 'external')
    expect(where).toEqual({ AND: [{ externalWebinarId: { in: [] } }] })
  })

  it('with no slots, "exclude" has nothing to take out', () => {
    expect(zoomSessionWhere([], 'exclude', 'external')).toEqual({})
  })

  it('ignores slots with an unusable instant', () => {
    const broken: ZoomSessionSlot[] = [
      { webinarType: 'external', webinarId: 'extA', scheduledAt: new Date('nonsense') },
    ]
    expect(zoomSessionWhere(broken, 'exclude', 'external')).toEqual({})
  })
})

describe('parseZoomSessionMode / sanitizeZoomSessionMode', () => {
  it('accept only the two real modes', () => {
    expect(parseZoomSessionMode(new URLSearchParams('zoomSessions=only'))).toBe('only')
    expect(parseZoomSessionMode(new URLSearchParams('zoomSessions=exclude'))).toBe('exclude')
    expect(parseZoomSessionMode(new URLSearchParams())).toBe('all')
    expect(sanitizeZoomSessionMode(null)).toBe('all')
    expect(sanitizeZoomSessionMode('ONLY')).toBe('all')
  })
})

describe('zoomSessionFilterLabel', () => {
  it('names the two filtering modes and stays quiet for the default', () => {
    expect(zoomSessionFilterLabel('all')).toBeNull()
    expect(zoomSessionFilterLabel('only')).toBe('Zoom sessions only')
    expect(zoomSessionFilterLabel('exclude')).toBe('Zoom sessions excluded')
  })
})
