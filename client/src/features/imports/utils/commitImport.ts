import type { SupabaseClient } from '@supabase/supabase-js'
import type { MappedPostRow, PendingHall, CommitResult, HallInsert } from '../../../types/index'

export async function commitImport(
  showId: string,
  mappedPosts: MappedPostRow[],
  pendingHalls: PendingHall[],
  supabase: SupabaseClient,
  overwritePostIds: string[] = [],
): Promise<CommitResult> {
  // 1. Delete any posts the supervisor chose to overwrite
  if (overwritePostIds.length > 0) {
    const { error } = await supabase.from('posts').delete().in('id', overwritePostIds)
    if (error) throw error
  }

  // 2. Insert pending halls → build tempId → realId map
  const hallIdMap = new Map<string, string>()
  const createdHallIds: string[] = []

  if (pendingHalls.length > 0) {
    const hallInserts: HallInsert[] = pendingHalls.map((ph) => ({
      show_id: showId,
      name: ph.name,
      ...(ph.floor_level != null ? { floor_level: ph.floor_level } : {}),
    }))

    const { data: createdHalls, error: hallError } = await supabase
      .from('halls')
      .insert(hallInserts)
      .select('id')

    if (hallError) throw hallError

    ;(createdHalls ?? []).forEach((hall, idx) => {
      hallIdMap.set(pendingHalls[idx].tempId, hall.id)
      createdHallIds.push(hall.id)
    })
  }

  // 3. Resolve tempIds and build post insert payload
  const postInserts = mappedPosts.map((post) => ({
    hall_id: hallIdMap.get(post.hall_id!) ?? post.hall_id!,
    name: post.name,
    post_type: post.post_type,
    date: post.date,
    start_time: post.start_time,
    end_time: post.end_time,
    headcount_required: post.headcount_required,
    ...(post.notes != null ? { notes: post.notes } : {}),
  }))

  // 4. Batch insert posts
  const { data: createdPosts, error: postError } = await supabase
    .from('posts')
    .insert(postInserts)
    .select('id')

  if (postError) {
    // Rollback: delete any halls created during this session
    if (createdHallIds.length > 0) {
      await supabase.from('halls').delete().in('id', createdHallIds)
    }
    throw postError
  }

  return {
    createdPostIds: (createdPosts ?? []).map((p) => p.id),
    createdHallIds,
  }
}
