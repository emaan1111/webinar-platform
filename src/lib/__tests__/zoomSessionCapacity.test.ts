import { describe, expect, it } from 'vitest'
import { isZoomSessionFull, parseZoomCapacity, zoomSeatsLeft } from '../zoomSessionCapacity'

describe('isZoomSessionFull', () => {
  it('never fills an unlimited session', () => {
    expect(isZoomSessionFull(null, 0)).toBe(false)
    expect(isZoomSessionFull(undefined, 10_000)).toBe(false)
  })

  it('fills at the capacity, not one past it', () => {
    expect(isZoomSessionFull(20, 19)).toBe(false)
    expect(isZoomSessionFull(20, 20)).toBe(true)
    expect(isZoomSessionFull(20, 25)).toBe(true)
  })

  it('treats a capacity of 0 as closed', () => {
    expect(isZoomSessionFull(0, 0)).toBe(true)
  })
})

describe('zoomSeatsLeft', () => {
  it('is null for an unlimited session', () => {
    expect(zoomSeatsLeft(null, 5)).toBeNull()
  })

  it('counts down and never goes negative', () => {
    expect(zoomSeatsLeft(20, 5)).toBe(15)
    expect(zoomSeatsLeft(20, 25)).toBe(0)
  })
})

describe('parseZoomCapacity', () => {
  it('reads blank as unlimited', () => {
    for (const v of [undefined, null, '', '   ']) {
      expect(parseZoomCapacity(v)).toEqual({ ok: true, capacity: null })
    }
  })

  it('accepts whole non-negative numbers, as numbers or strings', () => {
    expect(parseZoomCapacity(25)).toEqual({ ok: true, capacity: 25 })
    expect(parseZoomCapacity(' 25 ')).toEqual({ ok: true, capacity: 25 })
    expect(parseZoomCapacity(0)).toEqual({ ok: true, capacity: 0 })
  })

  it('rejects fractions, negatives and junk', () => {
    for (const v of [-1, 2.5, '2.5', 'ten', NaN, {}, true]) {
      expect(parseZoomCapacity(v).ok).toBe(false)
    }
  })
})
