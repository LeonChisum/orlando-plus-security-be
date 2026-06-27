import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { calcDurationHours } from '../../imports/utils/calcDuration'
import { isWorkerEligible, useBoardDnd } from './BoardDndProvider'
import type { AssignCheckParams } from './BoardDndProvider'
import { useWorkerPanel } from '../hooks/useWorkerPanel'
import type { BoardData, BoardAssignment, BoardShift, BoardPost, BoardHall } from '../hooks/useBoardData'
import styles from './ShiftDrawer.module.css'

// ─── Cache helpers ────────────────────────────────────────────────────────────

function mapCacheAssignment(
  old: BoardData,
  assignmentId: string,
  updater: (a: BoardAssignment) => BoardAssignment,
): BoardData {
  return {
    ...old,
    halls: old.halls.map((hall) => ({
      ...hall,
      posts: hall.posts.map((post) => ({
        ...post,
        shifts: post.shifts.map((shift) => ({
          ...shift,
          assignments: shift.assignments.map((a) =>
            a.id === assignmentId ? updater(a) : a,
          ),
        })),
      })),
    })),
  }
}

function filterCacheAssignment(old: BoardData, assignmentId: string): BoardData {
  return {
    ...old,
    halls: old.halls.map((hall) => ({
      ...hall,
      posts: hall.posts.map((post) => ({
        ...post,
        shifts: post.shifts.map((shift) => ({
          ...shift,
          assignments: shift.assignments.filter((a) => a.id !== assignmentId),
        })),
      })),
    })),
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripSeconds(t: string): string {
  return t.slice(0, 5)
}

function fmtTime(t: string): string {
  const [h, m] = stripSeconds(t).split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function fmtDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function fmtDatetime(isoStr: string): string {
  return new Date(isoStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function fmtDuration(hours: number): string {
  if (hours === 0) return '0h'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

type CardVariant = 'open' | 'partial' | 'filled' | 'noShow'

function getVariant(shift: BoardShift, post: BoardPost): CardVariant {
  if (shift.status === 'no_show') return 'noShow'
  const active = shift.assignments.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed',
  ).length
  if (active === 0) return 'open'
  if (active >= post.headcount_required) return 'filled'
  return 'partial'
}

const VARIANT_LABEL: Record<CardVariant, string> = {
  open: 'Open',
  partial: 'Partially staffed',
  filled: 'Fully staffed',
  noShow: 'No-show',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  declined: 'Declined',
  no_show: 'No-show',
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ShiftDrawerProps {
  shift: BoardShift
  post: BoardPost
  hallName: string
  showId: string
  halls: BoardHall[]
  onClose: () => void
}

// ─── ShiftDrawer ─────────────────────────────────────────────────────────────

export default function ShiftDrawer({
  shift,
  post,
  hallName,
  showId,
  halls,
  onClose,
}: ShiftDrawerProps) {
  const { checkAndAssign, checkingShiftId } = useBoardDnd()
  const queryClient = useQueryClient()

  const [addingWorker, setAddingWorker] = useState(false)
  const [workerSearch, setWorkerSearch] = useState('')
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [openOverrideIds, setOpenOverrideIds] = useState<Set<string>>(new Set())

  const { panelWorkers, isLoading: workersLoading } = useWorkerPanel(showId, shift.date, halls)

  // ── Mutations ─────────────────────────────────────────────────────────────

  const { mutate: markNoShow, isPending: isMarkingNoShow } = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('assignments')
        .update({ status: 'no_show' })
        .eq('id', assignmentId)
      if (error) throw error
    },
    onMutate: async (assignmentId) => {
      await queryClient.cancelQueries({ queryKey: ['board', showId] })
      const previous = queryClient.getQueryData<BoardData>(['board', showId])
      queryClient.setQueryData<BoardData>(['board', showId], (old) => {
        if (!old) return old
        return mapCacheAssignment(old, assignmentId, (a) => ({ ...a, status: 'no_show' as const }))
      })
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['board', showId], context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['board', showId] }),
  })

  const { mutate: removeAssignment, isPending: isRemoving } = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId)
      if (error) throw error
    },
    onMutate: async (assignmentId) => {
      await queryClient.cancelQueries({ queryKey: ['board', showId] })
      const previous = queryClient.getQueryData<BoardData>(['board', showId])
      queryClient.setQueryData<BoardData>(['board', showId], (old) => {
        if (!old) return old
        return filterCacheAssignment(old, assignmentId)
      })
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['board', showId], context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['board', showId] }),
  })

  // ── Keyboard close ────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // ── Derived ───────────────────────────────────────────────────────────────

  const assignedWorkerIds = useMemo(
    () =>
      shift.assignments
        .filter((a) => a.status === 'pending' || a.status === 'confirmed')
        .map((a) => a.worker_id),
    [shift.assignments],
  )

  const variant = getVariant(shift, post)
  const activeCount = assignedWorkerIds.length
  const hours = calcDurationHours(stripSeconds(shift.start_time), stripSeconds(shift.end_time))

  const filteredWorkers = useMemo(() => {
    const q = workerSearch.trim().toLowerCase()
    if (!q) return panelWorkers
    return panelWorkers.filter((w) =>
      `${w.first_name} ${w.last_name}`.toLowerCase().includes(q),
    )
  }, [panelWorkers, workerSearch])

  // ── Handlers ─────────────────────────────────────────────────────────────

  function toggleOverride(assignmentId: string) {
    setOpenOverrideIds((prev) => {
      const next = new Set(prev)
      if (next.has(assignmentId)) next.delete(assignmentId)
      else next.add(assignmentId)
      return next
    })
  }

  function handleRemoveClick(a: BoardAssignment) {
    setConfirmRemoveId(a.id)
  }

  function handleAddWorker(params: AssignCheckParams) {
    checkAndAssign(params).catch(() => {})
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Scrim */}
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={`Shift detail: ${post.name}`}
      >
        {/* ── Header ── */}
        <div className={styles.header}>
          <h2 className={styles.title}>{post.name}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close drawer">
            ✕
          </button>
        </div>

        {/* ── Meta strip ── */}
        <div className={styles.meta}>
          <span className={styles.metaHall}>{hallName}</span>
          <span className={styles.metaSep} aria-hidden="true">·</span>
          <span className={styles.metaDate}>{fmtDate(shift.date)}</span>
          <span className={styles.metaSep} aria-hidden="true">·</span>
          <span className={styles.metaTime}>
            {fmtTime(shift.start_time)}–{fmtTime(shift.end_time)}
          </span>
          <span className={styles.metaSep} aria-hidden="true">·</span>
          <span className={styles.metaDuration}>{fmtDuration(hours)}</span>
        </div>

        {/* ── Status row ── */}
        <div className={styles.statusRow}>
          <span
            className={[styles.statusBadge, styles[`statusBadge--${variant}`]].join(' ')}
          >
            {VARIANT_LABEL[variant]}
          </span>
          <span className={styles.headcountText}>
            {activeCount} / {post.headcount_required} assigned
          </span>
          <span
            className={[
              styles.postTypePill,
              styles[`postTypePill--${post.post_type}`],
            ].join(' ')}
          >
            {post.post_type === 'security' ? 'Security' : 'Staffing'}
          </span>
        </div>

        {/* ── Scrollable body ── */}
        <div className={styles.body}>

          {/* ── Assignments ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Assignments</h3>

            {shift.assignments.length === 0 ? (
              <p className={styles.emptyText}>
                No assignments yet. Use drag-and-drop or "Add Worker" below.
              </p>
            ) : (
              <ul className={styles.assignmentList}>
                {shift.assignments.map((a) => (
                  <li key={a.id} className={styles.assignmentRow}>
                    {/* Type badge */}
                    <span
                      className={[
                        styles.typeBadge,
                        styles[`typeBadge--${a.worker.worker_type}`],
                      ].join(' ')}
                      aria-label={a.worker.worker_type}
                    >
                      {a.worker.worker_type === 'guard' ? 'G' : 'S'}
                    </span>

                    {/* Worker info */}
                    <div className={styles.workerInfo}>
                      <span className={styles.workerName}>
                        {a.worker.first_name} {a.worker.last_name}
                      </span>

                      <span
                        className={[
                          styles.statusPill,
                          styles[`statusPill--${a.status}`],
                        ].join(' ')}
                      >
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>

                      <span className={styles.ackText}>
                        {a.acknowledged_at
                          ? `Acknowledged ${fmtDatetime(a.acknowledged_at)}`
                          : 'Pending acknowledgment'}
                      </span>

                      {a.override_reason && (
                        <div className={styles.overrideSection}>
                          <button
                            className={styles.overrideToggle}
                            onClick={() => toggleOverride(a.id)}
                            aria-expanded={openOverrideIds.has(a.id)}
                          >
                            {openOverrideIds.has(a.id) ? '▾' : '▸'} View override reason
                          </button>
                          {openOverrideIds.has(a.id) && (
                            <p className={styles.overrideReason}>{a.override_reason}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Row actions */}
                    <div
                      className={[
                        styles.rowActions,
                        confirmRemoveId === a.id && !!a.acknowledged_at
                          ? styles['rowActions--wide']
                          : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {confirmRemoveId === a.id ? (
                        a.acknowledged_at ? (
                          <>
                            <p className={styles.confirmWarnText}>
                              This guard has already acknowledged this shift. Removing will not
                              automatically notify them.
                            </p>
                            <div className={styles.confirmWarnActions}>
                              <button
                                className={styles.confirmNo}
                                onClick={() => setConfirmRemoveId(null)}
                              >
                                Cancel
                              </button>
                              <button
                                className={styles.confirmYes}
                                onClick={() => {
                                  removeAssignment(a.id)
                                  setConfirmRemoveId(null)
                                }}
                                disabled={isRemoving}
                              >
                                Remove anyway
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className={styles.confirmRow}>
                            <span className={styles.confirmLabel}>Remove?</span>
                            <button
                              className={styles.confirmYes}
                              onClick={() => {
                                removeAssignment(a.id)
                                setConfirmRemoveId(null)
                              }}
                              disabled={isRemoving}
                            >
                              Yes
                            </button>
                            <button
                              className={styles.confirmNo}
                              onClick={() => setConfirmRemoveId(null)}
                            >
                              No
                            </button>
                          </div>
                        )
                      ) : (
                        <>
                          {a.status !== 'no_show' && (
                            <button
                              className={styles.actionBtn}
                              onClick={() => markNoShow(a.id)}
                              disabled={isMarkingNoShow}
                            >
                              No-show
                            </button>
                          )}
                          <button
                            className={[styles.actionBtn, styles['actionBtn--danger']].join(' ')}
                            onClick={() => handleRemoveClick(a)}
                            disabled={isRemoving}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── Add Worker ── */}
          <section className={styles.section}>
            {!addingWorker ? (
              <button
                className={styles.addWorkerBtn}
                onClick={() => setAddingWorker(true)}
              >
                + Add Worker
              </button>
            ) : (
              <div className={styles.addWorkerPanel}>
                <div className={styles.addWorkerHeader}>
                  <h3 className={styles.sectionTitle}>Add Worker</h3>
                  <button
                    className={styles.closeSmall}
                    onClick={() => {
                      setAddingWorker(false)
                      setWorkerSearch('')
                    }}
                    aria-label="Close add worker"
                  >
                    ✕
                  </button>
                </div>

                <input
                  type="search"
                  className={styles.workerSearchInput}
                  placeholder="Search workers…"
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  aria-label="Search workers to add"
                />

                {workersLoading ? (
                  <p className={styles.emptyText}>Loading workers…</p>
                ) : filteredWorkers.length === 0 ? (
                  <p className={styles.emptyText}>No workers found.</p>
                ) : (
                  <ul className={styles.workerList} role="list">
                    {filteredWorkers.map((w) => {
                      const eligible = isWorkerEligible(w.worker_type, post.post_type)
                      const alreadyAssigned = assignedWorkerIds.includes(w.id)
                      const disabled =
                        !eligible || alreadyAssigned || checkingShiftId === shift.id

                      return (
                        <li key={w.id}>
                          <button
                            className={[
                              styles.workerItem,
                              disabled ? styles['workerItem--disabled'] : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            disabled={disabled}
                            onClick={() =>
                              handleAddWorker({
                                workerId: w.id,
                                shiftId: shift.id,
                                workerName: `${w.first_name} ${w.last_name}`,
                                workerType: w.worker_type,
                                postType: post.post_type,
                                shiftDate: shift.date,
                                shiftStart: shift.start_time,
                                shiftEnd: shift.end_time,
                                assignedWorkerIds,
                              })
                            }
                          >
                            <span
                              className={[
                                styles.miniType,
                                styles[`miniType--${w.worker_type}`],
                              ].join(' ')}
                              aria-hidden="true"
                            >
                              {w.worker_type === 'guard' ? 'G' : 'S'}
                            </span>
                            <span className={styles.workerItemName}>
                              {w.first_name} {w.last_name}
                            </span>
                            {alreadyAssigned && (
                              <span className={styles.workerItemNote}>Assigned</span>
                            )}
                            {!eligible && !alreadyAssigned && (
                              <span className={styles.workerItemNote}>Ineligible</span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
