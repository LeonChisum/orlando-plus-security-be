import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

export interface OtFlagRow {
  id: string
  worker_id: string
  show_id: string
  week_start: string
  total_hours: number
  resolution_note: string | null
  resolved_by: string | null
  resolved_by_name: string | null
  resolved_at: string | null
  created_at: string
  worker: { id: string; first_name: string; last_name: string }
}

export function useOvertimeFlags(showId: string) {
  return useQuery<OtFlagRow[]>({
    queryKey: ['overtime_flags', showId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('overtime_flags')
        .select(`
          *,
          worker:workers!worker_id(id, first_name, last_name)
        `)
        .eq('show_id', showId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as OtFlagRow[]
    },
    enabled: !!showId,
  })
}
