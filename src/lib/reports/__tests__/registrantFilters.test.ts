import { describe, expect, it } from 'vitest'
import {
  applyRegistrantFilterParams,
  EMPTY_REGISTRANT_FILTERS,
  hasRegistrantFilters,
  parseRegistrantFilters,
  registrantFiltersEqual,
  registrantFilterWhere,
  sanitizeRegistrantFilters,
  hasLocationFilters,
  combineRegistrantWhere,
} from '../registrantFilters'

describe('parseRegistrantFilters', () => {
  it('returns empty filters when no params are present', () => {
    const f = parseRegistrantFilters(new URLSearchParams())
    expect(f).toEqual(EMPTY_REGISTRANT_FILTERS)
    expect(hasRegistrantFilters(f)).toBe(false)
  })

  it('parses lists, trims entries and drops empties', () => {
    const f = parseRegistrantFilters(
      new URLSearchParams('countries=India,%20United%20States,,&timezones=Asia/Karachi')
    )
    expect(f.countries).toEqual(['India', 'United States'])
    expect(f.timezones).toEqual(['Asia/Karachi'])
    expect(hasRegistrantFilters(f)).toBe(true)
  })

  it('defaults to include mode and only accepts "exclude" as the other mode', () => {
    const params = new URLSearchParams('countries=India&countriesMode=exclude&timezones=UTC&timezonesMode=bogus')
    const f = parseRegistrantFilters(params)
    expect(f.countriesMode).toBe('exclude')
    expect(f.timezonesMode).toBe('include')
  })
})

describe('applyRegistrantFilterParams', () => {
  it('round-trips through URL params', () => {
    const original = {
      countries: ['India', 'United States'],
      countriesMode: 'exclude' as const,
      timezones: ['Asia/Karachi'],
      timezonesMode: 'include' as const,
      zoomSessions: 'exclude' as const,
    }
    const params = new URLSearchParams()
    applyRegistrantFilterParams(params, original)
    expect(parseRegistrantFilters(params)).toEqual(original)
  })

  it('writes nothing for empty filters', () => {
    const params = new URLSearchParams()
    applyRegistrantFilterParams(params, EMPTY_REGISTRANT_FILTERS)
    expect(params.toString()).toBe('')
  })
})

describe('sanitizeRegistrantFilters', () => {
  it('degrades garbage to the empty filter', () => {
    expect(sanitizeRegistrantFilters(null)).toEqual(EMPTY_REGISTRANT_FILTERS)
    expect(sanitizeRegistrantFilters('nope')).toEqual(EMPTY_REGISTRANT_FILTERS)
    expect(sanitizeRegistrantFilters({ countries: 'India', timezonesMode: 7 })).toEqual(
      EMPTY_REGISTRANT_FILTERS
    )
  })

  it('keeps valid entries, trims them and drops non-strings', () => {
    const f = sanitizeRegistrantFilters({
      countries: [' India ', 42, '', 'US'],
      countriesMode: 'exclude',
      timezones: ['UTC'],
    })
    expect(f).toEqual({
      countries: ['India', 'US'],
      countriesMode: 'exclude',
      timezones: ['UTC'],
      timezonesMode: 'include',
      zoomSessions: 'all',
    })
  })
})

describe('registrantFiltersEqual', () => {
  const base = {
    countries: ['India', 'US'],
    countriesMode: 'include' as const,
    timezones: [],
    timezonesMode: 'include' as const,
    zoomSessions: 'all' as const,
  }

  it('ignores selection order', () => {
    expect(registrantFiltersEqual(base, { ...base, countries: ['US', 'India'] })).toBe(true)
  })

  it('sees a different selection or mode as different', () => {
    expect(registrantFiltersEqual(base, { ...base, countries: ['India'] })).toBe(false)
    expect(registrantFiltersEqual(base, { ...base, countriesMode: 'exclude' })).toBe(false)
  })

  it('ignores the mode of an empty selection', () => {
    expect(registrantFiltersEqual(base, { ...base, timezonesMode: 'exclude' })).toBe(true)
  })

  it('sees a different Zoom-session mode as different', () => {
    expect(registrantFiltersEqual(base, { ...base, zoomSessions: 'only' })).toBe(false)
    expect(registrantFiltersEqual(base, { ...base, zoomSessions: 'exclude' })).toBe(false)
  })
})

