import { useEffect, useState } from 'react'
import type { Post, SplitStrategy } from '../../../types/index'
import { suggestStrategy, splitPostIntoShifts } from '../utils/splitPostIntoShifts'
import styles from './SplitConfirmModal.module.css'

type AutoStrategy = Exclude<SplitStrategy, 'manual'>

const AUTO_STRATEGIES: { value: AutoStrategy; label: string; description: string }[] = [
  { value: 'single', label: '1 shift', description: 'No split — one person covers the full window' },
  { value: 'equal_halves', label: '2 shifts', description: 'Split into two equal halves' },
  { value: 'equal_thirds', label: '3 shifts', description: 'Split into three equal thirds' },
]

interface SplitConfirmModalProps {
  post: Post
  onCommit: (post: Post, strategy: SplitStrategy) => void
  onClose: () => void
  isPending?: boolean
  error?: string | null
}

export default function SplitConfirmModal({
  post,
  onCommit,
  onClose,
  isPending = false,
  error = null,
}: SplitConfirmModalProps) {
  const suggested = suggestStrategy(post) as AutoStrategy
  const [strategy, setStrategy] = useState<AutoStrategy>(suggested)
  const shifts = splitPostIntoShifts(post, strategy)

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
      aria-labelledby="split-modal-title"
    >
      <div
        className="modal-panel"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="split-modal-title">Confirm shifts — {post.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.postInfo}>
            <span className={`sd-type-badge sd-type-badge--${post.post_type}`}>
              {post.post_type === 'security' ? 'Security' : 'Staffing'}
            </span>
            <span className={styles.postTime}>{post.start_time} – {post.end_time}</span>
            <span className={styles.postMeta}>
              {post.headcount_required} {post.headcount_required === 1 ? 'person' : 'people'}
            </span>
          </div>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Split strategy</legend>
            {AUTO_STRATEGIES.map(({ value, label, description }) => (
              <label
                key={value}
                className={`${styles.option} ${strategy === value ? styles.optionSelected : ''}`}
              >
                <input
                  type="radio"
                  name="split-strategy"
                  value={value}
                  checked={strategy === value}
                  onChange={() => setStrategy(value)}
                  className={styles.radio}
                />
                <div className={styles.optionText}>
                  <span className={styles.optionLabel}>
                    {label}
                    {value === suggested && (
                      <span className={styles.suggestedBadge}>Suggested</span>
                    )}
                  </span>
                  <span className={styles.optionDesc}>{description}</span>
                </div>
              </label>
            ))}
          </fieldset>

          <div className={styles.preview}>
            <span className={styles.previewLabel}>Resulting shifts</span>
            <div className={styles.shiftList}>
              {shifts.map((s, i) => (
                <div key={i} className={styles.shiftChip}>
                  <span className={styles.shiftNum}>Shift {i + 1}</span>
                  <span className={styles.shiftTime}>{s.start_time} – {s.end_time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" style={{
            margin: '0 var(--space-5)',
            padding: 'var(--space-2) var(--space-3)',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(210,59,78,.35)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            color: 'var(--danger-500)',
          }}>
            {error}
          </p>
        )}

        <div className="wf-actions" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <button className="btn btn--ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={() => onCommit(post, strategy)}
            disabled={isPending}
          >
            {isPending
              ? 'Saving…'
              : `Confirm ${shifts.length} ${shifts.length === 1 ? 'shift' : 'shifts'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
