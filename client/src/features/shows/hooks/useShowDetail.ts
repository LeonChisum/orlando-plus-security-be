import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { Show, Hall, Post } from '../../../types/index'

export type PostWithShifts = Post & { shifts: { id: string }[] }
export type HallWithPosts = Hall & { posts: PostWithShifts[] }
export type ShowDetail = Show & { halls: HallWithPosts[] }

export function useShowDetail(showId: string) {
  return useQuery<ShowDetail>({
    queryKey: ['show-detail', showId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shows')
        .select('*, halls(*, posts(*, shifts(id)))')
        .eq('id', showId)
        .single()
      if (error) throw error
      return data as ShowDetail
    },
    enabled: !!showId,
  })
}
