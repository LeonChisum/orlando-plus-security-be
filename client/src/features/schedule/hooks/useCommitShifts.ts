import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { Post, SplitStrategy } from '../../../types/index'
import { splitPostIntoShifts } from '../utils/splitPostIntoShifts'
import { commitShifts, type CommitShiftsResult } from '../utils/commitShifts'

export interface CommitEntry {
  post: Post
  strategy: SplitStrategy
}

export function useCommitShifts(showId: string) {
  const queryClient = useQueryClient()

  return useMutation<CommitShiftsResult, Error, CommitEntry[]>({
    mutationFn: (entries) => {
      const allShifts = entries.flatMap(({ post, strategy }) =>
        splitPostIntoShifts(post, strategy),
      )
      return commitShifts(allShifts, supabase)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['show-detail', showId] })
    },
  })
}
