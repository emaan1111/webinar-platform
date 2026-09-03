import { describe, expect, it } from 'vitest'
import {
  applyRegistrantFilterParams,
  EMPTY_REGISTRANT_FILTERS,
  hasRegistrantFilters,
  parseRegistrantFilters,
  registrantFiltersEqual,
  registrantFilterWhere,
  sanitizeRegistrantFilters,
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
    })
  })
})

describe('registrantFiltersEqual', () => {
  const base = {
    countries: ['India', 'US'],
    countriesMode: 'include' as const,
    timezones: [],
    timezonesMode: 'include' as const,
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
