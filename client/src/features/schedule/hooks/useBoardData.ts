import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { Show, Hall, Post, Shift, Assignment, Worker } from '../../../types/index'

export interface BoardAssignment extends Assignment {
  worker: Worker
}

export interface BoardShift extends Shift {
  assignments: BoardAssignment[]
}

export interface BoardPost extends Post {
  shifts: BoardShift[]
}

export interface BoardHall extends Hall {
  posts: BoardPost[]
}

export interface BoardData {
  show: Show
  halls: BoardHall[]
}

type RawShowWithHalls = Show & { halls: BoardHall[] }

export function useBoardData(showId: string) {
  return useQuery<BoardData>({
    queryKey: ['board', showId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shows')
        .select(`
          *,
          halls (
            *,
            posts (
              *,
              shifts (
                *,
                assignments (
                  *,
                  worker:workers!worker_id (*)
                )
              )
            )
          )
        `)
        .eq('id', showId)
        .single()
      if (error) throw error
      const { halls, ...show } = data as unknown as RawShowWithHalls
      return { show: show as Show, halls }
    },
    enabled: !!showId,
  })
}
