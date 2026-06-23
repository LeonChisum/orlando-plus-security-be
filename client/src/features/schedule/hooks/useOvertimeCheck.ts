import { supabase } from '../../../lib/supabase'
import { calcDurationHours } from '../../imports/utils/calcDuration'
import type { Shift } from '../../../types/index'

export interface OvertimeResult {
  hasFlag: boolean
  currentHours: number
  shiftHours: number
  projectedHours: number
  weekStart: string
}

type TargetShift = Pick<Shift, 'id' | 'date' | 'start_time' | 'end_time'>

// Returns the ISO date strings (YYYY-MM-DD) for Monday and Sunday
// of the Mon–Sun week containing the given date.
function getWeekBounds(dateStr: string): { weekStart: string; weekEnd: string } {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dow = date.getDay() // 0 = Sun, 1 = Mon, …, 6 = Sat
  const daysToMon = dow === 0 ? 6 : dow - 1
  const mon = new Date(date)
  mon.setDate(date.getDate() - daysToMon)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { weekStart: toDateStr(mon), weekEnd: toDateStr(sun) }
}

function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

type ShiftRow = {
  shifts: { id: string; start_time: string; end_time: string }
}

export function useOvertimeCheck() {
  const checkOvertime = async (
    workerId: string,
    targetShift: TargetShift,
  ): Promise<OvertimeResult> => {
    const { weekStart, weekEnd } = getWeekBounds(targetShift.date)

    const { data, error } = await supabase
      .from('assignments')
      .select(`
        shifts!inner (
          id,
          start_time,
          end_time
        )
      `)
      .eq('worker_id', workerId)
      .neq('status', 'declined')
      .gte('shifts.date', weekStart)
      .lte('shifts.date', weekEnd)

    if (error) throw error

    const rows = (data ?? []) as unknown as ShiftRow[]

    const currentHours = rows
      .filter((r) => r.shifts.id !== targetShift.id)
      .reduce((sum, r) => sum + calcDurationHours(r.shifts.start_time, r.shifts.end_time), 0)

    const shiftHours = calcDurationHours(targetShift.start_time, targetShift.end_time)
    const projectedHours = currentHours + shiftHours

    return {
      hasFlag: projectedHours >= 40,
      currentHours,
      shiftHours,
      projectedHours,
      weekStart,
    }
  }

  return { checkOvertime }
}
