import { useState, createContext, useContext } from 'react'
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
import styles from './BoardDndProvider.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActiveDragWorker {
  workerId: string
  workerType: 'guard' | 'staffer'
  workerName: string
}

interface BoardDndContextValue {
  activeWorker: ActiveDragWorker | null
}

// ─── Context ─────────────────────────────────────────────────────────────────

const BoardDndContext = createContext<BoardDndContextValue>({ activeWorker: null })

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

  function handleDragEnd(event: DragEndEvent) {
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
    const workerId = parseWorkerId(active.id)
    const shiftId = parseShiftId(over.id)

    if (!workerType || !postType) return

    if (assignedWorkerIds.includes(workerId)) {
      setAnnouncement(`${workerName ?? 'Worker'} is already assigned to this shift.`)
      return
    }

    if (!isWorkerEligible(workerType, postType)) {
      setAnnouncement('Staffers cannot be assigned to security posts.')
      return
    }

    setAnnouncement(`Assigned ${workerName ?? 'worker'} to shift.`)
    onAssign(workerId, shiftId)
  }

  function handleDragCancel() {
    setActiveWorker(null)
    setAnnouncement('Assignment cancelled.')
  }

  return (
    <BoardDndContext.Provider value={{ activeWorker }}>
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
