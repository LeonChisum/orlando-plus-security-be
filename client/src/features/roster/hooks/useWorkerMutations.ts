import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { Worker, WorkerInsert, WorkerUpdate } from '../../../types/index'

export const useCreateWorker = () => {
  const queryClient = useQueryClient()

  return useMutation<Worker, Error, WorkerInsert>({
    mutationFn: async (data) => {
      const { data: row, error } = await supabase
        .from('workers')
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return row as Worker
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
    },
  })
}

export const useUpdateWorker = () => {
  const queryClient = useQueryClient()

  return useMutation<Worker, Error, { id: string; data: WorkerUpdate }>({
    mutationFn: async ({ id, data }) => {
      const { data: row, error } = await supabase
        .from('workers')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return row as Worker
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
    },
  })
}
