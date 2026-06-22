// Normalizes a single time value from a buy order cell to "HH:MM" (24hr).
// Range strings like "0600-0000" must be split by the caller before passing here.
export function normalizeTime(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined || raw === '') return null

  // Excel numeric time fraction: 0.0 = 00:00, 0.5 = 12:00, <1.0 = 23:59
  if (typeof raw === 'number') {
    if (raw < 0 || raw >= 1) return null
    const totalMinutes = Math.round(raw * 24 * 60)
    const h = Math.floor(totalMinutes / 60) % 24
    const m = totalMinutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const str = String(raw).trim()

  // "HH:MM" — accept 1- or 2-digit hour
  const colonMatch = str.match(/^(\d{1,2}):(\d{2})$/)
  if (colonMatch) {
    const h = parseInt(colonMatch[1], 10)
    const m = parseInt(colonMatch[2], 10)
    if (h > 23 || m > 59) return null
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  // "HHMM" — 3 or 4 digits (e.g. "630" → "06:30", "0600" → "06:00")
  const hmMatch = str.match(/^(\d{3,4})$/)
  if (hmMatch) {
    const padded = str.padStart(4, '0')
    const h = parseInt(padded.slice(0, 2), 10)
    const m = parseInt(padded.slice(2), 10)
    if (h > 23 || m > 59) return null
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  return null
}

// Splits a range string like "0600-0000" into [start, end] normalized times.
// Returns null for either slot if that half is unparseable.
export function splitTimeRange(raw: string): [string | null, string | null] {
  const parts = raw.split('-')
  if (parts.length !== 2) return [normalizeTime(raw), null]
  return [normalizeTime(parts[0].trim()), normalizeTime(parts[1].trim())]
}
