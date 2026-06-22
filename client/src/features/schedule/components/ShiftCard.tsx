import { calcDurationHours } from '../../imports/utils/calcDuration'
import type { BoardShift, BoardPost } from '../hooks/useBoardData'
import styles from './ShiftCard.module.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripSeconds(t: string): string {
  return t.slice(0, 5)
}

function formatTime(t: string): string {
  const [h, m] = stripSeconds(t).split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatDuration(hours: number): string {
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
    (a) => a.status === 'pending' || a.status === 'confirmed'
  ).length
  if (active === 0) return 'open'
  if (active >= post.headcount_required) return 'filled'
  return 'partial'
}

// ─── ShiftCard ────────────────────────────────────────────────────────────────

export interface ShiftCardProps {
  shift: BoardShift
  post: BoardPost
  isOver: boolean
  onCardClick: () => void
}

const MAX_VISIBLE = 3

export default function ShiftCard({ shift, post, isOver, onCardClick }: ShiftCardProps) {
  const variant = getVariant(shift, post)

  const activeCount = shift.assignments.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed'
  ).length

  const hours = calcDurationHours(stripSeconds(shift.start_time), stripSeconds(shift.end_time))
  const visibleAssignments = shift.assignments.slice(0, MAX_VISIBLE)
  const overflowCount = shift.assignments.length - MAX_VISIBLE

  return (
    <div
      className={[
        styles.card,
        styles[`card--${variant}`],
        isOver ? styles['card--dragOver'] : '',
      ].filter(Boolean).join(' ')}
      role="button"
      tabIndex={0}
      onClick={onCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onCardClick()
        }
      }}
      aria-label={`${formatTime(shift.start_time)}–${formatTime(shift.end_time)}, ${activeCount} of ${post.headcount_required} assigned`}
    >
      {/* ── Time + headcount ── */}
      <div className={styles.timeRow}>
        <span className={styles.timeRange}>
          {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
        </span>
        <span className={[styles.headcount, styles[`headcount--${variant}`]].join(' ')}>
          {activeCount}/{post.headcount_required}
        </span>
      </div>

      {/* ── Duration ── */}
      <div className={styles.duration}>{formatDuration(hours)}</div>

      {/* ── Worker pills ── */}
      {shift.assignments.length > 0 && (
        <div className={styles.workers}>
          {visibleAssignments.map((a) => (
            <span
              key={a.id}
              className={[styles.pill, a.status === 'no_show' ? styles['pill--noShow'] : ''].filter(Boolean).join(' ')}
            >
              <span className={[styles.pillType, styles[`pillType--${a.worker.worker_type}`]].join(' ')}>
                {a.worker.worker_type === 'guard' ? 'G' : 'S'}
              </span>
              <span className={styles.pillName}>
                {a.worker.first_name} {a.worker.last_name[0]}.
              </span>
            </span>
          ))}
          {overflowCount > 0 && (
            <span className={[styles.pill, styles['pill--more']].join(' ')}>
              +{overflowCount} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
