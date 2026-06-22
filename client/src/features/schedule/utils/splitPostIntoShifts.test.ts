import { describe, it, expect } from 'vitest'
import {
  toMinutes,
  toTimeString,
  splitPostIntoShifts,
  validateSplits,
  suggestStrategy,
} from './splitPostIntoShifts'
import type { Post } from '../../../types/index'

function makePost(
  start_time: string,
  end_time: string,
  id = 'p1',
  date = '2025-09-05',
): Post {
  return {
    id,
    hall_id: 'h1',
    name: 'Test Post',
    post_type: 'security',
    date,
    start_time,
    end_time,
    headcount_required: 1,
    created_at: '',
    updated_at: '',
  }
}

// ─── toMinutes ────────────────────────────────────────────────────────────────

describe('toMinutes', () => {
  it('converts standard times', () => {
    expect(toMinutes('00:00')).toBe(0)
    expect(toMinutes('06:00')).toBe(360)
    expect(toMinutes('12:00')).toBe(720)
    expect(toMinutes('12:30')).toBe(750)
    expect(toMinutes('23:59')).toBe(1439)
  })

  it('treats 24:00 as 1440', () => {
    expect(toMinutes('24:00')).toBe(1440)
  })
})

// ─── toTimeString ─────────────────────────────────────────────────────────────

describe('toTimeString', () => {
  it('converts standard minute values', () => {
    expect(toTimeString(0)).toBe('00:00')
    expect(toTimeString(360)).toBe('06:00')
    expect(toTimeString(720)).toBe('12:00')
    expect(toTimeString(750)).toBe('12:30')
    expect(toTimeString(1320)).toBe('22:00')
  })

  it('wraps 1440 back to 00:00', () => {
    expect(toTimeString(1440)).toBe('00:00')
  })

  it('wraps values > 1440', () => {
    expect(toTimeString(1500)).toBe('01:00')  // 1500 - 1440 = 60 → "01:00"
    expect(toTimeString(2280)).toBe('14:00')  // 2280 - 1440 = 840 → "14:00"
  })

  it('is the inverse of toMinutes for standard times', () => {
    expect(toTimeString(toMinutes('06:30'))).toBe('06:30')
    expect(toTimeString(toMinutes('17:45'))).toBe('17:45')
  })
})

// ─── splitPostIntoShifts — single ─────────────────────────────────────────────

describe('splitPostIntoShifts — single', () => {
  it('returns one shift spanning the full post window', () => {
    const post = makePost('09:00', '15:00')
    const [shift] = splitPostIntoShifts(post, 'single')
    expect(shift.start_time).toBe('09:00')
    expect(shift.end_time).toBe('15:00')
    expect(shift.split_strategy).toBe('single')
    expect(shift.post_id).toBe('p1')
    expect(shift.date).toBe('2025-09-05')
  })

  it('handles a midnight-spanning post', () => {
    const post = makePost('22:00', '04:00')
    const [shift] = splitPostIntoShifts(post, 'single')
    expect(shift.start_time).toBe('22:00')
    expect(shift.end_time).toBe('04:00')
  })

  it('produces no validation errors', () => {
    const post = makePost('09:00', '15:00')
    const shifts = splitPostIntoShifts(post, 'single')
    expect(validateSplits(post, shifts)).toHaveLength(0)
  })
})

// ─── splitPostIntoShifts — equal_halves ───────────────────────────────────────

describe('splitPostIntoShifts — equal_halves', () => {
  it('splits a 12-hour post into two equal halves (spec example 1)', () => {
    const post = makePost('08:00', '20:00')
    const [a, b] = splitPostIntoShifts(post, 'equal_halves')
    expect(a.start_time).toBe('08:00')
    expect(a.end_time).toBe('14:00')
    expect(b.start_time).toBe('14:00')
    expect(b.end_time).toBe('20:00')
  })

  it('splits a 12-hour post with non-round start (spec example 2)', () => {
    const post = makePost('06:30', '18:30')
    const [a, b] = splitPostIntoShifts(post, 'equal_halves')
    expect(a.start_time).toBe('06:30')
    expect(a.end_time).toBe('12:30')
    expect(b.start_time).toBe('12:30')
    expect(b.end_time).toBe('18:30')
  })

  it('snaps last shift to original end_time on odd-minute duration', () => {
    // 13h = 780min → floor(780/2) = 390 → 08:00–14:30, 14:30–21:00
    const post = makePost('08:00', '21:00')
    const [a, b] = splitPostIntoShifts(post, 'equal_halves')
    expect(a.start_time).toBe('08:00')
    expect(a.end_time).toBe('14:30')
    expect(b.start_time).toBe('14:30')
    expect(b.end_time).toBe('21:00')
  })

  it('handles midnight-spanning post', () => {
    // 18:00–06:00 (12h) → 18:00–00:00, 00:00–06:00
    const post = makePost('18:00', '06:00')
    const [a, b] = splitPostIntoShifts(post, 'equal_halves')
    expect(a.start_time).toBe('18:00')
    expect(a.end_time).toBe('00:00')
    expect(b.start_time).toBe('00:00')
    expect(b.end_time).toBe('06:00')
  })

  it('produces no validation errors', () => {
    const cases = [
      makePost('08:00', '20:00'),
      makePost('06:30', '18:30'),
      makePost('18:00', '06:00'),
    ]
    for (const post of cases) {
      const shifts = splitPostIntoShifts(post, 'equal_halves')
      expect(validateSplits(post, shifts)).toHaveLength(0)
    }
  })
})

