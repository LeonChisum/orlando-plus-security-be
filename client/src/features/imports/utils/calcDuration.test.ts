import { describe, it, expect } from 'vitest'
import { calcDurationHours } from './calcDuration'

describe('calcDurationHours', () => {
  it('calculates same-day duration', () => {
    expect(calcDurationHours('09:00', '17:00')).toBe(8)
    expect(calcDurationHours('06:00', '14:00')).toBe(8)
    expect(calcDurationHours('00:00', '08:00')).toBe(8)
    expect(calcDurationHours('08:00', '20:00')).toBe(12)
  })

  it('correctly handles midnight end (00:00) as next day', () => {
    expect(calcDurationHours('06:00', '00:00')).toBe(18)
    expect(calcDurationHours('22:00', '06:00')).toBe(8)
    expect(calcDurationHours('18:00', '06:00')).toBe(12)
  })

  it('handles 24:00 if present', () => {
    expect(calcDurationHours('06:00', '24:00')).toBe(18)
    expect(calcDurationHours('00:00', '24:00')).toBe(24)
    expect(calcDurationHours('08:00', '24:00')).toBe(16)
  })

  it('returns 0 for equal start and end', () => {
    expect(calcDurationHours('09:00', '09:00')).toBe(0)
    expect(calcDurationHours('00:00', '00:00')).toBe(0)
    expect(calcDurationHours('23:30', '23:30')).toBe(0)
  })
})
