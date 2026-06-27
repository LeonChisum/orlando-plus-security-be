import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

interface ResolvePayload {
  flagId: string
  showId: string
  note: string
}

interface ReopenPayload {
  flagId: string
  showId: string
}

async function getSupervisorInfo(): Promise<{ id: string | null; name: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return { id: null, name: 'Supervisor' }

  const { data: worker } = await supabase
    .from('workers')
    .select('id, first_name, last_name')
    .eq('email', user.email)
    .maybeSingle()

  if (!worker) return { id: null, name: user.email }

  return {
    id: worker.id as string,
    name: `${worker.first_name} ${worker.last_name}`,
  }
}

export function useResolveOvertimeFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ flagId, note }: ResolvePayload) => {
      const supervisor = await getSupervisorInfo()

      const { data, error } = await supabase
        .from('overtime_flags')
        .update({
          resolved_by: supervisor.id,
          resolved_by_name: supervisor.name,
          resolved_at: new Date().toISOString(),
          resolution_note: note.trim() || null,
        })
        .eq('id', flagId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSettled: (_data, _err, payload) => {
      queryClient.invalidateQueries({ queryKey: ['overtime_flags', payload.showId] })
    },
  })
}

export function useReopenOvertimeFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ flagId }: ReopenPayload) => {
      const { data, error } = await supabase
        .from('overtime_flags')
        .update({
          resolved_by: null,
          resolved_by_name: null,
          resolved_at: null,
          resolution_note: null,
        })
        .eq('id', flagId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSettled: (_data, _err, payload) => {
      queryClient.invalidateQueries({ queryKey: ['overtime_flags', payload.showId] })
    },
  })
}
