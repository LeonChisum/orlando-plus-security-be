import { describe, it, expect } from 'vitest'
import { normalizeTime } from './parseTime'

describe('normalizeTime', () => {
  it('handles HHMM string format', () => {
    expect(normalizeTime('0600')).toBe('06:00')
    expect(normalizeTime('1430')).toBe('14:30')
    expect(normalizeTime('2359')).toBe('23:59')
    expect(normalizeTime('630')).toBe('06:30')
  })

  it('handles HH:MM string format', () => {
    expect(normalizeTime('06:00')).toBe('06:00')
    expect(normalizeTime('14:30')).toBe('14:30')
    expect(normalizeTime('0:30')).toBe('00:30')
    expect(normalizeTime('9:05')).toBe('09:05')
  })

  it('handles Excel numeric time fraction', () => {
    expect(normalizeTime(0.25)).toBe('06:00')
    expect(normalizeTime(0.5)).toBe('12:00')
    expect(normalizeTime(0.75)).toBe('18:00')
    // 0.625 = 15:00
    expect(normalizeTime(0.625)).toBe('15:00')
  })

  it('returns null for unparseable input', () => {
    expect(normalizeTime('abc')).toBeNull()
    expect(normalizeTime('99:99')).toBeNull()
    expect(normalizeTime(null)).toBeNull()
    expect(normalizeTime(undefined)).toBeNull()
    expect(normalizeTime('')).toBeNull()
    // Out-of-range fraction
    expect(normalizeTime(1.5)).toBeNull()
    expect(normalizeTime(-0.1)).toBeNull()
  })

  it('handles midnight as 00:00 not 24:00', () => {
    expect(normalizeTime('0000')).toBe('00:00')
    expect(normalizeTime('00:00')).toBe('00:00')
    expect(normalizeTime(0)).toBe('00:00')
  })
})