// ─── splitPostIntoShifts — equal_thirds ───────────────────────────────────────

describe('splitPostIntoShifts — equal_thirds', () => {
  it('splits an 18-hour post into three equal thirds (spec example 1)', () => {
    // 06:00–00:00 = 18h = 1080min → 360min each
    const post = makePost('06:00', '00:00')
    const [a, b, c] = splitPostIntoShifts(post, 'equal_thirds')
    expect(a.start_time).toBe('06:00')
    expect(a.end_time).toBe('12:00')
    expect(b.start_time).toBe('12:00')
    expect(b.end_time).toBe('18:00')
    expect(c.start_time).toBe('18:00')
    expect(c.end_time).toBe('00:00')
  })

  it('splits a 19-hour post, snapping last shift to end_time (spec example 2)', () => {
    // 05:00–00:00 = 19h = 1140min → floor(1140/3) = 380min
    // Shift A: 05:00 → 05:00+380min = 11:20
    // Shift B: 11:20 → 11:20+380min = 17:40
    // Shift C: 17:40 → 00:00 (snap)
    const post = makePost('05:00', '00:00')
    const [a, b, c] = splitPostIntoShifts(post, 'equal_thirds')
    expect(a.start_time).toBe('05:00')
    expect(a.end_time).toBe('11:20')
    expect(b.start_time).toBe('11:20')
    expect(b.end_time).toBe('17:40')
    expect(c.start_time).toBe('17:40')
    expect(c.end_time).toBe('00:00')
  })

  it('handles midnight-spanning 18-hour post', () => {
    // 20:00–14:00 (18h) → each block 360min
    // Shift A: 20:00 → 02:00 (1200+360=1560 → toTimeString=120 → 02:00)
    // Shift B: 02:00 → 08:00 (1200+720=1920 → toTimeString=480 → 08:00)
    // Shift C: 08:00 → 14:00 (snap to end)
    const post = makePost('20:00', '14:00')
    const [a, b, c] = splitPostIntoShifts(post, 'equal_thirds')
    expect(a.start_time).toBe('20:00')
    expect(a.end_time).toBe('02:00')
    expect(b.start_time).toBe('02:00')
    expect(b.end_time).toBe('08:00')
    expect(c.start_time).toBe('08:00')
    expect(c.end_time).toBe('14:00')
  })

  it('produces no validation errors', () => {
    const cases = [
      makePost('06:00', '00:00'),
      makePost('05:00', '00:00'),
      makePost('20:00', '14:00'),
    ]
    for (const post of cases) {
      const shifts = splitPostIntoShifts(post, 'equal_thirds')
      expect(validateSplits(post, shifts)).toHaveLength(0)
    }
  })
})

// ─── splitPostIntoShifts — manual ─────────────────────────────────────────────

describe('splitPostIntoShifts — manual', () => {
  it('falls back to single with no overrides', () => {
    const post = makePost('08:00', '20:00')
    const shifts = splitPostIntoShifts(post, 'manual')
    expect(shifts).toHaveLength(1)
    expect(shifts[0].start_time).toBe('08:00')
    expect(shifts[0].end_time).toBe('20:00')
  })

  it('uses overrides directly when they cover the full window', () => {
    const post = makePost('08:00', '20:00')
    const shifts = splitPostIntoShifts(post, 'manual', [
      { index: 0, start_time: '08:00', end_time: '13:00' },
      { index: 1, start_time: '13:00', end_time: '20:00' },
    ])
    expect(shifts).toHaveLength(2)
    expect(shifts[0].end_time).toBe('13:00')
    expect(shifts[1].start_time).toBe('13:00')
    expect(shifts[1].end_time).toBe('20:00')
  })

  it('appends a trailing shift when overrides do not reach post end', () => {
    const post = makePost('08:00', '20:00')
    const shifts = splitPostIntoShifts(post, 'manual', [
      { index: 0, start_time: '08:00', end_time: '16:00' },
    ])
    expect(shifts).toHaveLength(2)
    expect(shifts[1].start_time).toBe('16:00')
    expect(shifts[1].end_time).toBe('20:00')
  })

  it('sorts overrides by index before applying', () => {
    const post = makePost('08:00', '20:00')
    const shifts = splitPostIntoShifts(post, 'manual', [
      { index: 1, start_time: '14:00', end_time: '20:00' },
      { index: 0, start_time: '08:00', end_time: '14:00' },
    ])
    expect(shifts[0].start_time).toBe('08:00')
    expect(shifts[0].end_time).toBe('14:00')
    expect(shifts[1].start_time).toBe('14:00')
    expect(shifts[1].end_time).toBe('20:00')
  })
})

