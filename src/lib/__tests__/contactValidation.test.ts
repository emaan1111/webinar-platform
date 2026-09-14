import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  normalizeEmail,
  normalizePhone,
  PHONE_ERROR,
} from '../contactValidation'

describe('isValidEmail', () => {
  it('accepts ordinary addresses', () => {
    expect(isValidEmail('engrafolabiakangbe@yahoo.com')).toBe(true)
    expect(isValidEmail(' Sarah.S.Nusker@gmail.com ')).toBe(true)
    expect(isValidEmail('a+tag@sub.domain.co.uk')).toBe(true)
  })

  it('rejects a domain with no TLD (the shape that silently bounced in production)', () => {
    expect(isValidEmail('nabdelr22@gmail')).toBe(false)
  })

  it('rejects other malformed input', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('two@@at.com')).toBe(false)
    expect(isValidEmail('spaces in@name.com')).toBe(false)
    expect(isValidEmail('trailing@dot.')).toBe(false)
    expect(isValidEmail(null)).toBe(false)
  })

  it('normalizes case and surrounding space', () => {
    expect(normalizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com')
  })
})

describe('normalizePhone', () => {
  it('treats a blank number as simply absent', () => {
    expect(normalizePhone('', '+1')).toEqual({ e164: null })
    expect(normalizePhone(null, '+1')).toEqual({ e164: null })
  })

  it('joins the selected dialling code with a local number', () => {
    expect(normalizePhone('803 669 7611', '+234').e164).toBe('+2348036697611')
  })

  it('drops a dialling code typed into the number box (the doubled-prefix bug)', () => {
    // Selector on Nigeria, "+234 …" typed in as well: previously stored as
    // "+234 +234 803 669 7611" and rejected downstream at 16 digits.
    expect(normalizePhone('+234 803 669 7611', '+234').e164).toBe('+2348036697611')
    // Same thing without the plus sign.
    expect(normalizePhone('2348036697611', '+234').e164).toBe('+2348036697611')
  })

  it('strips a national trunk zero', () => {
    expect(normalizePhone('0413632128', '+61').e164).toBe('+61413632128')
    expect(normalizePhone('07780063456', '+44').e164).toBe('+447780063456')
  })

  it('lets a typed international number override a stale selector default', () => {
    // Visitor pastes a UK number while the selector still reads +1.
    expect(normalizePhone('+447415473022', '+1').e164).toBe('+447415473022')
  })

  it('rejects numbers past the E.164 ceiling', () => {
    // Autofill appending the full international form.
    expect(normalizePhone('2042947674+12042947674', '+1')).toEqual({
      e164: null,
      error: PHONE_ERROR,
    })
    // Digits repeated three times.
    expect(normalizePhone('563316933563316933563316933', '+971').e164).toBeNull()
    // Wrong code selected in front of a full foreign number.
    expect(normalizePhone('+1 +44741547302207415473022', '+1').e164).toBeNull()
  })

  it('rejects numbers that are too short', () => {
    expect(normalizePhone('0', '+1').e164).toBeNull()
    expect(normalizePhone('6', '+1').e164).toBeNull()
  })

  it('keeps a real number that happens to start with its own dialling code', () => {
    // Stripping here would leave too few digits, so the number is left alone.
    expect(normalizePhone('1234567', '+1').e164).toBe('+11234567')
  })

  it('ignores punctuation and spacing', () => {
    expect(normalizePhone('(204) 294-7674', '+1').e164).toBe('+12042947674')
  })
})
