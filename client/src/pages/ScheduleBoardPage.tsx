import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useBoardData } from '../features/schedule/hooks/useBoardData'
import type { BoardHall, BoardPost, BoardShift } from '../features/schedule/hooks/useBoardData'
import { useCreateAssignment } from '../features/schedule/hooks/useCreateAssignment'
import { useOvertimeFlags } from '../features/schedule/hooks/useOvertimeFlags'
import BoardDndProvider from '../features/schedule/components/BoardDndProvider'
import BoardOverlay from '../features/schedule/components/BoardOverlay'
import OtFlagsPanel from '../features/schedule/components/OtFlagsPanel'
import ShiftCard from '../features/schedule/components/ShiftCard'
import ShiftDrawer from '../features/schedule/components/ShiftDrawer'
import WorkerPanel from '../features/schedule/components/WorkerPanel'
import styles from './ScheduleBoardPage.module.css'
import '../features/shows/components/Show.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterState {
  status: 'all' | 'open' | 'partial' | 'filled'
  postType: 'all' | 'security' | 'staffing'
  selectedHallIds: string[]
}

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

type ShiftVariant = 'open' | 'partial' | 'filled' | 'noShow'

function getShiftVariant(shift: BoardShift, post: BoardPost): ShiftVariant {
  if (shift.status === 'no_show') return 'noShow'
  const active = shift.assignments.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed',
  ).length
  if (active === 0) return 'open'
  if (active >= post.headcount_required) return 'filled'
  return 'partial'
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

// ─── FilterBar ────────────────────────────────────────────────────────────────

interface FilterBarProps {
  halls: BoardHall[]
  filterState: FilterState
  onUpdate: (patch: Partial<FilterState>) => void
}

