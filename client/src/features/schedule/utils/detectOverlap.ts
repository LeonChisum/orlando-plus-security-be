export function toMinutes(time: string): number {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

type Segment = { start: number; end: number }

// Decompose a shift into one or two same-day segments.
// "00:00" as end_time means end of day (1440 min).
// Midnight-spanning shifts (e.g., 22:00–06:00) split into [22:00, 24:00] + [00:00, 06:00].
function toSegments(t: { start_time: string; end_time: string }): Segment[] {
  const start = toMinutes(t.start_time)
  let end = toMinutes(t.end_time)
  if (end === 0) end = 1440
  if (end <= start) {
    return [
      { start, end: 1440 },
      { start: 0, end },
    ]
  }
  return [{ start, end }]
}

function segOverlap(a: Segment, b: Segment): boolean {
  return a.start < b.end && b.start < a.end
}

export function shiftsOverlap(
  a: { start_time: string; end_time: string },
  b: { start_time: string; end_time: string },
): boolean {
  const segsA = toSegments(a)
  const segsB = toSegments(b)
  return segsA.some((sa) => segsB.some((sb) => segOverlap(sa, sb)))
}
