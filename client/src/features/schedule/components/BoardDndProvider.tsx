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
import { useOvertimeCheck } from '../hooks/useOvertimeCheck'
import type { OvertimeResult } from '../hooks/useOvertimeCheck'
import styles from './BoardDndProvider.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActiveDragWorker {
  workerId: string
  workerType: 'guard' | 'staffer'
  workerName: string
}

// Holds data for the override modal (4.8).
// conflicts is non-empty when hasConflict; overtimeResult is set when OT flagged.
// In the current pipeline (conflict → OT), only one section is populated per drag,
// but the modal renders whichever sections have data so it can show both if needed.
export interface PendingCheck {
  workerId: string
  shiftId: string
  workerName: string
  shiftDate: string
  shiftStart: string
  shiftEnd: string
  conflicts: ConflictDetail[]
  overtimeResult: OvertimeResult | null
}

interface BoardDndContextValue {
  activeWorker: ActiveDragWorker | null
  checkingShiftId: string | null
  pendingCheck: PendingCheck | null
  clearPendingCheck: () => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const BoardDndContext = createContext<BoardDndContextValue>({
  activeWorker: null,
  checkingShiftId: null,
  pendingCheck: null,
  clearPendingCheck: () => {},
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
  const [pendingCheck, setPendingCheck] = useState<PendingCheck | null>(null)
  const { checkConflict } = useConflictCheck()
  const { checkOvertime } = useOvertimeCheck()

  const clearPendingCheck = useCallback(() => setPendingCheck(null), [])

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

    const targetShift = { id: shiftId, date: shiftDate, start_time: shiftStart, end_time: shiftEnd }

    setCheckingShiftId(shiftId)
    setAnnouncement(`Checking ${workerName ?? 'worker'} for conflicts…`)

    try {
      // ── Step 1: conflict check ────────────────────────────────────────────
      const conflictResult = await checkConflict(workerId, targetShift)

      if (conflictResult.hasConflict) {
        setPendingCheck({
          workerId,
          shiftId,
          workerName: workerName ?? 'Unknown',
          shiftDate,
          shiftStart,
          shiftEnd,
          conflicts: conflictResult.conflicts,
          overtimeResult: null,
        })
        setAnnouncement(
          `Conflict detected: ${workerName ?? 'Worker'} has an overlapping assignment.`,
        )
        return
      }

      // ── Step 2: overtime check (only runs after clean conflict result) ────
      const overtimeResult = await checkOvertime(workerId, targetShift)

      if (overtimeResult.hasFlag) {
        setPendingCheck({
          workerId,
          shiftId,
          workerName: workerName ?? 'Unknown',
          shiftDate,
          shiftStart,
          shiftEnd,
          conflicts: [],
          overtimeResult,
        })
        setAnnouncement(
          `Overtime: ${workerName ?? 'Worker'} has ${round1(overtimeResult.currentHours)} hrs this week. ` +
          `This shift adds ${round1(overtimeResult.shiftHours)} hrs, reaching ${round1(overtimeResult.projectedHours)} hrs total.`,
        )
        return
      }

      // ── Step 3: clean — write the assignment ─────────────────────────────
      setAnnouncement(`Assigned ${workerName ?? 'worker'} to shift.`)
      onAssign(workerId, shiftId)
    } catch {
      setAnnouncement('Could not complete assignment check. Please try again.')
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
      value={{ activeWorker, checkingShiftId, pendingCheck, clearPendingCheck }}
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

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
