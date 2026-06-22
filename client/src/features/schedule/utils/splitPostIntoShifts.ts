import type { Post, SplitStrategy } from '../../../types/index'

export interface ShiftOverride {
  index: number
  start_time: string
  end_time: string
}

export interface PendingShift {
  post_id: string
  date: string
  start_time: string
  end_time: string
  split_strategy: SplitStrategy
}

export interface SplitValidationError {
  shiftIndex: number
  message: string
}

// "HH:MM" → minutes. "24:00" treated as 1440 (end-of-day alias).
export function toMinutes(time: string): number {
  if (time === '24:00') return 1440
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

// minutes → "HH:MM". Values ≥ 1440 wrap (1500 → "01:00", 1440 → "00:00").
export function toTimeString(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Returns the absolute end in minutes, advancing past midnight when end_time < start.
// Equal times are treated as zero duration (not 24h), matching calcDurationHours.
function getAbsoluteEnd(startMin: number, endTime: string): number {
  const endMin = toMinutes(endTime)
  if (endMin === startMin) return startMin
  return endMin < startMin ? endMin + 1440 : endMin
}

export function splitPostIntoShifts(
  post: Post,
  strategy: SplitStrategy,
  overrides?: ShiftOverride[],
): PendingShift[] {
  const startMin = toMinutes(post.start_time)
  const endMin = getAbsoluteEnd(startMin, post.end_time)
  const totalMinutes = endMin - startMin

  const make = (s: number, e: number): PendingShift => ({
    post_id: post.id,
    date: post.date,
    start_time: toTimeString(s),
    end_time: toTimeString(e),
    split_strategy: strategy,
  })

  switch (strategy) {
    case 'single': {
      return [make(startMin, endMin)]
    }

    case 'equal_halves': {
      const block = Math.floor(totalMinutes / 2)
      const mid = startMin + block
      return [make(startMin, mid), make(mid, endMin)]
    }

    case 'equal_thirds': {
      const block = Math.floor(totalMinutes / 3)
      const cut1 = startMin + block
      const cut2 = startMin + block * 2
      return [make(startMin, cut1), make(cut1, cut2), make(cut2, endMin)]
    }

    case 'manual': {
      if (!overrides || overrides.length === 0) {
        return [make(startMin, endMin)]
      }
      const sorted = [...overrides].sort((a, b) => a.index - b.index)
      const shifts: PendingShift[] = sorted.map(o => ({
        post_id: post.id,
        date: post.date,
        start_time: o.start_time,
        end_time: o.end_time,
        split_strategy: strategy,
      }))
      // Append trailing shift if overrides don't reach post end
      if (shifts[shifts.length - 1].end_time !== post.end_time) {
        shifts.push({
          post_id: post.id,
          date: post.date,
          start_time: shifts[shifts.length - 1].end_time,
          end_time: post.end_time,
          split_strategy: strategy,
        })
      }
      return shifts
    }
  }
}

// Returns the recommended split strategy based on post duration.
// ≥ 18h → equal_thirds | 8–17h → equal_halves | < 8h → single
export function suggestStrategy(post: Post): SplitStrategy {
  const startMin = toMinutes(post.start_time)
  const endMin = getAbsoluteEnd(startMin, post.end_time)
  const totalMinutes = endMin - startMin

  if (totalMinutes >= 18 * 60) return 'equal_thirds'
  if (totalMinutes >= 8 * 60) return 'equal_halves'
  return 'single'
}

export function validateSplits(
  post: Post,
  shifts: PendingShift[],
): SplitValidationError[] {
  const errors: SplitValidationError[] = []

  if (shifts.length === 0) {
    return [{ shiftIndex: -1, message: 'No shifts generated' }]
  }

  // First shift start must equal post start
  if (shifts[0].start_time !== post.start_time) {
    errors.push({
      shiftIndex: 0,
      message: `First shift starts at ${shifts[0].start_time} but post starts at ${post.start_time}`,
    })
  }

  // Last shift end must equal post end
  if (shifts[shifts.length - 1].end_time !== post.end_time) {
    errors.push({
      shiftIndex: shifts.length - 1,
      message: `Last shift ends at ${shifts[shifts.length - 1].end_time} but post ends at ${post.end_time}`,
    })
  }

  for (let i = 0; i < shifts.length; i++) {
    const { start_time, end_time } = shifts[i]
    const sMin = toMinutes(start_time)
    const eMin = getAbsoluteEnd(sMin, end_time)

    // No zero or negative duration
    if (eMin <= sMin) {
      errors.push({
        shiftIndex: i,
        message: `Shift has zero or negative duration (${start_time}–${end_time})`,
      })
    }

    // Contiguous — each shift's end must equal the next shift's start (covers gaps + overlaps)
    if (i < shifts.length - 1 && end_time !== shifts[i + 1].start_time) {
      errors.push({
        shiftIndex: i,
        message: `Gap or overlap between shift ${i} (ends ${end_time}) and shift ${i + 1} (starts ${shifts[i + 1].start_time})`,
      })
    }
  }

  return errors
}
