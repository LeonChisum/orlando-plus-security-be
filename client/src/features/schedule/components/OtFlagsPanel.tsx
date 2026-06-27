import { useEffect, useState } from 'react'
import { useOvertimeFlags } from '../hooks/useOvertimeFlags'
import type { OtFlagRow } from '../hooks/useOvertimeFlags'
import { useResolveOvertimeFlag, useReopenOvertimeFlag } from '../hooks/useOvertimeFlagActions'
import styles from './OtFlagsPanel.module.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtWeekRange(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const mon = new Date(y, m - 1, d)
  const sun = new Date(y, m - 1, d + 6)
  const fmt = (dt: Date) =>
    dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(mon)} – ${fmt(sun)}`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function fmtHours(h: number): string {
  return `${Math.round(h * 10) / 10} hrs`
}

function workerName(w: OtFlagRow['worker']): string {
  return `${w.first_name} ${w.last_name}`
}

// ─── ActiveFlagRow ────────────────────────────────────────────────────────────

interface ActiveFlagRowProps {
  flag: OtFlagRow
  showId: string
}

function ActiveFlagRow({ flag, showId }: ActiveFlagRowProps) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')
  const { mutate: resolve, isPending } = useResolveOvertimeFlag()

  function handleResolve() {
    resolve({ flagId: flag.id, showId, note })
  }

  return (
    <div className={styles.flagRow}>
      <div className={styles.flagInfo}>
        <span className={styles.flagWorker}>{workerName(flag.worker)}</span>
        <span className={styles.flagMeta}>
          {fmtWeekRange(flag.week_start)}
          <span className={styles.flagSep} aria-hidden="true" />
          <span className={styles.flagHours}>
            {fmtHours(flag.total_hours)}
            <span className={styles.flagLimit}> / 40 hrs</span>
          </span>
        </span>
      </div>

      {noteOpen && (
        <div className={styles.noteField}>
          <label htmlFor={`note-${flag.id}`} className={styles.noteLabel}>
            Supervisor note <span className={styles.optional}>(optional)</span>
          </label>
          <textarea
            id={`note-${flag.id}`}
            className={styles.noteTextarea}
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder="Add context for payroll or labor review…"
            rows={2}
            maxLength={200}
            disabled={isPending}
          />
          <p className={styles.noteCount} aria-live="polite">
            {200 - note.length} chars remaining
          </p>
        </div>
      )}

      <div className={styles.flagActions}>
        <button
          className={styles.noteToggle}
          onClick={() => setNoteOpen((o) => !o)}
          disabled={isPending}
        >
          {noteOpen ? 'Hide note' : note ? 'Edit note' : 'Add note'}
        </button>
        <button
          className={`${styles.resolveBtn}`}
          onClick={handleResolve}
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? 'Saving…' : 'Mark Resolved'}
        </button>
      </div>
    </div>
  )
}

// ─── ResolvedFlagRow ──────────────────────────────────────────────────────────

interface ResolvedFlagRowProps {
  flag: OtFlagRow
  showId: string
}

function ResolvedFlagRow({ flag, showId }: ResolvedFlagRowProps) {
  const { mutate: reopen, isPending } = useReopenOvertimeFlag()

  return (
    <div className={`${styles.flagRow} ${styles['flagRow--resolved']}`}>
      <div className={styles.flagInfo}>
        <span className={styles.flagWorker}>{workerName(flag.worker)}</span>
        <span className={styles.flagMeta}>
          {fmtWeekRange(flag.week_start)}
          <span className={styles.flagSep} aria-hidden="true" />
          <span className={styles.flagHours}>{fmtHours(flag.total_hours)}</span>
        </span>
        {flag.resolution_note && (
          <span className={styles.resolvedNote}>"{flag.resolution_note}"</span>
        )}
        <span className={styles.resolvedBy}>
          Resolved
          {flag.resolved_by_name ? ` by ${flag.resolved_by_name}` : ''}
          {flag.resolved_at ? ` on ${fmtDate(flag.resolved_at)}` : ''}
        </span>
      </div>

      <div className={styles.flagActions}>
        <button
          className={styles.reopenBtn}
          onClick={() => reopen({ flagId: flag.id, showId })}
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? 'Reopening…' : 'Reopen'}
        </button>
      </div>
    </div>
  )
}

// ─── OtFlagsPanel ────────────────────────────────────────────────────────────

interface OtFlagsPanelProps {
  showId: string
  onClose: () => void
}

export default function OtFlagsPanel({ showId, onClose }: OtFlagsPanelProps) {
  const { data: flags, isLoading, isError } = useOvertimeFlags(showId)
  const [resolvedOpen, setResolvedOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const active = flags?.filter((f) => !f.resolved_at) ?? []
  const resolved = flags?.filter((f) => !!f.resolved_at) ?? []

  return (
    <>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div
        className={styles.panel}
        role="dialog"
        aria-modal
        aria-labelledby="ot-panel-title"
      >
        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 id="ot-panel-title" className={styles.title}>
              Overtime Flags
            </h2>
            {active.length > 0 && (
              <span className={styles.countBadge} aria-label={`${active.length} unresolved`}>
                {active.length}
              </span>
            )}
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close OT flags panel"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>
          {isLoading && (
            <div className={styles.loadingState}>Loading flags…</div>
          )}

          {isError && (
            <div className={styles.errorState}>
              Failed to load overtime flags. Please try again.
            </div>
          )}

          {!isLoading && !isError && active.length === 0 && resolved.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyHeadline}>No overtime flags</p>
              <p className={styles.emptySub}>
                Flags appear here when an assignment is saved despite a 40-hour
                overtime warning.
              </p>
            </div>
          )}

          {!isLoading && !isError && (active.length > 0 || resolved.length > 0) && (
            <>
              {/* Active flags */}
              {active.length > 0 && (
                <section className={styles.section}>
                  <h3 className={styles.sectionLabel}>
                    Active
                    <span className={styles.sectionCount}>{active.length}</span>
                  </h3>
                  <div className={styles.flagList}>
                    {active.map((flag) => (
                      <ActiveFlagRow key={flag.id} flag={flag} showId={showId} />
                    ))}
                  </div>
                </section>
              )}

              {/* Resolved flags (collapsible) */}
              {resolved.length > 0 && (
                <section className={styles.section}>
                  <button
                    className={styles.resolvedToggle}
                    onClick={() => setResolvedOpen((o) => !o)}
                    aria-expanded={resolvedOpen}
                  >
                    <span className={styles.toggleCaret} aria-hidden="true">
                      {resolvedOpen ? '▾' : '▸'}
                    </span>
                    {resolvedOpen ? 'Hide' : 'Show'} {resolved.length} resolved
                  </button>

                  {resolvedOpen && (
                    <div className={styles.flagList}>
                      {resolved.map((flag) => (
                        <ResolvedFlagRow key={flag.id} flag={flag} showId={showId} />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {active.length === 0 && (
                <p className={styles.allClear}>All active flags resolved.</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
