import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { useBoardDnd } from './BoardDndProvider'
import AssignmentOverrideModal from './AssignmentOverrideModal'

interface BoardOverlayProps {
  showId: string
}

export default function BoardOverlay({ showId }: BoardOverlayProps) {
  const { pendingCheck, clearPendingCheck } = useBoardDnd()
  const queryClient = useQueryClient()

  if (!pendingCheck) return null

  const { workerId, shiftId, workerName, shiftDate, shiftStart, shiftEnd, conflicts, overtimeResult } =
    pendingCheck

  async function handleProceed(reason: string): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const { error: assignError } = await supabase.from('assignments').insert({
      shift_id: shiftId,
      worker_id: workerId,
      status: 'pending',
      override_reason: reason,
      override_by: session?.user?.id ?? null,
    })

    if (assignError) throw assignError

    if (overtimeResult?.hasFlag) {
      const { error: otError } = await supabase.from('overtime_flags').insert({
        worker_id: workerId,
        show_id: showId,
        week_start: overtimeResult.weekStart,
        total_hours: overtimeResult.projectedHours,
      })
      if (otError) throw otError
    }

    await queryClient.invalidateQueries({ queryKey: ['board', showId] })
    clearPendingCheck()
  }

  return (
    <AssignmentOverrideModal
      workerName={workerName}
      shiftDate={shiftDate}
      conflicts={conflicts}
      overtimeResult={overtimeResult}
      onProceed={handleProceed}
      onCancel={clearPendingCheck}
    />
  )
}
