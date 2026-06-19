import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { MappedPostRow, PendingHall, ImportSession } from '../../../types/index'
import { supabase } from '../../../lib/supabase'
import { commitImport } from '../utils/commitImport'
import styles from './ReviewConfirmStep.module.css'

// ─── Auto-sequencing ──────────────────────────────────────────────────────────
// Posts that share the same name + hall + date + time window are sequenced:
// "Post Door A" → "Post Door A 1", "Post Door A 2", ...

function autoSequencePosts(posts: MappedPostRow[]): MappedPostRow[] {
  const groups = new Map<string, number[]>()

  posts.forEach((post, idx) => {
    const key = [post.name, post.hall_id ?? '', post.date, post.start_time, post.end_time].join('\0')
    const group = groups.get(key) ?? []
    group.push(idx)
    groups.set(key, group)
  })

  const result = [...posts]

  for (const indices of groups.values()) {
    if (indices.length > 1) {
      indices.forEach((idx, seqNum) => {
        result[idx] = { ...result[idx], name: `${posts[idx].name} ${seqNum + 1}` }
      })
    }
  }

  return result
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExistingPost {
  id: string
  name: string
  date: string
  hall_id: string
}

interface Props {
  showId: string
  posts: MappedPostRow[]
  pendingHalls: PendingHall[]
  onBack: () => void
  onSuccess: () => void
}

// ─── ReviewConfirmStep ────────────────────────────────────────────────────────

const ReviewConfirmStep = ({ showId, posts, pendingHalls, onBack, onSuccess }: Props) => {
  const [sequencedPosts] = useState<MappedPostRow[]>(() => autoSequencePosts(posts))
  const [skippedRows, setSkippedRows] = useState<Set<number>>(new Set())
  const [overwriteRows, setOverwriteRows] = useState<Set<number>>(new Set())
  const [isCommitting, setIsCommitting] = useState(false)
  const [commitError, setCommitError] = useState<string | null>(null)

  // ── Duplicate check ────────────────────────────────────────────────────────

  const {
    data: existingPosts,
    isLoading: checkLoading,
    error: checkError,
    refetch: retryCheck,
  } = useQuery<ExistingPost[]>({
    queryKey: ['duplicate-check', showId],
    queryFn: async () => {
      const { data: halls, error: hallsError } = await supabase
        .from('halls')
        .select('id')
        .eq('show_id', showId)
      if (hallsError) throw hallsError
      if (!halls?.length) return []

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, name, date, hall_id')
        .in('hall_id', halls.map((h) => h.id))
      if (postsError) throw postsError

      return (postsData ?? []) as ExistingPost[]
    },
  })

  // ── Derived ────────────────────────────────────────────────────────────────

  const pendingTempIds = useMemo(
    () => new Set(pendingHalls.map((ph) => ph.tempId)),
    [pendingHalls],
  )

  const erroredRows = useMemo(
    () => sequencedPosts.filter((p) => p.validationErrors.length > 0),
    [sequencedPosts],
  )

  const dbConflictMap = useMemo((): Map<number, ExistingPost> => {
    if (!existingPosts) return new Map()
    const map = new Map<number, ExistingPost>()
    for (const post of sequencedPosts) {
      if (pendingTempIds.has(post.hall_id ?? '')) continue
      const conflict = existingPosts.find(
        (ep) => ep.name === post.name && ep.date === post.date && ep.hall_id === post.hall_id,
      )
      if (conflict) map.set(post.rawIndex, conflict)
    }
    return map
  }, [sequencedPosts, existingPosts, pendingTempIds])

  const unresolvedErrors = useMemo(
    () => erroredRows.filter((p) => !skippedRows.has(p.rawIndex)),
    [erroredRows, skippedRows],
  )

  const unresolvedConflicts = useMemo(
    () => [...dbConflictMap.keys()].filter((i) => !skippedRows.has(i) && !overwriteRows.has(i)),
    [dbConflictMap, skippedRows, overwriteRows],
  )

  const postsToCommit = useMemo(
    () => sequencedPosts.filter((p) => !skippedRows.has(p.rawIndex)),
    [sequencedPosts, skippedRows],
  )

  const canConfirm =
    !checkLoading &&
    unresolvedErrors.length === 0 &&
    unresolvedConflicts.length === 0 &&
    postsToCommit.length > 0 &&
    !isCommitting

  // ── Summary ────────────────────────────────────────────────────────────────

  const securityCount = sequencedPosts.filter((p) => p.post_type === 'security').length
  const staffingCount = sequencedPosts.filter((p) => p.post_type === 'staffing').length

  const dateRange = useMemo(() => {
    const dates = sequencedPosts.map((p) => p.date).filter(Boolean).sort()
    if (!dates.length) return null
    return dates[0] === dates[dates.length - 1]
      ? dates[0]
      : `${dates[0]} – ${dates[dates.length - 1]}`
  }, [sequencedPosts])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const skipRow = (rawIndex: number) => {
    setSkippedRows((prev) => new Set([...prev, rawIndex]))
    setOverwriteRows((prev) => {
      const next = new Set(prev)
      next.delete(rawIndex)
      return next
    })
  }

  const overwriteRow = (rawIndex: number) => {
    setOverwriteRows((prev) => new Set([...prev, rawIndex]))
    setSkippedRows((prev) => {
      const next = new Set(prev)
      next.delete(rawIndex)
      return next
    })
  }

  const undoRow = (rawIndex: number) => {
    setSkippedRows((prev) => {
      const next = new Set(prev)
      next.delete(rawIndex)
      return next
    })
    setOverwriteRows((prev) => {
      const next = new Set(prev)
      next.delete(rawIndex)
      return next
    })
  }

  const handleConfirm = async () => {
    if (!canConfirm) return
    setIsCommitting(true)
    setCommitError(null)

    const overwriteIds = [...overwriteRows]
      .map((rawIdx) => dbConflictMap.get(rawIdx)?.id)
      .filter((id): id is string => !!id)

    const session: ImportSession = { showId, posts: postsToCommit, pendingHalls }

    try {
      await commitImport(session, supabase, overwriteIds)
      onSuccess()
    } catch (err) {
      setCommitError(
        err instanceof Error ? err.message : 'Import failed. Please try again.',
      )
      setIsCommitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.root}>
      {/* Summary cards */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{sequencedPosts.length}</span>
          <span className={styles.summaryLabel}>Total Posts</span>
        </div>
        <div className={styles.summarySep} aria-hidden="true" />
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{securityCount}</span>
          <span className={styles.summaryLabel}>Security</span>
        </div>
        <div className={styles.summarySep} aria-hidden="true" />
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{staffingCount}</span>
          <span className={styles.summaryLabel}>Staffing</span>
        </div>
        <div className={styles.summarySep} aria-hidden="true" />
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{pendingHalls.length}</span>
          <span className={styles.summaryLabel}>New Halls</span>
        </div>
        {dateRange && (
          <>
            <div className={styles.summarySep} aria-hidden="true" />
            <div className={styles.summaryCard}>
              <span className={`${styles.summaryValue} ${styles.summaryValueMono}`}>
                {dateRange}
              </span>
              <span className={styles.summaryLabel}>Date Range</span>
            </div>
          </>
        )}
      </div>

      {/* Validation errors panel */}
      {erroredRows.length > 0 && (
        <div className={styles.panel} role="region" aria-label="Validation errors">
          <div className={`${styles.panelHeader} ${styles.panelHeaderWarn}`}>
            <span className={styles.panelIcon} aria-hidden="true">⚠</span>
            <span className={styles.panelTitle}>
              {unresolvedErrors.length > 0
                ? `${unresolvedErrors.length} row${unresolvedErrors.length !== 1 ? 's' : ''} with errors — skip each row to exclude from import`
                : 'All errors resolved'}
            </span>
          </div>
          <ul className={styles.panelList} role="list">
            {erroredRows.map((row) => {
              const isSkipped = skippedRows.has(row.rawIndex)
              return (
                <li
                  key={row.rawIndex}
                  className={`${styles.panelRow} ${isSkipped ? styles.panelRowResolved : styles.panelRowError}`}
                >
                  <div className={styles.panelRowInfo}>
                    <span className={styles.rowMeta}>Row {row.rawIndex}</span>
                    {isSkipped ? (
                      <span className={styles.resolvedLabel}>Skipped — will not be imported</span>
                    ) : (
                      <ul className={styles.errorList} aria-label={`Errors for row ${row.rawIndex}`}>
                        {row.validationErrors.map((msg, i) => (
                          <li key={i}>{msg}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={styles.panelRowActions}>
                    {isSkipped ? (
                      <button
                        className="btn btn--ghost"
                        onClick={() => undoRow(row.rawIndex)}
                        type="button"
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        className="btn btn--ghost"
                        onClick={() => skipRow(row.rawIndex)}
                        type="button"
                      >
                        Skip row
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Duplicate check status */}
      {checkLoading && (
        <div className={styles.infoBanner} role="status">
          Checking for existing posts on this show...
        </div>
      )}

      {checkError && (
        <div className={styles.warnBanner} role="alert">
          <span>Could not check for existing posts. The import may create duplicates.</span>
          <button
            className="btn btn--ghost"
            onClick={() => retryCheck()}
            type="button"
          >
            Retry check
          </button>
        </div>
      )}

      {/* Duplicates panel */}
      {dbConflictMap.size > 0 && (
        <div className={styles.panel} role="region" aria-label="Duplicate posts">
          <div className={`${styles.panelHeader} ${styles.panelHeaderWarn}`}>
            <span className={styles.panelIcon} aria-hidden="true">⚠</span>
            <span className={styles.panelTitle}>
              {unresolvedConflicts.length > 0
                ? `${unresolvedConflicts.length} post${unresolvedConflicts.length !== 1 ? 's' : ''} already exist on this show — skip or overwrite each`
                : 'All duplicates resolved'}
            </span>
          </div>
          <ul className={styles.panelList} role="list">
            {[...dbConflictMap.entries()].map(([rawIdx, conflict]) => {
              const post = sequencedPosts.find((p) => p.rawIndex === rawIdx)
              if (!post) return null
              const isSkipped = skippedRows.has(rawIdx)
              const isOverwrite = overwriteRows.has(rawIdx)
              const isResolved = isSkipped || isOverwrite
              return (
                <li
                  key={rawIdx}
                  className={`${styles.panelRow} ${isResolved ? styles.panelRowResolved : styles.panelRowWarn}`}
                >
                  <div className={styles.panelRowInfo}>
                    <span className={styles.rowName}>{post.name}</span>
                    <span className={styles.rowMeta}>
                      {post.date} · {post.start_time}–{post.end_time}
                    </span>
                    {isResolved && (
                      <span className={styles.resolvedLabel}>
                        {isSkipped ? 'Skipped — will not be imported' : 'Will replace existing post'}
                      </span>
                    )}
                  </div>
                  <div className={styles.panelRowActions}>
                    {isResolved ? (
                      <button
                        className="btn btn--ghost"
                        onClick={() => undoRow(rawIdx)}
                        type="button"
                      >
                        Undo
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn btn--ghost"
                          onClick={() => skipRow(rawIdx)}
                          type="button"
                        >
                          Skip
                        </button>
                        <button
                          className="btn btn--ghost"
                          onClick={() => overwriteRow(rawIdx)}
                          type="button"
                        >
                          Overwrite
                        </button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Ready bar */}
      <div
        className={`${styles.readyBar} ${postsToCommit.length === 0 ? styles.readyBarEmpty : ''}`}
        role="status"
        aria-live="polite"
      >
        {postsToCommit.length === 0 ? (
          <span className={styles.readyTextEmpty}>
            All rows skipped — nothing to import. Undo a skip or go back to adjust.
          </span>
        ) : (
          <>
            <span className={styles.readyText}>
              <strong>{postsToCommit.length}</strong>
              {sequencedPosts.length !== postsToCommit.length
                ? ` of ${sequencedPosts.length} posts will be imported`
                : ` post${postsToCommit.length !== 1 ? 's' : ''} ready to import`}
            </span>
            {pendingHalls.length > 0 && (
              <span className={styles.readyHalls}>
                + {pendingHalls.length} new {pendingHalls.length === 1 ? 'hall' : 'halls'}
              </span>
            )}
          </>
        )}
      </div>

      {/* Commit error */}
      {commitError && (
        <div className={styles.errorBanner} role="alert">
          <strong>Import failed:</strong> {commitError}
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <button className="btn btn--ghost" onClick={onBack} type="button">
          ← Back
        </button>
        <button
          className="btn btn--primary"
          onClick={handleConfirm}
          disabled={!canConfirm}
          aria-busy={isCommitting}
          type="button"
        >
          {isCommitting
            ? 'Importing...'
            : `Confirm Import (${postsToCommit.length} post${postsToCommit.length !== 1 ? 's' : ''})`}
        </button>
      </div>
    </div>
  )
}

export default ReviewConfirmStep
