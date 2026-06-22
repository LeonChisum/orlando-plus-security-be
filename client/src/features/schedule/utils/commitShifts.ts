import type { SupabaseClient } from '@supabase/supabase-js'
import type { PendingShift } from './splitPostIntoShifts'

export interface CommitShiftsResult {
  committed: string[]
  failed: string[]
  errors: Record<string, string>
}

// MVP: client-side pre-insert check. Production hardening: add a unique
// constraint on shifts(post_id) per committed split at the DB level.
export async function commitShifts(
  shifts: PendingShift[],
  supabase: SupabaseClient,
): Promise<CommitShiftsResult> {
  const result: CommitShiftsResult = { committed: [], failed: [], errors: {} }

  const byPost = new Map<string, PendingShift[]>()
  for (const shift of shifts) {
    if (!byPost.has(shift.post_id)) byPost.set(shift.post_id, [])
    byPost.get(shift.post_id)!.push(shift)
  }

  for (const [postId, postShifts] of byPost) {
    const { data: existing, error: checkError } = await supabase
      .from('shifts')
      .select('post_id')
      .eq('post_id', postId)
      .limit(1)

    if (checkError) {
      result.failed.push(postId)
      result.errors[postId] = checkError.message
      continue
    }

    if (existing && existing.length > 0) {
      result.failed.push(postId)
      result.errors[postId] = 'Shifts already committed for this post'
      continue
    }

    const rows = postShifts.map((s) => ({
      post_id: s.post_id,
      date: s.date,
      start_time: s.start_time,
      end_time: s.end_time,
      split_strategy: s.split_strategy,
      status: 'open' as const,
    }))

    const { error: insertError } = await supabase.from('shifts').insert(rows)

    if (insertError) {
      // Clean up any partial inserts for this post before reporting failure
      await supabase.from('shifts').delete().eq('post_id', postId)
      result.failed.push(postId)
      result.errors[postId] = insertError.message
      continue
    }

    result.committed.push(postId)
  }

  return result
}
