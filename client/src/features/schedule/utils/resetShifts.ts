import type { SupabaseClient } from '@supabase/supabase-js'

export async function checkProtectedAssignments(
  shiftIds: string[],
  supabase: SupabaseClient,
): Promise<number> {
  if (shiftIds.length === 0) return 0
  const { count, error } = await supabase
    .from('assignments')
    .select('id', { count: 'exact', head: true })
    .in('shift_id', shiftIds)
    .or('status.eq.confirmed,acknowledged_at.not.is.null')
  if (error) throw error
  return count ?? 0
}

export interface ResetShiftsInput {
  postId: string
  supervisorName: string
  existingNotes: string | null | undefined
}

export async function resetShifts(
  input: ResetShiftsInput,
  supabase: SupabaseClient,
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('shifts')
    .delete()
    .eq('post_id', input.postId)
  if (deleteError) throw deleteError

  const ts = new Date().toISOString()
  const entry = `[${ts}] Shifts reset by ${input.supervisorName}`
  const newNotes = input.existingNotes ? `${input.existingNotes}\n${entry}` : entry

  const { error: updateError } = await supabase
    .from('posts')
    .update({ notes: newNotes })
    .eq('id', input.postId)
  if (updateError) throw updateError
}
