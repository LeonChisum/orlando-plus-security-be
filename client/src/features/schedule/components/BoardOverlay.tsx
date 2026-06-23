import { supabase } from '../../../lib/supabase'
import { useBoardDnd } from './BoardDndProvider'
import { useCreateAssignment } from '../hooks/useCreateAssignment'
import AssignmentOverrideModal from './AssignmentOverrideModal'

interface BoardOverlayProps {
  showId: string
}

export default function BoardOverlay({ showId }: BoardOverlayProps) {
  const { pendingCheck, clearPendingCheck } = useBoardDnd()
  const { mutateAsync: createAssignment } = useCreateAssignment()

  if (!pendingCheck) return null

  const { workerId, shiftId, workerName, workerType, shiftDate, conflicts, overtimeResult } =
    pendingCheck

  async function handleProceed(reason: string): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    await createAssignment({
      showId,
      shiftId,
      workerId,
      workerName,
      workerType,
      overrideReason: reason,
      overrideBy: session?.user?.id ?? undefined,
    })

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
