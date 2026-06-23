import { supabase } from '../../../lib/supabase'
import { shiftsOverlap } from '../utils/detectOverlap'
import type { Shift } from '../../../types/index'

export interface ConflictDetail {
  showName: string
  postName: string
  shiftStart: string
  shiftEnd: string
  assignmentId: string
}

export interface ConflictResult {
  hasConflict: boolean
  conflicts: ConflictDetail[]
}

type TargetShift = Pick<Shift, 'id' | 'date' | 'start_time' | 'end_time'>

type AssignmentRow = {
  id: string
  shifts: {
    id: string
    start_time: string
    end_time: string
    date: string
    posts: {
      name: string
      halls: {
        shows: {
          name: string
        }
      }
    }
  }
}

export function useConflictCheck() {
  const checkConflict = async (
    workerId: string,
    targetShift: TargetShift,
  ): Promise<ConflictResult> => {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        id,
        shifts!inner (
          id,
          start_time,
          end_time,
          date,
          posts!inner (
            name,
            halls!inner (
              shows!inner (
                name
              )
            )
          )
        )
      `)
      .eq('worker_id', workerId)
      .eq('shifts.date', targetShift.date)
      .neq('status', 'declined')

    if (error) throw error

    const rows = (data ?? []) as unknown as AssignmentRow[]
    const conflicts: ConflictDetail[] = []

    for (const row of rows) {
      if (row.shifts.id === targetShift.id) continue
      if (shiftsOverlap(row.shifts, targetShift)) {
        conflicts.push({
          showName: row.shifts.posts.halls.shows.name,
          postName: row.shifts.posts.name,
          shiftStart: row.shifts.start_time,
          shiftEnd: row.shifts.end_time,
          assignmentId: row.id,
        })
      }
    }

    return { hasConflict: conflicts.length > 0, conflicts }
  }

  return { checkConflict }
}
