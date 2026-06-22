import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBoardData } from '../features/schedule/hooks/useBoardData'
import type { BoardHall, BoardPost, BoardShift } from '../features/schedule/hooks/useBoardData'
import styles from './ScheduleBoardPage.module.css'
import '../features/shows/components/Show.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shiftFillStatus(shift: BoardShift, post: BoardPost): 'open' | 'partial' | 'filled' {
  const n = shift.assignments.length
  if (n === 0) return 'open'
  if (n >= post.headcount_required) return 'filled'
  return 'partial'
}

// ─── ShiftChip (placeholder for 4.3 ShiftCard) ───────────────────────────────

interface ShiftChipProps {
  shift: BoardShift
  post: BoardPost
}

function ShiftChip({ shift, post }: ShiftChipProps) {
  const fill = shiftFillStatus(shift, post)
  const chipClass = [
    styles.shiftChip,
    fill === 'filled' ? styles['shiftChip--filled'] : '',
    fill === 'partial' ? styles['shiftChip--partial'] : '',
  ].filter(Boolean).join(' ')

  return (
    <span className={chipClass}>
      {shift.start_time}–{shift.end_time}
      <span className={styles.shiftAssigned}>
        {shift.assignments.length}/{post.headcount_required}
      </span>
    </span>
  )
}

// ─── PostRow ──────────────────────────────────────────────────────────────────

function PostRow({ post }: { post: BoardPost }) {
  return (
    <div className={styles.postRow}>
      <div className={styles.postInfo}>
        <span className={styles.postName}>{post.name}</span>
        <span className={`${styles.postTypeBadge} ${styles[`postTypeBadge--${post.post_type}`]}`}>
          {post.post_type === 'security' ? 'Security' : 'Staffing'}
        </span>
        <span className={styles.postTime}>{post.start_time}–{post.end_time}</span>
      </div>
      <div className={styles.shiftList}>
        {post.shifts.length === 0 ? (
          <span className={styles.shiftChip} style={{ color: 'var(--text-faint)' }}>No shifts</span>
        ) : (
          post.shifts.map((shift) => (
            <ShiftChip key={shift.id} shift={shift} post={post} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── HallGroup ────────────────────────────────────────────────────────────────

function HallGroup({ hall, filteredPosts }: { hall: BoardHall; filteredPosts: BoardPost[] }) {
  const shiftCount = filteredPosts.reduce((acc, p) => acc + p.shifts.length, 0)

  return (
    <div className={styles.hallGroup}>
      <div className={styles.hallHeader}>
        <span className={styles.hallName}>{hall.name}</span>
        {hall.floor_level && <span className={styles.hallFloor}>{hall.floor_level}</span>}
        <span className={styles.hallCount}>
          {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} · {shiftCount} {shiftCount === 1 ? 'shift' : 'shifts'}
        </span>
      </div>
      <div className={styles.postList}>
        {filteredPosts.map((post) => (
          <PostRow key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}

// ─── BoardCanvas ──────────────────────────────────────────────────────────────

interface BoardCanvasProps {
  halls: BoardHall[]
  selectedDate: string
}

function BoardCanvas({ halls, selectedDate }: BoardCanvasProps) {
  const filtered = useMemo(() => {
    return halls
      .map((hall) => ({
        hall,
        posts: hall.posts.filter((p) => p.date === selectedDate && p.shifts.length > 0),
      }))
      .filter(({ posts }) => posts.length > 0)
  }, [halls, selectedDate])

  if (filtered.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyHeadline}>No shifts for this date</p>
        <p className={styles.emptySub}>Select another date or commit shifts on the show detail page.</p>
      </div>
    )
  }

  return (
    <div className={styles.canvas}>
      {filtered.map(({ hall, posts }) => (
        <HallGroup key={hall.id} hall={hall} filteredPosts={posts} />
      ))}
    </div>
  )
}

// ─── ScheduleBoardPage ────────────────────────────────────────────────────────

export default function ScheduleBoardPage() {
  const { id: showId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: boardData, isLoading, isError } = useBoardData(showId ?? '')

  const dates = useMemo(() => {
    if (!boardData) return []
    const set = new Set(
      boardData.halls.flatMap((h) => h.posts.flatMap((p) => p.shifts.map((s) => s.date)))
    )
    return [...set].sort()
  }, [boardData])

  const selectedDate = dates[0] ?? ''

  const totalShifts = useMemo(
    () => boardData?.halls.flatMap((h) => h.posts.flatMap((p) => p.shifts)).length ?? 0,
    [boardData],
  )

  const totalAssigned = useMemo(
    () =>
      boardData?.halls
        .flatMap((h) => h.posts.flatMap((p) => p.shifts.flatMap((s) => s.assignments)))
        .length ?? 0,
    [boardData],
  )

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>Loading board…</div>
      </div>
    )
  }

  if (isError || !boardData) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p>Show not found.</p>
          <button className="btn btn--ghost" onClick={() => navigate('/shows')}>
            ← Shows
          </button>
        </div>
      </div>
    )
  }

  if (totalShifts === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className="btn btn--ghost" onClick={() => navigate(`/shows/${showId}`)}>
              ← Back
            </button>
            <div>
              <p className={styles.showName}>{boardData.show.name}</p>
              <p className={styles.showMeta}>{boardData.show.venue}</p>
            </div>
          </div>
        </header>
        <div className={styles.emptyState}>
          <p className={styles.emptyHeadline}>No shifts committed yet</p>
          <p className={styles.emptySub}>
            Generate and commit shifts from the show detail page before opening the board.
          </p>
          <button className="btn btn--primary" onClick={() => navigate(`/shows/${showId}`)}>
            Go to Show Detail
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className="btn btn--ghost" onClick={() => navigate(`/shows/${showId}`)}>
            ← Back
          </button>
          <div>
            <p className={styles.showName}>{boardData.show.name}</p>
            <p className={styles.showMeta}>
              {boardData.show.venue} · {boardData.show.start_date}
              {boardData.show.start_date !== boardData.show.end_date
                ? ` – ${boardData.show.end_date}`
                : ''}
            </p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.shiftBadge}>
            {totalShifts} shifts · {totalAssigned} assigned
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className={styles.body}>
        <BoardCanvas halls={boardData.halls} selectedDate={selectedDate} />

        {/* ── Worker panel placeholder (4.4) ── */}
        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Workers</span>
          </div>
          <div className={styles.panelPlaceholder}>
            <span>👷</span>
            <p className={styles.panelPlaceholderText}>
              Worker assignment panel coming in ticket 4.4
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
