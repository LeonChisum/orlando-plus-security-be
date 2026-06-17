import { useQuery } from '@tanstack/react-query'
import { axiosWithAuth } from '../../../lib/utils'
import type { Show } from '../../../types/index'

export const useShows = () =>
  useQuery<Show[]>({
    queryKey: ['shows'],
    queryFn: async () => {
      const { data } = await axiosWithAuth().get<Show[]>('/shows')
      return data
    },
  })

export const useShow = (id: string) =>
  useQuery<Show>({
    queryKey: ['shows', id],
    queryFn: async () => {
      const { data } = await axiosWithAuth().get<Show>(`/shows/${id}`)
      return data
    },
    enabled: !!id,
  })
