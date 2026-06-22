// Converts "HH:MM" to minutes. "24:00" is treated as end-of-day (1440 min).
function toMinutes(t: string): number {
  if (t === '24:00') return 1440
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

// Returns duration in hours between two "HH:MM" times.
// If end < start, the shift crosses midnight and end is treated as next-day.
// If end === start, the shift is zero-duration (returns 0, not 24).
export function calcDurationHours(start: string, end: string): number {
  const startMin = toMinutes(start)
  const endMin = toMinutes(end)
  if (startMin === endMin) return 0
  if (endMin < startMin) return (endMin + 1440 - startMin) / 60
  return (endMin - startMin) / 60
}
