import { useEffect, useState } from 'react'
import type { ConflictDetail } from '../hooks/useConflictCheck'
import type { OvertimeResult } from '../hooks/useOvertimeCheck'
import styles from './AssignmentOverrideModal.module.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(t: string): string {
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function fmtDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function fmtHours(h: number): string {
  return `${Math.round(h * 10) / 10} hrs`
}

function weekEndStr(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  return new Date(y, m - 1, d + 6).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ─── AssignmentOverrideModal ──────────────────────────────────────────────────

interface AssignmentOverrideModalProps {
  workerName: string
  shiftDate: string
  conflicts: ConflictDetail[]
  overtimeResult: OvertimeResult | null
  onProceed: (reason: string) => Promise<void>
  onCancel: () => void
}

const MIN_REASON_LEN = 10

export default function AssignmentOverrideModal({
  workerName,
  shiftDate,
  conflicts,
  overtimeResult,
  onProceed,
  onCancel,
}: AssignmentOverrideModalProps) {
  const [reason, setReason] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasConflict = conflicts.length > 0
  const hasOT = overtimeResult?.hasFlag ?? false
  const canProceed = reason.trim().length >= MIN_REASON_LEN && !isPending

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  async function handleProceed() {
    if (!canProceed) return
    setIsPending(true)
    setError(null)
    try {
      await onProceed(reason.trim())
    } catch {
      setError('Failed to save override. Please try again.')
      setIsPending(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal
      aria-labelledby="override-modal-title"
    >
      <div
        className="modal-panel"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="modal-header">
          <h2 id="override-modal-title">
            Review Before Assigning — {workerName}
          </h2>
          <button className="modal-close" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {/* ── Shift context ── */}
          <p className={styles.shiftContext}>
            {fmtDate(shiftDate)}
          </p>

          {/* ── Conflict section ── */}
          {hasConflict && (
            <section className={`${styles.flagSection} ${styles['flagSection--conflict']}`}>
              <div className={styles.flagHeader}>
                <span className={styles.flagIcon} aria-hidden="true">⚠</span>
                <span className={styles.flagTitle}>Schedule Conflict</span>
              </div>
              <p className={styles.flagDesc}>
                {workerName} is already assigned to the following overlapping{' '}
                {conflicts.length === 1 ? 'shift' : 'shifts'}:
              </p>
              <ul className={styles.conflictList}>
                {conflicts.map((c) => (
                  <li key={c.assignmentId} className={styles.conflictRow}>
                    <span className={styles.conflictShow}>{c.showName}</span>
                    <span className={styles.conflictPost}>{c.postName}</span>
                    <span className={styles.conflictTime}>
                      {fmtTime(c.shiftStart)}–{fmtTime(c.shiftEnd)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── OT section ── */}
          {hasOT && overtimeResult && (
            <section className={`${styles.flagSection} ${styles['flagSection--ot']}`}>
              <div className={styles.flagHeader}>
                <span className={styles.flagIcon} aria-hidden="true">⚠</span>
                <span className={styles.flagTitle}>Overtime Warning</span>
              </div>
              <ul className={styles.otList}>
                <li className={styles.otRow}>
                  <span className={styles.otLabel}>Currently scheduled</span>
                  <span className={styles.otValue}>{fmtHours(overtimeResult.currentHours)} this week</span>
                </li>
                <li className={styles.otRow}>
                  <span className={styles.otLabel}>This shift adds</span>
                  <span className={styles.otValue}>{fmtHours(overtimeResult.shiftHours)}</span>
                </li>
                <li className={`${styles.otRow} ${styles['otRow--total']}`}>
                  <span className={styles.otLabel}>Projected total</span>
                  <span className={styles.otValue}>
                    {fmtHours(overtimeResult.projectedHours)}{' '}
                    <span className={styles.otLimit}>(limit: 40 hrs)</span>
                  </span>
                </li>
                <li className={styles.otRow}>
                  <span className={styles.otLabel}>Week</span>
                  <span className={styles.otValue}>
                    {fmtDate(overtimeResult.weekStart)} – {weekEndStr(overtimeResult.weekStart)}
                  </span>
                </li>
              </ul>
            </section>
          )}

          {/* ── Reason textarea ── */}
          <div className={styles.reasonField}>
            <label htmlFor="override-reason" className={styles.reasonLabel}>
              Reason for override <span className={styles.required}>*</span>
            </label>
            <textarea
              id="override-reason"
              className={styles.reasonTextarea}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why this assignment should proceed despite the flag…"
              rows={3}
              disabled={isPending}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <p className={styles.reasonHint} aria-live="polite">
              {reason.trim().length < MIN_REASON_LEN
                ? `${MIN_REASON_LEN - reason.trim().length} more character${MIN_REASON_LEN - reason.trim().length === 1 ? '' : 's'} required`
                : ''}
            </p>
          </div>

          {/* ── Error ── */}
          {error && <p className={styles.errorMsg} role="alert">{error}</p>}
        </div>

        {/* ── Actions ── */}
        <div className="wf-actions" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <button className="btn btn--ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={handleProceed}
            disabled={!canProceed}
            aria-disabled={!canProceed}
          >
            {isPending ? 'Saving…' : 'Proceed Anyway'}
          </button>
        </div>
      </div>
    </div>
  )
}
