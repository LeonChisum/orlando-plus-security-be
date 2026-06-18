import * as XLSX from 'xlsx'
import type { RawImportRow, MappedPostRow, ColumnMapping } from '../../../types/index'
import { normalizeTime, splitTimeRange } from './parseTime'
import { normalizePostType } from './normalizePostType'

export interface ParsedWorkbook {
  sheetNames: string[]
  sheets: RawImportRow[][]
}

export async function parseWorkbook(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: false })

  const sheets = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name]
    return XLSX.utils.sheet_to_json<RawImportRow>(ws, { defval: null, raw: true })
  })

  return { sheetNames: wb.SheetNames, sheets }
}

export function extractPostRows(
  rows: RawImportRow[],
  mapping: ColumnMapping,
): MappedPostRow[] {
  return rows.map((row, idx) => {
    const errors: string[] = []

    // Name
    const name = String(row[mapping.name] ?? '').trim()
    if (!name) errors.push('Post name is required')

    // Date — stored as-is; date normalization is handled during review (2.6)
    const rawDate = row[mapping.date]
    const date = rawDate != null ? String(rawDate).trim() : ''
    if (!date) errors.push('Date is required')

    // Times — detect range string "HHMM-HHMM" vs separate columns
    let start_time: string | null = null
    let end_time: string | null = null

    if (mapping.start_time === mapping.end_time) {
      // Single column with a range like "0600-0000"
      const raw = String(row[mapping.start_time] ?? '').trim()
      const [s, e] = splitTimeRange(raw)
      start_time = s
      end_time = e
    } else {
      start_time = normalizeTime(row[mapping.start_time] as string | number | null)
      end_time = normalizeTime(row[mapping.end_time] as string | number | null)
    }

    if (!start_time) errors.push('Invalid or missing start time')
    if (!end_time) errors.push('Invalid or missing end time')

    // Headcount
    const rawCount = row[mapping.headcount_required]
    const headcount_required =
      typeof rawCount === 'number'
        ? rawCount
        : parseInt(String(rawCount ?? '1'), 10)

    // Post type — normalize known aliases; unrecognized values default to security
    const rawType = String(row[mapping.post_type] ?? '').trim()
    const post_type = normalizePostType(rawType) ?? 'security'

    // Notes (optional mapping)
    const rawNotes = mapping.notes ? row[mapping.notes] : null
    const notes = rawNotes != null ? String(rawNotes).trim() || null : null

    return {
      rawIndex: idx + 2, // +2: 1-indexed row number accounting for the header row
      name,
      post_type,
      date,
      start_time: start_time ?? '',
      end_time: end_time ?? '',
      headcount_required: isNaN(headcount_required) ? 1 : headcount_required,
      notes,
      hall_id: null,
      validationErrors: errors,
    }
  })
}
