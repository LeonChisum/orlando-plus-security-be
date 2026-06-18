import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { Hall } from '../../../types/index'

export const useHalls = (showId: string) =>
  useQuery<Hall[]>({
    queryKey: ['halls', showId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('halls')
        .select('*')
        .eq('show_id', showId)
        .order('name')
      if (error) throw error
      return data as Hall[]
    },
    enabled: !!showId,
  })
