import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { PostType, ShiftStatus, AssignmentStatus } from '../../../types/index'

export interface ShiftWorker {
  first_name: string
  last_name: string
}

export interface ShiftAssignment {
  id: string
  status: AssignmentStatus
  workers: ShiftWorker | null
}

export interface CalShift {
  id: string
  status: ShiftStatus
  start_time: string
  end_time: string
  assignments: ShiftAssignment[]
}

export interface CalPost {
  id: string
  name: string
  post_type: PostType
  date: string
  start_time: string
  end_time: string
  headcount_required: number
  shifts: CalShift[]
}

export interface DayData {
  date: string
  posts: CalPost[]
  totalShifts: number
  filledShifts: number
  openShifts: number
  fillPct: number
}

export function useShowCalendarData(showId: string) {
  return useQuery<Record<string, DayData>>({
    queryKey: ['show-calendar', showId],
    queryFn: async () => {
      const { data: halls, error: hallsErr } = await supabase
        .from('halls')
        .select('id')
        .eq('show_id', showId)

      if (hallsErr) throw hallsErr

      const hallIds = (halls ?? []).map((h) => h.id)
      if (hallIds.length === 0) return {}

      const { data: posts, error: postsErr } = await supabase
        .from('posts')
        .select(`
          id, name, post_type, date, start_time, end_time, headcount_required,
          shifts (
            id, status, start_time, end_time,
            assignments (
              id, status,
              workers ( first_name, last_name )
            )
          )
        `)
        .in('hall_id', hallIds)
        .order('start_time', { ascending: true })

      if (postsErr) throw postsErr

      const dayMap: Record<string, DayData> = {}

      for (const post of (posts as unknown as CalPost[]) ?? []) {
        const { date } = post
        if (!dayMap[date]) {
          dayMap[date] = {
            date,
            posts: [],
            totalShifts: 0,
            filledShifts: 0,
            openShifts: 0,
            fillPct: 0,
          }
        }

        dayMap[date].posts.push(post)

        for (const shift of post.shifts ?? []) {
          dayMap[date].totalShifts++
          if (shift.status === 'filled') {
            dayMap[date].filledShifts++
          } else {
            dayMap[date].openShifts++
          }
        }
      }

      for (const day of Object.values(dayMap)) {
        day.fillPct =
          day.totalShifts > 0
            ? Math.round((day.filledShifts / day.totalShifts) * 100)
            : 0
      }

      return dayMap
    },
    enabled: !!showId,
  })
}
