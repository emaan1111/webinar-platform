/**
 * Registrant country/timezone filtering for the reports section.
 *
 * Both `Registration` and `ExternalWebinarRegistration` carry the same
 * nullable `country` and `timezone` columns, so one Prisma fragment serves
 * every query on either table. An excluded registrant is dropped from the
 * query itself, so they are not counted anywhere - not in registrations,
 * attendance, engagement, sales or the coverage counts.
 *
 * Null handling is deliberate and asymmetric:
 * - include mode: a row with no value does not match any chosen country, so
 *   it is dropped.
 * - exclude mode: a row with no value is not known to be from an excluded
 *   country, so it is kept.
 */

export type RegistrantFilterMode = 'include' | 'exclude'

export interface RegistrantFilters {
  countries: string[]
  countriesMode: RegistrantFilterMode
  timezones: string[]
  timezonesMode: RegistrantFilterMode
}

export const EMPTY_REGISTRANT_FILTERS: RegistrantFilters = {
  countries: [],
  countriesMode: 'include',
  timezones: [],
  timezonesMode: 'include',
}

const parseMode = (raw: string | null): RegistrantFilterMode =>
  raw === 'exclude' ? 'exclude' : 'include'

const parseList = (raw: string | null): string[] =>
  raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : []

/** Read the filter from request query params (shared by all reports routes). */
export function parseRegistrantFilters(searchParams: URLSearchParams): RegistrantFilters {
  return {
    countries: parseList(searchParams.get('countries')),
    countriesMode: parseMode(searchParams.get('countriesMode')),
    timezones: parseList(searchParams.get('timezones')),
    timezonesMode: parseMode(searchParams.get('timezonesMode')),
  }
}

export const hasRegistrantFilters = (f: RegistrantFilters) =>
  f.countries.length > 0 || f.timezones.length > 0

/** Write the filter into query params - the client-side mirror of the parser. */
export function applyRegistrantFilterParams(params: URLSearchParams, f: RegistrantFilters): void {
  if (f.countries.length > 0) {
    params.set('countries', f.countries.join(','))
    if (f.countriesMode === 'exclude') params.set('countriesMode', 'exclude')
  }
  if (f.timezones.length > 0) {
    params.set('timezones', f.timezones.join(','))
    if (f.timezonesMode === 'exclude') params.set('timezonesMode', 'exclude')
  }
}

/**
 * A RegistrantFilters from untrusted input (localStorage, a saved view).
 * Garbage in any field degrades to that field's empty default.
 */
export function sanitizeRegistrantFilters(raw: unknown): RegistrantFilters {
  const r = (raw ?? {}) as Record<string, unknown>
  const list = (v: unknown) =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map(x => x.trim())
      : []
  return {
    countries: list(r.countries),
    countriesMode: r.countriesMode === 'exclude' ? 'exclude' : 'include',
    timezones: list(r.timezones),
    timezonesMode: r.timezonesMode === 'exclude' ? 'exclude' : 'include',
  }
}

/**
 * Same effective filter? Selection order never matters, and the include/
 * exclude mode only matters once something is selected - so flipping the mode
 * of an empty filter is not a change.
 */
export function registrantFiltersEqual(a: RegistrantFilters, b: RegistrantFilters): boolean {
  const norm = (values: string[]) => [...values].sort().join('\u0000')
  const fieldEqual = (
    av: string[],
    bv: string[],
    am: RegistrantFilterMode,
    bm: RegistrantFilterMode
  ) => norm(av) === norm(bv) && (av.length === 0 || am === bm)
  return (
    fieldEqual(a.countries, b.countries, a.countriesMode, b.countriesMode) &&
    fieldEqual(a.timezones, b.timezones, a.timezonesMode, b.timezonesMode)
  )
}

function fieldClause(field: 'country' | 'timezone', values: string[], mode: RegistrantFilterMode) {
  if (mode === 'include') {
    return { [field]: { in: values } }
  }
  // notIn alone would also drop NULL rows (SQL three-valued logic), and an
  // unknown location is not evidence the registrant is from an excluded one.
  return { OR: [{ [field]: null }, { [field]: { notIn: values } }] }
}

/**
 * Prisma `where` fragment for the active filters. Spread it into any query on
 * Registration or ExternalWebinarRegistration; `{}` when nothing is filtered.
 * Clauses are wrapped in AND so the exclude-mode OR cannot collide with other
 * keys of the enclosing where.
 */
export function registrantFilterWhere(f: RegistrantFilters): { AND?: object[] } {
  const clauses: object[] = []
  if (f.countries.length > 0) clauses.push(fieldClause('country', f.countries, f.countriesMode))
  if (f.timezones.length > 0) clauses.push(fieldClause('timezone', f.timezones, f.timezonesMode))
  return clauses.length > 0 ? { AND: clauses } : {}
}