describe('the Zoom-session mode', () => {
  it('defaults to counting everyone and writes no param', () => {
    expect(parseRegistrantFilters(new URLSearchParams()).zoomSessions).toBe('all')
    expect(hasRegistrantFilters(EMPTY_REGISTRANT_FILTERS)).toBe(false)

    const params = new URLSearchParams()
    applyRegistrantFilterParams(params, EMPTY_REGISTRANT_FILTERS)
    expect(params.get('zoomSessions')).toBeNull()
  })

  it('parses only the two real modes and ignores anything else', () => {
    expect(parseRegistrantFilters(new URLSearchParams('zoomSessions=only')).zoomSessions).toBe('only')
    expect(parseRegistrantFilters(new URLSearchParams('zoomSessions=exclude')).zoomSessions).toBe(
      'exclude'
    )
    expect(parseRegistrantFilters(new URLSearchParams('zoomSessions=bogus')).zoomSessions).toBe('all')
  })

  it('counts as an active filter on its own, with no location selected', () => {
    const f = parseRegistrantFilters(new URLSearchParams('zoomSessions=only'))
    expect(hasRegistrantFilters(f)).toBe(true)
    expect(hasLocationFilters(f)).toBe(false)
  })

  it('degrades a garbage stored mode to counting everyone', () => {
    expect(sanitizeRegistrantFilters({ zoomSessions: 7 }).zoomSessions).toBe('all')
    expect(sanitizeRegistrantFilters({ zoomSessions: 'only' }).zoomSessions).toBe('only')
  })
})

describe('combineRegistrantWhere', () => {
  it('is empty when every part is', () => {
    expect(combineRegistrantWhere({}, {})).toEqual({})
  })

  it('concatenates the AND clauses instead of letting one key win', () => {
    const combined = combineRegistrantWhere(
      { AND: [{ country: { in: ['India'] } }] },
      { AND: [{ OR: [{ scheduledStartTime: null }] }] }
    )
    expect(combined.AND).toEqual([
      { country: { in: ['India'] } },
      { OR: [{ scheduledStartTime: null }] },
    ])
  })
})

describe('registrantFilterWhere', () => {
  it('is empty when nothing is filtered, so spreading it changes no query', () => {
    expect(registrantFilterWhere(EMPTY_REGISTRANT_FILTERS)).toEqual({})
  })

  it('include mode matches only the chosen values (unknown location drops out)', () => {
    const where = registrantFilterWhere({
      ...EMPTY_REGISTRANT_FILTERS,
      countries: ['India'],
    })
    expect(where).toEqual({ AND: [{ country: { in: ['India'] } }] })
  })

  it('exclude mode keeps rows with no value on file', () => {
    const where = registrantFilterWhere({
      ...EMPTY_REGISTRANT_FILTERS,
      countries: ['India'],
      countriesMode: 'exclude',
    })
    expect(where).toEqual({
      AND: [{ OR: [{ country: null }, { country: { notIn: ['India'] } }] }],
    })
  })

  it('combines country and timezone clauses with AND', () => {
    const where = registrantFilterWhere({
      countries: ['India'],
      countriesMode: 'include',
      timezones: ['UTC'],
      timezonesMode: 'exclude',
    })
    expect(where.AND).toHaveLength(2)
    expect(where.AND?.[0]).toEqual({ country: { in: ['India'] } })
    expect(where.AND?.[1]).toEqual({ OR: [{ timezone: null }, { timezone: { notIn: ['UTC'] } }] })
  })
})
