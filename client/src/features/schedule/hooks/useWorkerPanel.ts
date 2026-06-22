import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { Worker, Availability } from '../../../types/index'
import type { BoardHall } from './useBoardData'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AvailStatus = 'available' | 'no_response'

export interface DateAssignment {
  shift_id: string
  start_time: string
  end_time: string
}

export interface PanelWorker extends Worker {
  availStatus: AvailStatus
  availWindow: string | null
  dateAssignments: DateAssignment[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDayOfWeek(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWorkerPanel(showId: string, date: string, halls: BoardHall[]) {
  const dayOfWeek = useMemo(() => (date ? getDayOfWeek(date) : 0), [date])

  const query = useQuery({
    queryKey: ['workerPanel', showId, date],
    queryFn: async () => {
      const [workersRes, perShowRes, standingRes] = await Promise.all([
        supabase.from('workers').select('*').eq('is_active', true).order('last_name'),
        supabase
          .from('availability')
          .select('*')
          .eq('availability_type', 'per_show')
          .eq('show_id', showId)
          .eq('date', date),
        supabase
          .from('availability')
          .select('*')
          .eq('availability_type', 'standing')
          .eq('day_of_week', dayOfWeek),
      ])
      if (workersRes.error) throw workersRes.error
      if (perShowRes.error) throw perShowRes.error
      if (standingRes.error) throw standingRes.error

      return {
        workers: workersRes.data as Worker[],
        // Standing comes first so per_show records override when both exist for a worker
        availability: [
          ...(standingRes.data as Availability[]),
          ...(perShowRes.data as Availability[]),
        ],
      }
    },
    enabled: !!showId && !!date,
  })

  // Derive assignments on the selected date from already-loaded board data
  const assignmentsByWorker = useMemo(() => {
    const map = new Map<string, DateAssignment[]>()
    halls.forEach(hall =>
      hall.posts.forEach(post =>
        post.shifts
          .filter(s => s.date === date)
          .forEach(shift =>
            shift.assignments.forEach(a => {
              const list = map.get(a.worker_id) ?? []
              list.push({
                shift_id: shift.id,
                start_time: shift.start_time,
                end_time: shift.end_time,
              })
              map.set(a.worker_id, list)
            })
          )
      )
    )
    return map
  }, [halls, date])

  const panelWorkers = useMemo<PanelWorker[]>(() => {
    if (!query.data) return []

    // Map builds per-worker — per_show entries are last so they override standing
    const availMap = new Map<string, Availability>()
    query.data.availability.forEach(a => availMap.set(a.worker_id, a))

    return query.data.workers.map(worker => {
      const avail = availMap.get(worker.id)
      return {
        ...worker,
        availStatus: (avail ? 'available' : 'no_response') as AvailStatus,
        availWindow: avail ? `${avail.start_time.slice(0, 5)}–${avail.end_time.slice(0, 5)}` : null,
        dateAssignments: assignmentsByWorker.get(worker.id) ?? [],
      }
    })
  }, [query.data, assignmentsByWorker])

  return {
    panelWorkers,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
