import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { BoardData, BoardAssignment } from './useBoardData'
import type { Worker } from '../../../types/index'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateAssignmentPayload {
  showId: string
  shiftId: string
  workerId: string
  workerName: string
  workerType: 'guard' | 'staffer'
  overrideReason?: string
  overrideBy?: string
}

interface MutationContext {
  previous: BoardData | undefined
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildOptimisticWorker(
  workerId: string,
  workerName: string,
  workerType: 'guard' | 'staffer',
): Worker {
  const spaceIdx = workerName.indexOf(' ')
  const first_name = spaceIdx === -1 ? workerName : workerName.slice(0, spaceIdx)
  const last_name = spaceIdx === -1 ? '' : workerName.slice(spaceIdx + 1)
  return {
    id: workerId,
    first_name,
    last_name,
    email: '',
    worker_type: workerType,
    is_supervisor: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCreateAssignment() {
  const queryClient = useQueryClient()

  return useMutation<BoardAssignment, Error, CreateAssignmentPayload, MutationContext>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          shift_id: payload.shiftId,
          worker_id: payload.workerId,
          status: 'pending',
          override_reason: payload.overrideReason ?? null,
          override_by: payload.overrideBy ?? null,
        })
        .select('*, worker:workers!worker_id(*)')
        .single()
      if (error) throw error
      return data as unknown as BoardAssignment
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['board', payload.showId] })
      const previous = queryClient.getQueryData<BoardData>(['board', payload.showId])

      const optimistic: BoardAssignment = {
        id: `optimistic-${Date.now()}`,
        shift_id: payload.shiftId,
        worker_id: payload.workerId,
        status: 'pending',
        override_reason: payload.overrideReason,
        override_by: payload.overrideBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        worker: buildOptimisticWorker(payload.workerId, payload.workerName, payload.workerType),
      }

      queryClient.setQueryData<BoardData>(['board', payload.showId], (old) => {
        if (!old) return old
        return {
          ...old,
          halls: old.halls.map((hall) => ({
            ...hall,
            posts: hall.posts.map((post) => ({
              ...post,
              shifts: post.shifts.map((shift) => {
                if (shift.id !== payload.shiftId) return shift
                return { ...shift, assignments: [...shift.assignments, optimistic] }
              }),
            })),
          })),
        }
      })

      return { previous }
    },

    onError: (_err, payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['board', payload.showId], context.previous)
      }
    },

    onSettled: (_data, _err, payload) => {
      queryClient.invalidateQueries({ queryKey: ['board', payload.showId] })
    },
  })
}
