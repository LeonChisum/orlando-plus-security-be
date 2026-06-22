import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { Show, ShowInsert, ShowUpdate } from '../../../types/index'

export const useShows = () =>
  useQuery<Show[]>({
    queryKey: ['shows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .order('start_date', { ascending: false })
      if (error) throw error
      return data as Show[]
    },
  })

export const useShow = (id: string) =>
  useQuery<Show>({
    queryKey: ['shows', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Show
    },
    enabled: !!id,
  })

export const useCreateShow = () => {
  const queryClient = useQueryClient()
  return useMutation<Show, Error, ShowInsert>({
    mutationFn: async (data) => {
      const { data: row, error } = await supabase
        .from('shows')
        .insert(data)
        .select()
        .single()
      if (error) throw error
      return row as Show
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shows'] })
    },
  })
}

export const useUpdateShow = () => {
  const queryClient = useQueryClient()
  return useMutation<Show, Error, { id: string; data: ShowUpdate }>({
    mutationFn: async ({ id, data }) => {
      const { data: row, error } = await supabase
        .from('shows')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return row as Show
    },
    onSuccess: (_row, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['shows'] })
      queryClient.invalidateQueries({ queryKey: ['shows', id] })
    },
  })
}
