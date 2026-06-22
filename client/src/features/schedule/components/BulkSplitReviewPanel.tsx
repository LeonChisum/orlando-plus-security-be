import { useState, useMemo, useEffect } from 'react'
import type { Post, SplitStrategy } from '../../../types/index'
import { suggestStrategy, splitPostIntoShifts, validateSplits } from '../utils/splitPostIntoShifts'
import SplitConfirmModal from './SplitConfirmModal'
import styles from './BulkSplitReviewPanel.module.css'

const STRATEGY_LABELS: Record<string, string> = {
  single: '1 shift',
  equal_halves: '2 shifts',
  equal_thirds: '3 shifts',
  manual: 'Manual',
}

export interface BulkEntry {
  post: Post
  hallName: string
}

export interface BulkCommit {
  post: Post
  strategy: SplitStrategy
}

interface BulkSplitReviewPanelProps {
  entries: BulkEntry[]
  onCommit: (commits: BulkCommit[]) => void
  onClose: () => void
  isPending?: boolean
}

export default function BulkSplitReviewPanel({
  entries,
  onCommit,
  onClose,
  isPending = false,
}: BulkSplitReviewPanelProps) {
  const [strategies, setStrategies] = useState<Map<string, SplitStrategy>>(() => {
    const m = new Map<string, SplitStrategy>()
    for (const { post } of entries) {
      m.set(post.id, suggestStrategy(post))
    }
    return m
  })
  const [modified, setModified] = useState<Set<string>>(new Set())
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  // Esc closes the panel; let SplitConfirmModal handle Esc when it's open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editingPost) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, editingPost])

  const rowData = useMemo(
    () =>
      entries.map(({ post, hallName }) => {
        const strategy = strategies.get(post.id) ?? suggestStrategy(post)
        const shifts = splitPostIntoShifts(post, strategy)
        const errors = validateSplits(post, shifts)
        const compactTimes = shifts.map((s) => `${s.start_time}–${s.end_time}`).join(' · ')
        return {
          post,
          hallName,
          strategy,
          errors,
          hasErrors: errors.length > 0,
          isModified: modified.has(post.id),
          compactTimes,
        }
      }),
    [entries, strategies, modified],
  )

  const readyCount = rowData.filter((r) => !r.hasErrors).length
  const errorCount = rowData.filter((r) => r.hasErrors).length
  const anyErrors = errorCount > 0

  const summaryText = anyErrors
    ? `${readyCount} ready · ${errorCount} need review`
    : `${readyCount} ${readyCount === 1 ? 'post' : 'posts'} ready`

  const handleEditCommit = (post: Post, strategy: SplitStrategy) => {
    setStrategies((prev) => new Map(prev).set(post.id, strategy))
    setModified((prev) => new Set(prev).add(post.id))
    setEditingPost(null)
  }

  const handleConfirmAll = () => {
    const commits: BulkCommit[] = rowData.map(({ post, strategy }) => ({ post, strategy }))
    onCommit(commits)
  }

  return (
    <>
      <div className={styles.scrim} onClick={onClose} aria-hidden />

      <div
        className={styles.panel}
        role="dialog"
        aria-modal
        aria-labelledby="bulk-split-title"
      >
        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h2 id="bulk-split-title" className={styles.title}>
              Generate all shifts
            </h2>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
          <p className={`${styles.summary} ${anyErrors ? styles.summaryError : ''}`}>
            {summaryText}
          </p>
        </div>

        {/* ── List ── */}
        <div className={styles.list}>
          {rowData.map(({ post, hallName, strategy, compactTimes, isModified, hasErrors }) => (
            <div
              key={post.id}
              className={`${styles.row} ${hasErrors ? styles.rowError : ''}`}
            >
              <div className={styles.rowInfo}>
                <div className={styles.rowNames}>
                  <span className={styles.postName}>{post.name}</span>
                  <span className={styles.hallTag}>{hallName}</span>
                </div>
                <div className={styles.rowMeta}>
                  <span className={styles.strategyBadge}>
                    {STRATEGY_LABELS[strategy] ?? strategy}
                  </span>
                  {isModified && <span className={styles.modifiedBadge}>Modified</span>}
                  <span className={styles.timeList}>{compactTimes}</span>
                </div>
              </div>

              <button
                className={`btn btn--ghost ${styles.editBtn}`}
                onClick={() => setEditingPost(post)}
                disabled={isPending}
                aria-label={`Edit splits for ${post.name}`}
              >
                Edit
              </button>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          {anyErrors && (
            <p className={styles.footerHint}>
              Resolve {errorCount} {errorCount === 1 ? 'error' : 'errors'} before confirming
            </p>
          )}
          <div className={styles.footerActions}>
            <button className="btn btn--ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </button>
            <button
              className="btn btn--primary"
              onClick={handleConfirmAll}
              disabled={isPending || anyErrors}
              title={anyErrors ? 'Resolve errors before confirming' : undefined}
            >
              {isPending
                ? 'Saving…'
                : `Confirm all ${entries.length} ${entries.length === 1 ? 'post' : 'posts'}`}
            </button>
          </div>
        </div>
      </div>

      {/* Per-post edit — modal overlays the drawer */}
      {editingPost && (
        <SplitConfirmModal
          post={editingPost}
          onCommit={handleEditCommit}
          onClose={() => setEditingPost(null)}
        />
      )}
    </>
  )
}
