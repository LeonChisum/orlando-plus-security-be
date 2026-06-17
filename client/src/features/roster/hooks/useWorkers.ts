import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { Worker, WorkerType } from '../../../types/index'

interface WorkerFilters {
  worker_type?: WorkerType
  include_inactive?: boolean
}

export const useWorkers = (filters: WorkerFilters = {}) => {
  const { worker_type, include_inactive = false } = filters

  return useQuery<Worker[]>({
    queryKey: ['workers', { worker_type, include_inactive }],
    queryFn: async () => {
      let query = supabase
        .from('workers')
        .select('*')
        .order('is_active', { ascending: false })
        .order('last_name')
        .order('first_name')

      if (worker_type) {
        query = query.eq('worker_type', worker_type)
      }

      if (!include_inactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Worker[]
    },
  })
}
