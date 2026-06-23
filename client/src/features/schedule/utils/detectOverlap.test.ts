import { describe, it, expect } from 'vitest'
import { shiftsOverlap } from './detectOverlap'

function s(start_time: string, end_time: string) {
  return { start_time, end_time }
}

describe('shiftsOverlap', () => {
  it('detects overlap on same-day shifts', () => {
    expect(shiftsOverlap(s('08:00', '14:00'), s('12:00', '18:00'))).toBe(true)
  })

  it('detects no overlap on adjacent shifts (end = next start)', () => {
    expect(shiftsOverlap(s('06:00', '12:00'), s('12:00', '18:00'))).toBe(false)
  })

  it('detects overlap across midnight: 1800–0000 overlaps 2200–0600', () => {
    expect(shiftsOverlap(s('18:00', '00:00'), s('22:00', '06:00'))).toBe(true)
  })

  it('detects no overlap: 0600–1200 vs 1200–1800', () => {
    expect(shiftsOverlap(s('06:00', '12:00'), s('12:00', '18:00'))).toBe(false)
  })

  it('detects overlap: 0600–1800 vs 1200–2000 (partial)', () => {
    expect(shiftsOverlap(s('06:00', '18:00'), s('12:00', '20:00'))).toBe(true)
  })

  it('detects full containment as overlap', () => {
    expect(shiftsOverlap(s('06:00', '18:00'), s('08:00', '12:00'))).toBe(true)
  })
})
