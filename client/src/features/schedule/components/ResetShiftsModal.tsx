import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { checkProtectedAssignments } from '../utils/resetShifts'
import type { PostWithShifts } from '../../shows/hooks/useShowDetail'
import styles from './ResetShiftsModal.module.css'

interface ResetShiftsModalProps {
  post: PostWithShifts
  onReset: () => void
  onClose: () => void
  isPending?: boolean
}

export default function ResetShiftsModal({
  post,
  onReset,
  onClose,
  isPending = false,
}: ResetShiftsModalProps) {
  const [confirmInput, setConfirmInput] = useState('')
  const shiftIds = post.shifts.map((s) => s.id)
  const shiftCount = shiftIds.length

  const { data: protectedCount = 0, isLoading: isChecking } = useQuery({
    queryKey: ['protected-assignments', shiftIds],
    queryFn: () => checkProtectedAssignments(shiftIds, supabase),
    enabled: shiftIds.length > 0,
  })

  const needsTypedConfirm = protectedCount > 0
  const canConfirm = !needsTypedConfirm || confirmInput.trim() === 'RESET'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-labelledby="reset-modal-title"
    >
      <div
        className="modal-panel"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="reset-modal-title">Reset shifts — {post.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.infoBox}>
            <span className={styles.shiftCount}>
              {shiftCount} {shiftCount === 1 ? 'shift' : 'shifts'}
            </span>
            <span className={styles.postTime}>
              {post.start_time} – {post.end_time}
            </span>
          </div>

          {isChecking ? (
            <p className={styles.checking}>Checking assignments…</p>
          ) : needsTypedConfirm ? (
            <>
              <div className={`${styles.warning} ${styles.warningHard}`}>
                <span className={styles.warningIcon} aria-hidden>⚠</span>
                <p className={styles.warningText}>
                  {protectedCount} {protectedCount === 1 ? 'assignment' : 'assignments'} on this
                  post {protectedCount === 1 ? 'is' : 'are'} confirmed or acknowledged. Resetting
                  will permanently delete all {shiftCount}{' '}
                  {shiftCount === 1 ? 'shift' : 'shifts'} and all associated assignments. This
                  cannot be undone.
                </p>
              </div>
              <div className="wf-field">
                <label htmlFor="reset-confirm-input">Type RESET to confirm</label>
                <input
                  id="reset-confirm-input"
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="RESET"
                  autoComplete="off"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              </div>
            </>
          ) : (
            <div className={styles.warning}>
              <span className={styles.warningIcon} aria-hidden>⚠</span>
              <p className={styles.warningText}>
                This will delete {shiftCount} {shiftCount === 1 ? 'shift' : 'shifts'} for{' '}
                <strong>{post.name}</strong>. Any assignments to these shifts will also be
                removed. This cannot be undone.
              </p>
            </div>
          )}
        </div>

        <div className="wf-actions" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <button className="btn btn--ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button
            className="btn btn--danger"
            onClick={onReset}
            disabled={isPending || isChecking || !canConfirm}
          >
            {isPending
              ? 'Resetting…'
              : `Reset ${shiftCount} ${shiftCount === 1 ? 'shift' : 'shifts'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