// ─── validateSplits ───────────────────────────────────────────────────────────

describe('validateSplits', () => {
  it('returns no errors for valid auto-generated splits', () => {
    const post = makePost('06:00', '00:00')
    const shifts = splitPostIntoShifts(post, 'equal_thirds')
    expect(validateSplits(post, shifts)).toHaveLength(0)
  })

  it('returns error when shifts array is empty', () => {
    const post = makePost('08:00', '20:00')
    const errors = validateSplits(post, [])
    expect(errors).toHaveLength(1)
    expect(errors[0].shiftIndex).toBe(-1)
  })

  it('catches first shift start mismatch', () => {
    const post = makePost('08:00', '20:00')
    const shifts = splitPostIntoShifts(post, 'equal_halves')
    shifts[0] = { ...shifts[0], start_time: '07:00' }
    const errors = validateSplits(post, shifts)
    expect(errors.some(e => e.shiftIndex === 0 && e.message.includes('08:00'))).toBe(true)
  })

  it('catches last shift end mismatch', () => {
    const post = makePost('08:00', '20:00')
    const shifts = splitPostIntoShifts(post, 'equal_halves')
    shifts[shifts.length - 1] = { ...shifts[shifts.length - 1], end_time: '21:00' }
    const errors = validateSplits(post, shifts)
    expect(errors.some(e => e.message.includes('20:00'))).toBe(true)
  })

  it('catches gap between shifts', () => {
    const post = makePost('08:00', '20:00')
    const shifts = splitPostIntoShifts(post, 'equal_halves')
    // Introduce gap: first shift ends 14:00, second starts 15:00
    shifts[0] = { ...shifts[0], end_time: '14:00' }
    shifts[1] = { ...shifts[1], start_time: '15:00' }
    const errors = validateSplits(post, shifts)
    expect(errors.some(e => e.message.toLowerCase().includes('gap'))).toBe(true)
  })

  it('catches zero-duration shift', () => {
    const post = makePost('08:00', '20:00')
    const zeroDuration = splitPostIntoShifts(post, 'equal_halves')
    zeroDuration[0] = { ...zeroDuration[0], start_time: '14:00' }
    const errors = validateSplits(post, zeroDuration)
    expect(errors.some(e => e.message.toLowerCase().includes('zero'))).toBe(true)
  })

  it('passes for midnight-spanning single shift', () => {
    const post = makePost('22:00', '06:00')
    const shifts = splitPostIntoShifts(post, 'single')
    expect(validateSplits(post, shifts)).toHaveLength(0)
  })
})

// ─── suggestStrategy ──────────────────────────────────────────────────────────

describe('suggestStrategy', () => {
  it('returns single for posts under 8 hours', () => {
    expect(suggestStrategy(makePost('08:00', '14:00'))).toBe('single') // 6h
    expect(suggestStrategy(makePost('09:00', '16:59'))).toBe('single') // 7h59m
    expect(suggestStrategy(makePost('00:00', '00:00'))).toBe('single') // 0h
  })

  it('returns equal_halves for 8–17 hour posts', () => {
    expect(suggestStrategy(makePost('08:00', '16:00'))).toBe('equal_halves') // 8h exact
    expect(suggestStrategy(makePost('06:00', '18:00'))).toBe('equal_halves') // 12h
    expect(suggestStrategy(makePost('06:00', '23:00'))).toBe('equal_halves') // 17h exact
  })

  it('returns equal_thirds for posts 18 hours or longer', () => {
    expect(suggestStrategy(makePost('06:00', '00:00'))).toBe('equal_thirds') // 18h exact
    expect(suggestStrategy(makePost('00:00', '20:00'))).toBe('equal_thirds') // 20h
    expect(suggestStrategy(makePost('00:00', '24:00'))).toBe('equal_thirds') // 24h
  })

  it('handles midnight-spanning posts correctly', () => {
    expect(suggestStrategy(makePost('22:00', '06:00'))).toBe('equal_halves') // 8h spans midnight
    expect(suggestStrategy(makePost('18:00', '06:00'))).toBe('equal_halves') // 12h spans midnight
    expect(suggestStrategy(makePost('06:00', '00:00'))).toBe('equal_thirds') // 18h spans midnight
  })
})
