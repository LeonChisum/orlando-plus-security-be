import { useState, useMemo } from 'react'
import { useShowCalendarData } from '../hooks/useShowCalendarData'
import type { DayData, CalPost, CalShift } from '../hooks/useShowCalendarData'
import type { Show } from '../../../types/index'
import './ShowCalendarView.css'

// ─── Constants ──────────────────────────────────────────────────────────────

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface CalCell {
  date: string
  day: number
  isCurrentMonth: boolean
}

function buildMonthCells(year: number, month: number): CalCell[] {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: CalCell[] = []

  // Prev-month trailing days
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const prevDaysInMonth = new Date(prevYear, prevMonth + 1, 0).getDate()
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = prevDaysInMonth - i
    cells.push({
      date: isoDate(prevYear, prevMonth, d),
      day: d,
      isCurrentMonth: false,
    })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: isoDate(year, month, d), day: d, isCurrentMonth: true })
  }

  // Next-month leading days
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year
  let nd = 1
  while (cells.length % 7 !== 0) {
    cells.push({ date: isoDate(nextYear, nextMonth, nd), day: nd, isCurrentMonth: false })
    nd++
  }

  return cells
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDayHeader(date: string): string {
  const d = new Date(date + 'T12:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).toUpperCase()
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

function getWorkerLabel(shift: CalShift): string {
  const active = (shift.assignments ?? []).filter(
    (a) => a.status !== 'declined' && a.status !== 'no_show',
  )
  if (active.length === 0) return 'Open'
  if (active.length === 1) {
    const w = active[0].workers
    if (!w) return 'Open'
    return `${w.first_name} ${w.last_name[0]}.`
  }
  return `Team (${active.length})`
}

// ─── Cell gradient ────────────────────────────────────────────────────────────

function getCellGradient(dayData: DayData | undefined, isShowDay: boolean): string {
  if (!isShowDay) return 'none'

  if (!dayData || dayData.totalShifts === 0) {
    // Show day, no shifts yet — faint gold breath
    return 'radial-gradient(ellipse 100% 45% at 50% 100%, rgba(212,175,55,0.12) 0%, transparent 100%)'
  }

  const { fillPct } = dayData

  if (fillPct === 100) {
    return 'radial-gradient(ellipse 110% 85% at 50% 100%, rgba(46,158,91,0.45) 0%, rgba(46,158,91,0.14) 55%, transparent 100%)'
  }
  if (fillPct > 0) {
    const h = Math.round(35 + fillPct * 0.45) // 35 → 80% height
    return `radial-gradient(ellipse 110% ${h}% at 50% 100%, rgba(224,138,0,0.48) 0%, rgba(224,138,0,0.12) 55%, transparent 100%)`
  }
  return 'radial-gradient(ellipse 110% 40% at 50% 100%, rgba(210,59,78,0.42) 0%, rgba(210,59,78,0.08) 60%, transparent 100%)'
}

function getStripColor(fillPct: number): string {
  if (fillPct === 100) return 'var(--ok-500)'
  if (fillPct > 0) return 'var(--warn-500)'
  return 'var(--danger-500)'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface DayDetailProps {
  date: string
  dayData: DayData | undefined
  showName: string
  onClose: () => void
}

const DayDetail = ({ date, dayData, showName, onClose }: DayDetailProps) => {
  const posts = dayData?.posts ?? []
  const allShifts: Array<{ post: CalPost; shift: CalShift }> = posts.flatMap((p) =>
    (p.shifts ?? []).map((s) => ({ post: p, shift: s })),
  )

  return (
    <>
      <div className="cal-sidebar-header">
        <div>
          <p className="cal-sidebar-date">{formatDayHeader(date)}</p>
          <p className="cal-sidebar-show">★ SHOW DAY &nbsp;·&nbsp; {showName.toUpperCase()}</p>
        </div>
        <button className="cal-close-btn" onClick={onClose} aria-label="Close panel">
          ×
        </button>
      </div>

      <div className="cal-sidebar-section-label">SHIFTS / POSTS</div>

      <div className="cal-shifts-list">
        {allShifts.length === 0 && (
          <div className="cal-shifts-empty">
            No shifts set up for this day yet.
          </div>
        )}
        {allShifts.map(({ post, shift }) => {
          const filled = shift.status === 'filled'
          const worker = getWorkerLabel(shift)
          const crossesMidnight = shift.end_time <= shift.start_time
          const timeLabel = `${formatTime(shift.start_time)} – ${formatTime(shift.end_time)}${crossesMidnight ? ' (next day)' : ''}`

          return (
            <div key={shift.id} className={`cal-shift-row ${filled ? 'cal-shift-row--filled' : 'cal-shift-row--open'}`}>
              <span className={`cal-shift-dot ${filled ? 'cal-shift-dot--filled' : 'cal-shift-dot--open'}`} />
              <div className="cal-shift-body">
                <span className="cal-shift-name">{post.name.toUpperCase()}</span>
                <span className="cal-shift-time">{timeLabel}</span>
              </div>
              <div className="cal-shift-right">
                <span className={`cal-shift-status ${filled ? 'cal-shift-status--filled' : 'cal-shift-status--open'}`}>
                  {filled ? 'FILLED' : 'NOT FILLED'}
                </span>
                <span className="cal-shift-worker">{worker}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="cal-sidebar-summary">
        <div className="cal-summary-stat">
          <span className="cal-summary-num cal-summary-num--filled">
            {dayData?.filledShifts ?? 0}
          </span>
          <span className="cal-summary-label">FILLED</span>
        </div>
        <div className="cal-summary-divider" />
        <div className="cal-summary-stat">
          <span className="cal-summary-num cal-summary-num--open">
            {dayData?.openShifts ?? 0}
          </span>
          <span className="cal-summary-label">NOT FILLED</span>
        </div>
        <div className="cal-summary-divider" />
        <div className="cal-summary-stat">
          <span className="cal-summary-num">
            {dayData?.totalShifts ?? 0}
          </span>
          <span className="cal-summary-label">TOTAL</span>
        </div>
      </div>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  show: Show
}

const ShowCalendarView = ({ show }: Props) => {
  const { data: dayMap = {}, isLoading } = useShowCalendarData(show.id)

  const startParsed = new Date(show.start_date + 'T12:00:00')
  const [viewYear, setViewYear] = useState(startParsed.getFullYear())
  const [viewMonth, setViewMonth] = useState(startParsed.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const cells = useMemo(
    () => buildMonthCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  )

  const isShowDay = (date: string) =>
    date >= show.start_date && date <= show.end_date

  const navPrev = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }

  const navNext = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  const navToday = () => {
    const now = new Date()
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    if (isShowDay(today)) setSelectedDate(today)
  }

  return (
    <div className="cal-root">
      {/* ── Grid panel ── */}
      <div className="cal-grid-panel">

        {/* Header */}
        <div className="cal-header">
          <div className="cal-legend">
            <span className="cal-legend-item">
              <span className="cal-legend-swatch cal-legend-swatch--filled" />
              Filled
            </span>
            <span className="cal-legend-item">
              <span className="cal-legend-swatch cal-legend-swatch--partial" />
              Partial
            </span>
            <span className="cal-legend-item">
              <span className="cal-legend-swatch cal-legend-swatch--open" />
              Not filled
            </span>
            <span className="cal-legend-item">
              <span className="cal-legend-swatch cal-legend-swatch--pending" />
              Pending setup
            </span>
          </div>
          <div className="cal-nav">
            <button className="cal-nav-btn cal-nav-btn--today" onClick={navToday}>
              TODAY
            </button>
            <button className="cal-nav-btn" onClick={navPrev} aria-label="Previous month">
              ‹
            </button>
            <button className="cal-nav-btn" onClick={navNext} aria-label="Next month">
              ›
            </button>
          </div>
        </div>

        {/* Month label */}
        <div className="cal-month-label">
          {MONTHS[viewMonth].toUpperCase()} {viewYear}
        </div>

        {/* Weekday row */}
        <div className="cal-weekdays">
          {WEEKDAYS.map((d) => (
            <div key={d} className="cal-weekday">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        {isLoading ? (
          <div className="cal-loading">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="cal-day-skeleton" />
            ))}
          </div>
        ) : (
          <div className="cal-cells">
            {cells.map((cell) => {
              const showDay = isShowDay(cell.date)
              const isToday = cell.date === today
              const isSelected = cell.date === selectedDate
              const dayData = dayMap[cell.date]

              const gradient = getCellGradient(dayData, showDay)
              const hasShifts = dayData && dayData.totalShifts > 0

              const cls = [
                'cal-day',
                !cell.isCurrentMonth && 'cal-day--out-of-month',
                showDay && 'cal-day--show',
                isToday && 'cal-day--today',
                isSelected && 'cal-day--selected',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <div
                  key={cell.date}
                  className={cls}
                  style={{ background: gradient }}
                  onClick={() => showDay && setSelectedDate(isSelected ? null : cell.date)}
                  role={showDay ? 'button' : undefined}
                  aria-pressed={showDay ? isSelected : undefined}
                  aria-label={showDay ? `${cell.date}${isSelected ? ', selected' : ''}` : undefined}
                >
                  <span className={`cal-date-num ${isToday ? 'cal-date-num--today' : ''}`}>
                    {cell.day}
                  </span>

                  {showDay && (
                    <span className="cal-show-tag">SHOW DAY</span>
                  )}

                  {/* Fill strip at bottom */}
                  {showDay && hasShifts && (
                    <div
                      className="cal-fill-strip"
                      style={{
                        width: `${dayData.fillPct}%`,
                        background: getStripColor(dayData.fillPct),
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <div className={`cal-sidebar ${selectedDate ? 'cal-sidebar--open' : ''}`}>
        {selectedDate ? (
          <DayDetail
            date={selectedDate}
            dayData={dayMap[selectedDate]}
            showName={show.name}
            onClose={() => setSelectedDate(null)}
          />
        ) : (
          <div className="cal-sidebar-empty">
            <span className="cal-sidebar-empty-icon">📅</span>
            <p>Select a show day<br />to view shifts</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShowCalendarView
