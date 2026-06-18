import type { ColumnMapping } from '../../../types/index'

export type RequiredField = Exclude<keyof ColumnMapping, 'notes'>

const REQUIRED_FIELDS: RequiredField[] = [
  'name',
  'post_type',
  'date',
  'start_time',
  'end_time',
  'headcount_required',
]

const FIELD_ALIASES: Record<keyof ColumnMapping, readonly string[]> = {
  name: ['post', 'post name', 'position', 'location', 'post title'],
  post_type: ['type', 'post type', 'category', 'guard/staff'],
  date: ['date', 'event date', 'day', 'show date'],
  start_time: ['start', 'start time', 'time start', 'from', 'begin'],
  end_time: ['end', 'end time', 'time end', 'to', 'finish', 'hours'],
  headcount_required: ['count', 'guards', 'headcount', '# guards', 'qty', 'quantity'],
  notes: ['notes', 'comments', 'special instructions', 'info'],
}

export interface DetectionResult {
  mapping: Partial<ColumnMapping>
  unmappedFields: RequiredField[]
  unmappedColumns: string[]
  confidence: 'high' | 'low'
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ')
}

export function detectMapping(headers: string[]): DetectionResult {
  const normHeaders = headers.map(normalize)
  const usedIndices = new Set<number>()
  const mapping: Partial<ColumnMapping> = {}

  const allFields: (keyof ColumnMapping)[] = [...REQUIRED_FIELDS, 'notes']

  for (const field of allFields) {
    const aliases = FIELD_ALIASES[field].map(normalize)
    for (let i = 0; i < normHeaders.length; i++) {
      if (aliases.includes(normHeaders[i]) && !usedIndices.has(i)) {
        mapping[field] = headers[i]
        usedIndices.add(i)
        break
      }
    }
  }

  const unmappedFields = REQUIRED_FIELDS.filter((f) => !mapping[f])
  const unmappedColumns = headers.filter((_, i) => !usedIndices.has(i))

  return {
    mapping,
    unmappedFields,
    unmappedColumns,
    confidence: unmappedFields.length === 0 ? 'high' : 'low',
  }
}