function FilterBar({ halls, filterState, onUpdate }: FilterBarProps) {
  const [hallDropOpen, setHallDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hallDropOpen) return
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setHallDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [hallDropOpen])

  const allHallsSelected = filterState.selectedHallIds.length === 0
  const hallLabel = allHallsSelected
    ? 'All Halls'
    : `${filterState.selectedHallIds.length} Hall${filterState.selectedHallIds.length !== 1 ? 's' : ''}`

  function toggleHall(id: string) {
    if (allHallsSelected) {
      onUpdate({ selectedHallIds: halls.map((h) => h.id).filter((hid) => hid !== id) })
    } else if (filterState.selectedHallIds.includes(id)) {
      const next = filterState.selectedHallIds.filter((hid) => hid !== id)
      onUpdate({ selectedHallIds: next.length === 0 ? [] : next })
    } else {
      const next = [...filterState.selectedHallIds, id]
      onUpdate({ selectedHallIds: next.length === halls.length ? [] : next })
    }
  }

  function isHallChecked(id: string) {
    return allHallsSelected || filterState.selectedHallIds.includes(id)
  }

  const hasActiveFilter =
    filterState.status !== 'all' || filterState.postType !== 'all' || !allHallsSelected

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterGroup} role="group" aria-label="Shift status filter">
        {(['all', 'open', 'partial', 'filled'] as const).map((v) => (
          <button
            key={v}
            className={`${styles.filterPill} ${filterState.status === v ? styles['filterPill--active'] : ''}`}
            onClick={() => onUpdate({ status: v })}
            aria-pressed={filterState.status === v}
          >
            {v === 'all' ? 'All' : v === 'open' ? 'Open' : v === 'partial' ? 'Partial' : 'Filled'}
          </button>
        ))}
      </div>

      <div className={styles.filterDivider} aria-hidden="true" />

      <div className={styles.filterGroup} role="group" aria-label="Post type filter">
        {(['all', 'security', 'staffing'] as const).map((v) => (
          <button
            key={v}
            className={`${styles.filterPill} ${filterState.postType === v ? styles['filterPill--active'] : ''}`}
            onClick={() => onUpdate({ postType: v })}
            aria-pressed={filterState.postType === v}
          >
            {v === 'all' ? 'All Types' : v === 'security' ? 'Security' : 'Staffing'}
          </button>
        ))}
      </div>

      <div className={styles.filterDivider} aria-hidden="true" />

      <div className={styles.hallDropWrap} ref={dropRef}>
        <button
          className={`${styles.filterPill} ${!allHallsSelected ? styles['filterPill--active'] : ''}`}
          onClick={() => setHallDropOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={hallDropOpen}
        >
          {hallLabel}
          <span className={styles.dropCaret} aria-hidden="true">▾</span>
        </button>
        {hallDropOpen && (
          <div
            className={styles.hallDrop}
            role="listbox"
            aria-multiselectable="true"
            aria-label="Hall selection"
          >
            <button
              className={`${styles.hallDropItem} ${allHallsSelected ? styles['hallDropItem--checked'] : ''}`}
              onClick={() => {
                onUpdate({ selectedHallIds: [] })
                setHallDropOpen(false)
              }}
            >
              <span className={styles.hallDropCheck} aria-hidden="true">
                {allHallsSelected ? '✓' : ''}
              </span>
              All Halls
            </button>
            <div className={styles.hallDropDivider} aria-hidden="true" />
            {halls.map((hall) => {
              const checked = isHallChecked(hall.id)
              return (
                <button
                  key={hall.id}
                  className={`${styles.hallDropItem} ${checked && !allHallsSelected ? styles['hallDropItem--checked'] : ''}`}
                  onClick={() => toggleHall(hall.id)}
                  role="option"
                  aria-selected={isHallChecked(hall.id)}
                >
                  <span className={styles.hallDropCheck} aria-hidden="true">
                    {checked ? '✓' : ''}
                  </span>
                  {hall.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {hasActiveFilter && (
        <button
          className={styles.clearFilters}
          onClick={() => onUpdate({ status: 'all', postType: 'all', selectedHallIds: [] })}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

// ─── StatusBar ────────────────────────────────────────────────────────────────

interface StatusBarProps {
  showId: string
  halls: BoardHall[]
  selectedDate: string
  onOpenOtPanel: () => void
}

function StatusBar({ showId, halls, selectedDate, onOpenOtPanel }: StatusBarProps) {
  const stats = useMemo(() => {
    let open = 0, partial = 0, filled = 0, noShow = 0, unacknowledged = 0, overrides = 0, total = 0

    for (const hall of halls) {
      for (const post of hall.posts) {
        if (post.date !== selectedDate) continue
        for (const shift of post.shifts) {
          total++
          const v = getShiftVariant(shift, post)
          if (v === 'open') open++
          else if (v === 'partial') partial++
          else if (v === 'filled') filled++
          else if (v === 'noShow') noShow++

          for (const a of shift.assignments) {
            if (!a.acknowledged_at && (a.status === 'pending' || a.status === 'confirmed')) {
              unacknowledged++
            }
            if (a.override_reason) overrides++
          }
        }
      }
    }

    return { total, open, partial, filled, noShow, unacknowledged, overrides }
  }, [halls, selectedDate])

  const { data: otFlags } = useOvertimeFlags(showId)
  const unresolvedOt = otFlags?.filter((f) => !f.resolved_at).length ?? 0

  const allClear = stats.unacknowledged === 0 && stats.overrides === 0 && unresolvedOt === 0

  return (
    <div className={styles.statusBar} role="status" aria-label="Board status summary">
      <div className={styles.statusGroup}>
        <span className={styles.statusItem}>
          <span className={styles.statusCount}>{stats.total}</span>
          <span className={styles.statusLabel}>shifts</span>
        </span>
        <div className={styles.statusSep} aria-hidden="true" />
        <span className={`${styles.statusItem} ${stats.open > 0 ? styles['statusItem--warn'] : ''}`}>
          <span className={styles.statusCount}>{stats.open}</span>
          <span className={styles.statusLabel}>open</span>
        </span>
        <span className={`${styles.statusItem} ${stats.partial > 0 ? styles['statusItem--warn'] : ''}`}>
          <span className={styles.statusCount}>{stats.partial}</span>
          <span className={styles.statusLabel}>partial</span>
        </span>
        <span className={`${styles.statusItem} ${stats.filled > 0 ? styles['statusItem--ok'] : ''}`}>
          <span className={styles.statusCount}>{stats.filled}</span>
          <span className={styles.statusLabel}>filled</span>
        </span>
        {stats.noShow > 0 && (
          <span className={`${styles.statusItem} ${styles['statusItem--danger']}`}>
            <span className={styles.statusCount}>{stats.noShow}</span>
            <span className={styles.statusLabel}>no-show</span>
          </span>
        )}
      </div>

      <div className={styles.statusBarDivider} aria-hidden="true" />

      <div className={styles.statusGroup}>
        {stats.unacknowledged > 0 && (
          <span className={`${styles.statusItem} ${styles['statusItem--warn']}`}>
            <span className={styles.statusCount}>{stats.unacknowledged}</span>
            <span className={styles.statusLabel}>unacknowledged</span>
          </span>
        )}
        {stats.overrides > 0 && (
          <span className={`${styles.statusItem} ${styles['statusItem--warn']}`}>
            <span className={styles.statusCount}>{stats.overrides}</span>
            <span className={styles.statusLabel}>overrides</span>
          </span>
        )}
        {unresolvedOt > 0 && (
          <button
            className={styles.otFlagChip}
            onClick={onOpenOtPanel}
            aria-label={`${unresolvedOt} unresolved overtime flag${unresolvedOt === 1 ? '' : 's'} — click to review`}
          >
            <span className={styles.statusCount}>{unresolvedOt}</span>
            <span className={styles.statusLabel}>OT flag{unresolvedOt === 1 ? '' : 's'}</span>
          </button>
        )}
        {allClear && stats.total > 0 && (
          <span className={`${styles.statusItem} ${styles['statusItem--ok']}`}>
            <span className={styles.statusLabel}>All clear</span>
          </span>
        )}
      </div>
    </div>
  )
}

// ─── PostRow ──────────────────────────────────────────────────────────────────

function PostRow({
  post,
  selectedShiftId,
  onShiftClick,
}: {
  post: BoardPost
  selectedShiftId: string | null
  onShiftClick: (shiftId: string) => void
}) {
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
            onCardClick={() => onShiftClick(shift.id)}
            isSelected={selectedShiftId === shift.id}
          />
        ))}
      </div>
    </div>
  )
}

// ─── HallGroup ────────────────────────────────────────────────────────────────

function HallGroup({
  hall,
  filteredPosts,
  selectedShiftId,
  onShiftClick,
}: {
  hall: BoardHall
  filteredPosts: BoardPost[]
  selectedShiftId: string | null
  onShiftClick: (shiftId: string) => void
}) {
  const shiftCount = filteredPosts.reduce((acc, p) => acc + p.shifts.length, 0)

  return (
    <div className={styles.hallGroup}>
      <div className={styles.hallHeader}>
        <span className={styles.hallName}>{hall.name}</span>
        {hall.floor_level && <span className={styles.hallFloor}>{hall.floor_level}</span>}
        <span className={styles.hallCount}>
          {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} · {shiftCount}{' '}
          {shiftCount === 1 ? 'shift' : 'shifts'}
        </span>
      </div>
      {filteredPosts.length === 0 ? (
        <div className={styles.hallEmpty}>No posts match this filter</div>
      ) : (
        <div className={styles.postList}>
          {filteredPosts.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              selectedShiftId={selectedShiftId}
              onShiftClick={onShiftClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── BoardCanvas ──────────────────────────────────────────────────────────────

interface BoardCanvasProps {
  halls: BoardHall[]
  selectedDate: string
  selectedShiftId: string | null
  onShiftClick: (shiftId: string) => void
  filterState: FilterState
}

function BoardCanvas({ halls, selectedDate, selectedShiftId, onShiftClick, filterState }: BoardCanvasProps) {
  const filtered = useMemo(() => {
    return halls
      .filter((hall) => {
        if (
          filterState.selectedHallIds.length > 0 &&
          !filterState.selectedHallIds.includes(hall.id)
        ) {
          return false
        }
        return hall.posts.some((p) => p.date === selectedDate && p.shifts.length > 0)
      })
      .map((hall) => ({
        hall,
        posts: hall.posts.filter((p) => {
          if (p.date !== selectedDate || p.shifts.length === 0) return false
          if (filterState.postType !== 'all' && p.post_type !== filterState.postType) return false
          if (filterState.status !== 'all') {
            return p.shifts.some((s) => {
              const v = getShiftVariant(s, p)
              return filterState.status === 'open'
                ? v === 'open'
                : filterState.status === 'partial'
                  ? v === 'partial'
                  : v === 'filled'
            })
          }
          return true
        }),
      }))
  }, [halls, selectedDate, filterState])

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
        <HallGroup
          key={hall.id}
          hall={hall}
          filteredPosts={posts}
          selectedShiftId={selectedShiftId}
          onShiftClick={onShiftClick}
        />
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
  const { mutate: createAssignment } = useCreateAssignment()
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)
  const [showOtPanel, setShowOtPanel] = useState(false)

  const dates = useMemo(() => {
    if (!boardData) return []
    const set = new Set(
      boardData.halls.flatMap((h) => h.posts.flatMap((p) => p.shifts.map((s) => s.date))),
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

  // Close drawer when the date tab changes
  useEffect(() => {
    setSelectedShiftId(null)
  }, [selectedDate])

  // Filter state from URL params — validate hall IDs against live data
  const filterState = useMemo<FilterState>(() => {
    const rawStatus = searchParams.get('status') ?? 'all'
    const rawPostType = searchParams.get('postType') ?? 'all'
    const rawHalls = searchParams.get('halls') ?? ''
    const rawHallIds = rawHalls ? rawHalls.split(',').filter(Boolean) : []
    const validHallIds = boardData
      ? rawHallIds.filter((id) => boardData.halls.some((h) => h.id === id))
      : rawHallIds
    return {
      status: (['open', 'partial', 'filled'] as string[]).includes(rawStatus)
        ? (rawStatus as FilterState['status'])
        : 'all',
      postType: (['security', 'staffing'] as string[]).includes(rawPostType)
        ? (rawPostType as FilterState['postType'])
        : 'all',
      selectedHallIds: validHallIds,
    }
  }, [searchParams, boardData])

  function updateFilter(patch: Partial<FilterState>) {
    const next: FilterState = { ...filterState, ...patch }
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next.status === 'all') p.delete('status')
        else p.set('status', next.status)
        if (next.postType === 'all') p.delete('postType')
        else p.set('postType', next.postType)
        if (next.selectedHallIds.length === 0) p.delete('halls')
        else p.set('halls', next.selectedHallIds.join(','))
        return p
      },
      { replace: true },
    )
  }

  // Derive the selected shift from live boardData so the drawer always reflects cache
  const selectedShiftContext = useMemo(() => {
    if (!selectedShiftId || !boardData) return null
    for (const hall of boardData.halls) {
      for (const post of hall.posts) {
        const shift = post.shifts.find((s) => s.id === selectedShiftId)
        if (shift) return { shift, post, hallName: hall.name }
      }
    }
    return null
  }, [selectedShiftId, boardData])

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
        onSelect={(date) =>
          setSearchParams(
            (prev) => {
              const p = new URLSearchParams(prev)
              p.set('date', date)
              return p
            },
            { replace: true },
          )
        }
      />

      {/* ── Filter bar ── */}
      <FilterBar halls={boardData.halls} filterState={filterState} onUpdate={updateFilter} />

      {/* ── Body ── */}
      <BoardDndProvider
        onAssign={(workerId, shiftId, workerName, workerType) => {
          createAssignment({ showId: showId ?? '', shiftId, workerId, workerName, workerType })
        }}
      >
        <div className={styles.body}>
          <BoardCanvas
            halls={boardData.halls}
            selectedDate={selectedDate}
            selectedShiftId={selectedShiftId}
            onShiftClick={setSelectedShiftId}
            filterState={filterState}
          />
          <WorkerPanel showId={showId ?? ''} date={selectedDate} halls={boardData.halls} />
        </div>
        <BoardOverlay showId={showId ?? ''} />
        {selectedShiftContext && (
          <ShiftDrawer
            shift={selectedShiftContext.shift}
            post={selectedShiftContext.post}
            hallName={selectedShiftContext.hallName}
            showId={showId ?? ''}
            halls={boardData.halls}
            onClose={() => setSelectedShiftId(null)}
          />
        )}
      </BoardDndProvider>

      {/* ── Status bar ── */}
      <StatusBar
        showId={showId ?? ''}
        halls={boardData.halls}
        selectedDate={selectedDate}
        onOpenOtPanel={() => setShowOtPanel(true)}
      />

      {/* ── OT Flags panel ── */}
      {showOtPanel && (
        <OtFlagsPanel showId={showId ?? ''} onClose={() => setShowOtPanel(false)} />
      )}
    </div>
  )
}
