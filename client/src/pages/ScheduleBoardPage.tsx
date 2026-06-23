import { useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useBoardData } from '../features/schedule/hooks/useBoardData'
import type { BoardHall, BoardPost } from '../features/schedule/hooks/useBoardData'
import BoardDndProvider from '../features/schedule/components/BoardDndProvider'
import BoardOverlay from '../features/schedule/components/BoardOverlay'
import ShiftCard from '../features/schedule/components/ShiftCard'
import WorkerPanel from '../features/schedule/components/WorkerPanel'
import styles from './ScheduleBoardPage.module.css'
import '../features/shows/components/Show.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateTab(isoDate: string): { weekday: string; short: string } {
  const [year, month, day] = isoDate.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    short: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }
}

// ─── DateTabBar ───────────────────────────────────────────────────────────────

interface DateTabBarProps {
  dates: string[]
  selectedDate: string
  onSelect: (date: string) => void
}

function DateTabBar({ dates, selectedDate, onSelect }: DateTabBarProps) {
  return (
    <nav className={styles.dateTabs} aria-label="Date filter">
      {dates.map((date) => {
        const { weekday, short } = formatDateTab(date)
        const isActive = date === selectedDate
        return (
          <button
            key={date}
            className={`${styles.dateTab} ${isActive ? styles['dateTab--active'] : ''}`}
            onClick={() => onSelect(date)}
            aria-pressed={isActive}
          >
            <span className={styles.dateTabWeekday}>{weekday}</span>
            <span className={styles.dateTabDate}>{short}</span>
          </button>
        )
      })}
    </nav>
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
        {post.shifts.map((shift) => (
          <ShiftCard
            key={shift.id}
            shift={shift}
            post={post}
            onCardClick={() => {}}
          />
        ))}
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

  const [searchParams, setSearchParams] = useSearchParams()
  const { data: boardData, isLoading, isError } = useBoardData(showId ?? '')

  const dates = useMemo(() => {
    if (!boardData) return []
    const set = new Set(
      boardData.halls.flatMap((h) => h.posts.flatMap((p) => p.shifts.map((s) => s.date)))
    )
    return [...set].sort()
  }, [boardData])

  // Sync URL param: set on first load or when param is missing/invalid
  useEffect(() => {
    if (dates.length === 0) return
    const current = searchParams.get('date')
    if (!current || !dates.includes(current)) {
      const today = getTodayStr()
      setSearchParams({ date: dates.includes(today) ? today : dates[0] }, { replace: true })
    }
  }, [dates, searchParams, setSearchParams])

  const selectedDate = useMemo(() => {
    if (dates.length === 0) return ''
    const param = searchParams.get('date')
    if (param && dates.includes(param)) return param
    const today = getTodayStr()
    return dates.includes(today) ? today : dates[0]
  }, [dates, searchParams])

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

      {/* ── Date tabs ── */}
      <DateTabBar
        dates={dates}
        selectedDate={selectedDate}
        onSelect={(date) => setSearchParams({ date })}
      />

      {/* ── Body ── */}
      <BoardDndProvider onAssign={() => {}}>
        <div className={styles.body}>
          <BoardCanvas halls={boardData.halls} selectedDate={selectedDate} />
          <WorkerPanel
            showId={showId ?? ''}
            date={selectedDate}
            halls={boardData.halls}
          />
        </div>
        <BoardOverlay showId={showId ?? ''} />
      </BoardDndProvider>
    </div>
  )
}
