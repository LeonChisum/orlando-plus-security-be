import { describe, it, expect } from 'vitest'
import { normalizePostType } from './normalizePostType'

describe('normalizePostType', () => {
  it.each(['Security', 'Guard', 'Sec', 'G', 'security', 'guard', 'sec', 'g'])(
    'maps "%s" to security',
    (v) => {
      expect(normalizePostType(v)).toBe('security')
    },
  )

  it.each(['Staffing', 'Staff', 'Staffer', 'S', 'staffing', 'staff', 'staffer', 's'])(
    'maps "%s" to staffing',
    (v) => {
      expect(normalizePostType(v)).toBe('staffing')
    },
  )

  it('returns null for unrecognized values', () => {
    expect(normalizePostType('Unknown')).toBeNull()
    expect(normalizePostType('')).toBeNull()
    expect(normalizePostType('Event')).toBeNull()
  })

  it('trims surrounding whitespace before matching', () => {
    expect(normalizePostType('  Guard  ')).toBe('security')
    expect(normalizePostType('  Staff  ')).toBe('staffing')
  })
})
