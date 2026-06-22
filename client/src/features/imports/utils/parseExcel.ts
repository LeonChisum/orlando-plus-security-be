import * as XLSX from 'xlsx'
import type { RawImportRow, MappedPostRow, ColumnMapping } from '../../../types/index'
import { normalizeTime, splitTimeRange } from './parseTime'
import { normalizePostType } from './normalizePostType'
import { calcDurationHours } from './calcDuration'

export interface ParsedWorkbook {
  sheetNames: string[]
  sheets: RawImportRow[][]
}

export interface ExtractionResult {
  posts: MappedPostRow[]
  skippedEmptyCount: number
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

// Converts a raw date cell value (Excel serial number or string) to YYYY-MM-DD.
// Returns null if the value cannot be parsed.
function parseDate(raw: string | number | null): string | null {
  if (raw === null || raw === undefined || raw === '') return null

  if (typeof raw === 'number') {
    // Excel serial date: days since Jan 1, 1900 (adjusted for the 1900 leap-year bug)
    // 25569 = Excel serial for Unix epoch (1970-01-01)
    if (raw < 1) return null
    const d = new Date((raw - 25569) * 86400000)
    if (isNaN(d.getTime())) return null
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const str = String(raw).trim()
  if (!str) return null

  // Already ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str

  // US format: M/D/YYYY or MM/DD/YYYY (assumed — US buy orders)
  const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (usMatch) {
    return `${usMatch[3]}-${usMatch[1].padStart(2, '0')}-${usMatch[2].padStart(2, '0')}`
  }

  // Short year: M/D/YY
  const shortMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
  if (shortMatch) {
    return `20${shortMatch[3]}-${shortMatch[1].padStart(2, '0')}-${shortMatch[2].padStart(2, '0')}`
  }

  return null
}

// Returns true when all mapped required fields for a row are null or blank.
// These rows (empty rows, section headers in non-mapped columns) are skipped silently.
function isEmptyRow(row: RawImportRow, mapping: ColumnMapping): boolean {
  const requiredCols = [mapping.name, mapping.date, mapping.start_time, mapping.end_time]
  return requiredCols.every((col) => {
    const val = row[col]
    return val === null || val === undefined || String(val).trim() === ''
  })
}

export function extractPostRows(
  rows: RawImportRow[],
  mapping: ColumnMapping,
): ExtractionResult {
  let skippedEmptyCount = 0
  const posts: MappedPostRow[] = []

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx]

    if (isEmptyRow(row, mapping)) {
      skippedEmptyCount++
      continue
    }

    const errors: string[] = []

    // Name
    const name = String(row[mapping.name] ?? '').trim()
    if (!name) errors.push('Post name is required')

    // Date — parse to ISO format; supervisor confirms in review
    const rawDate = row[mapping.date]
    const isoDate = parseDate(rawDate as string | number | null)
    const date = isoDate ?? (rawDate != null ? String(rawDate).trim() : '')
    if (!date) {
      errors.push('Date is required')
    } else if (!isoDate) {
      errors.push('Unrecognized date format — expected MM/DD/YYYY')
    }

    // Times — detect range string "HHMM-HHMM" vs separate columns
    let start_time: string | null = null
    let end_time: string | null = null

    if (mapping.start_time === mapping.end_time) {
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

    // Zero-duration: same start and end time
    if (start_time && end_time && calcDurationHours(start_time, end_time) === 0) {
      errors.push('Zero-duration post: start and end time are identical')
    }

    // Headcount — blank or zero defaults to 1
    const rawCount = row[mapping.headcount_required]
    const parsed =
      typeof rawCount === 'number'
        ? rawCount
        : parseInt(String(rawCount ?? ''), 10)
    const headcountDefaulted = isNaN(parsed) || parsed <= 0
    const headcount_required = headcountDefaulted ? 1 : parsed

    // Post type
    const rawType = String(row[mapping.post_type] ?? '').trim()
    const post_type = normalizePostType(rawType) ?? 'security'

    // Notes (optional mapping)
    const rawNotes = mapping.notes ? row[mapping.notes] : null
    const notes = rawNotes != null ? String(rawNotes).trim() || null : null

    posts.push({
      rawIndex: idx + 2, // +2: 1-indexed, accounting for header row
      name,
      post_type,
      date,
      start_time: start_time ?? '',
      end_time: end_time ?? '',
      headcount_required,
      headcountDefaulted,
      notes,
      hall_id: null,
      validationErrors: errors,
    })
  }

  return { posts, skippedEmptyCount }
}
