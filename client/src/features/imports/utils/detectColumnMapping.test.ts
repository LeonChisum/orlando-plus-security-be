import { describe, it, expect } from 'vitest'
import { detectMapping } from './detectColumnMapping'

const STANDARD_HEADERS = ['Post Name', 'Type', 'Date', 'Start Time', 'End Time', 'Headcount']

describe('detectMapping', () => {
  it('returns high confidence when all required fields match', () => {
    const result = detectMapping(STANDARD_HEADERS)
    expect(result.confidence).toBe('high')
    expect(result.unmappedFields).toHaveLength(0)
  })

  it('maps standard header names correctly', () => {
    const result = detectMapping(STANDARD_HEADERS)
    expect(result.mapping.name).toBe('Post Name')
    expect(result.mapping.post_type).toBe('Type')
    expect(result.mapping.date).toBe('Date')
    expect(result.mapping.start_time).toBe('Start Time')
    expect(result.mapping.end_time).toBe('End Time')
    expect(result.mapping.headcount_required).toBe('Headcount')
  })

  it('detects alternate alias names', () => {
    const result = detectMapping(['Position', 'Category', 'Event Date', 'From', 'To', 'Qty'])
    expect(result.confidence).toBe('high')
    expect(result.mapping.name).toBe('Position')
    expect(result.mapping.post_type).toBe('Category')
    expect(result.mapping.date).toBe('Event Date')
    expect(result.mapping.start_time).toBe('From')
    expect(result.mapping.end_time).toBe('To')
    expect(result.mapping.headcount_required).toBe('Qty')
  })

  it('is case-insensitive', () => {
    const result = detectMapping(['POST NAME', 'TYPE', 'DATE', 'START TIME', 'END TIME', 'HEADCOUNT'])
    expect(result.confidence).toBe('high')
  })

  it('trims extra whitespace in headers', () => {
    const result = detectMapping(['  Post Name  ', '  Type  ', 'Date', 'Start Time', 'End Time', 'Headcount'])
    expect(result.confidence).toBe('high')
    expect(result.mapping.name).toBe('  Post Name  ')
  })

  it('detects optional notes column', () => {
    const result = detectMapping([...STANDARD_HEADERS, 'Notes'])
    expect(result.mapping.notes).toBe('Notes')
    expect(result.unmappedColumns).not.toContain('Notes')
  })

  it('detects notes aliases', () => {
    const result = detectMapping([...STANDARD_HEADERS, 'Comments'])
    expect(result.mapping.notes).toBe('Comments')
  })

  it('returns low confidence when required fields are missing', () => {
    const result = detectMapping(['Post Name', 'Date', 'Start Time', 'End Time'])
    expect(result.confidence).toBe('low')
    expect(result.unmappedFields).toContain('post_type')
    expect(result.unmappedFields).toContain('headcount_required')
  })

  it('lists unrecognized columns as unmapped', () => {
    const result = detectMapping([...STANDARD_HEADERS, 'Internal Code', 'Region'])
    expect(result.unmappedColumns).toContain('Internal Code')
    expect(result.unmappedColumns).toContain('Region')
  })

  it('does not double-map the same column to two fields', () => {
    // 'Guards' matches both headcount_required alias and could theoretically match post_type alias
    // Ensure each header is used at most once
    const result = detectMapping(['Post Name', 'Type', 'Date', 'Start Time', 'End Time', 'Guards'])
    expect(result.mapping.headcount_required).toBe('Guards')
    expect(result.unmappedFields).toHaveLength(0)
  })

  it('handles an empty headers array gracefully', () => {
    const result = detectMapping([])
    expect(result.confidence).toBe('low')
    expect(result.unmappedFields).toHaveLength(6)
    expect(result.unmappedColumns).toHaveLength(0)
  })
})
