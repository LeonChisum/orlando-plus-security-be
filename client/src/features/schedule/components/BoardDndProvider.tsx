import { useState, createContext, useContext, useCallback } from 'react'
import type { ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { useConflictCheck } from '../hooks/useConflictCheck'
import type { ConflictDetail } from '../hooks/useConflictCheck'
import styles from './BoardDndProvider.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActiveDragWorker {
  workerId: string
  workerType: 'guard' | 'staffer'
  workerName: string
}

export interface PendingConflict {
  workerId: string
  shiftId: string
  conflicts: ConflictDetail[]
}

interface BoardDndContextValue {
  activeWorker: ActiveDragWorker | null
  checkingShiftId: string | null
  pendingConflict: PendingConflict | null
  clearPendingConflict: () => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const BoardDndContext = createContext<BoardDndContextValue>({
  activeWorker: null,
  checkingShiftId: null,
  pendingConflict: null,
  clearPendingConflict: () => {},
})

export function useBoardDnd(): BoardDndContextValue {
  return useContext(BoardDndContext)
}

// ─── ID helpers ──────────────────────────────────────────────────────────────

export function parseWorkerId(id: string | number): string {
  return String(id).replace('worker::', '')
}

export function parseShiftId(id: string | number): string {
  return String(id).replace('shift::', '')
}

// ─── Eligibility ─────────────────────────────────────────────────────────────

export function isWorkerEligible(
  workerType: 'guard' | 'staffer',
  postType: 'security' | 'staffing',
): boolean {
  if (workerType === 'guard') return true
  return postType === 'staffing'
}

// ─── Drag overlay mini card ───────────────────────────────────────────────────

function WorkerMiniCard({ worker }: { worker: ActiveDragWorker }) {
  return (
    <div className={styles.miniCard}>
      <span
        className={`${styles.miniTypeBadge} ${styles[`miniTypeBadge--${worker.workerType}`]}`}
        aria-hidden="true"
      >
        {worker.workerType === 'guard' ? 'G' : 'S'}
      </span>
      <span className={styles.miniName}>{worker.workerName}</span>
    </div>
  )
}

// ─── Provider ────────────────────────────────────────────────────────────────

export interface BoardDndProviderProps {
  children: ReactNode
  onAssign: (workerId: string, shiftId: string) => void
}

export default function BoardDndProvider({ children, onAssign }: BoardDndProviderProps) {
  const [activeWorker, setActiveWorker] = useState<ActiveDragWorker | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [checkingShiftId, setCheckingShiftId] = useState<string | null>(null)
  const [pendingConflict, setPendingConflict] = useState<PendingConflict | null>(null)
  const { checkConflict } = useConflictCheck()

  const clearPendingConflict = useCallback(() => setPendingConflict(null), [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current
    if (!data || data.type !== 'worker') return
    const worker: ActiveDragWorker = {
      workerId: data.workerId as string,
      workerType: data.workerType as 'guard' | 'staffer',
      workerName: data.workerName as string,
    }
    setActiveWorker(worker)
    setAnnouncement(
      `Picked up ${worker.workerName}. Use arrow keys to navigate, Space to drop, Escape to cancel.`,
    )
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveWorker(null)

    if (!over) {
      setAnnouncement('Drag cancelled.')
      return
    }

    const workerType = active.data.current?.workerType as 'guard' | 'staffer' | undefined
    const workerName = active.data.current?.workerName as string | undefined
    const postType = over.data.current?.postType as 'security' | 'staffing' | undefined
    const assignedWorkerIds = (over.data.current?.assignedWorkerIds ?? []) as string[]
    const shiftDate = over.data.current?.shiftDate as string | undefined
    const shiftStart = over.data.current?.shiftStart as string | undefined
    const shiftEnd = over.data.current?.shiftEnd as string | undefined
    const workerId = parseWorkerId(active.id)
    const shiftId = parseShiftId(over.id)

    if (!workerType || !postType || !shiftDate || !shiftStart || !shiftEnd) return

    if (assignedWorkerIds.includes(workerId)) {
      setAnnouncement(`${workerName ?? 'Worker'} is already assigned to this shift.`)
      return
    }

    if (!isWorkerEligible(workerType, postType)) {
      setAnnouncement('Staffers cannot be assigned to security posts.')
      return
    }

    setCheckingShiftId(shiftId)
    setAnnouncement(`Checking ${workerName ?? 'worker'} for conflicts…`)

    try {
      const result = await checkConflict(workerId, {
        id: shiftId,
        date: shiftDate,
        start_time: shiftStart,
        end_time: shiftEnd,
      })

      if (result.hasConflict) {
        setPendingConflict({ workerId, shiftId, conflicts: result.conflicts })
        setAnnouncement(
          `Conflict detected: ${workerName ?? 'Worker'} has an overlapping assignment.`,
        )
      } else {
        setAnnouncement(`Assigned ${workerName ?? 'worker'} to shift.`)
        onAssign(workerId, shiftId)
      }
    } catch {
      setAnnouncement('Could not check for conflicts. Please try again.')
    } finally {
      setCheckingShiftId(null)
    }
  }

  function handleDragCancel() {
    setActiveWorker(null)
    setAnnouncement('Assignment cancelled.')
  }

  return (
    <BoardDndContext.Provider
      value={{ activeWorker, checkingShiftId, pendingConflict, clearPendingConflict }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}

        <DragOverlay>
          {activeWorker ? <WorkerMiniCard worker={activeWorker} /> : null}
        </DragOverlay>

        <div
          role="status"
          aria-live="assertive"
          aria-atomic="true"
          className={styles.srOnly}
        >
          {announcement}
        </div>
      </DndContext>
    </BoardDndContext.Provider>
  )
}
