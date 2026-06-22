import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { resetShifts } from '../utils/resetShifts'
import type { PostWithShifts } from '../../shows/hooks/useShowDetail'

export function useResetShifts(showId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, PostWithShifts>({
    mutationFn: async (post) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      return resetShifts(
        {
          postId: post.id,
          supervisorName: user?.email ?? 'supervisor',
          existingNotes: post.notes,
        },
        supabase,
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['show-detail', showId] })
    },
  })
}
