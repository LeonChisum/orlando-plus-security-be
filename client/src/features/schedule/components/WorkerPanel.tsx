import { useMemo, useState } from 'react'
import { useWorkerPanel } from '../hooks/useWorkerPanel'
import type { PanelWorker, AvailStatus } from '../hooks/useWorkerPanel'
import type { BoardHall } from '../hooks/useBoardData'
import styles from './WorkerPanel.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'available' | 'guards' | 'staffers'

interface WorkerGroup {
  label: string
  workers: PanelWorker[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortTime(t: string): string {
  return t.slice(0, 5).replace(':', '')
}

function getLicenseNum(worker: PanelWorker): string | null {
  if (worker.worker_type === 'guard') {
    return worker.d_license?.number ?? worker.g_license?.number ?? null
  }
  return null
}

// ─── AvailBadge ──────────────────────────────────────────────────────────────

function AvailBadge({ status, window: window_ }: { status: AvailStatus; window: string | null }) {
  if (status === 'available') {
    return (
      <span className={`${styles.availBadge} ${styles['availBadge--available']}`}>
        ✓{window_ ? ` ${window_}` : ''}
      </span>
    )
  }
  return (
    <span className={`${styles.availBadge} ${styles['availBadge--no_response']}`}>
      ⚠ No resp.
    </span>
  )
}

// ─── WorkerCard ──────────────────────────────────────────────────────────────

function WorkerCard({ worker }: { worker: PanelWorker }) {
  const license = getLicenseNum(worker)

  return (
    <div className={styles.workerCard} title={`${worker.first_name} ${worker.last_name}`}>
      <span
        className={`${styles.typeBadge} ${styles[`typeBadge--${worker.worker_type}`]}`}
        aria-label={worker.worker_type}
      >
        {worker.worker_type === 'guard' ? 'G' : 'S'}
      </span>

      <div className={styles.cardBody}>
        <div className={styles.nameRow}>
          <span className={styles.workerName}>
            {worker.first_name} {worker.last_name}
          </span>
          <AvailBadge status={worker.availStatus} window={worker.availWindow} />
        </div>

        {license && (
          <span className={styles.licenseNum}>#{license}</span>
        )}

        {worker.dateAssignments.length > 0 && (
          <div className={styles.assignments}>
            {worker.dateAssignments.map(a => (
              <span key={a.shift_id} className={styles.assignPill}>
                {formatShortTime(a.start_time)}–{formatShortTime(a.end_time)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── WorkerGroup ─────────────────────────────────────────────────────────────

function WorkerGroupSection({
  group,
  collapsed,
  onToggle,
}: {
  group: WorkerGroup
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <div className={styles.group}>
      <button
        className={styles.groupHeader}
        onClick={onToggle}
        aria-expanded={!collapsed}
      >
        <span
          className={`${styles.groupChevron} ${collapsed ? styles['groupChevron--collapsed'] : ''}`}
        >
          ▾
        </span>
        <span className={styles.groupLabel}>{group.label}</span>
        <span className={styles.groupCount}>{group.workers.length}</span>
      </button>

      {!collapsed && group.workers.map(w => (
        <WorkerCard key={w.id} worker={w} />
      ))}
    </div>
  )
}

// ─── WorkerPanel ─────────────────────────────────────────────────────────────

export interface WorkerPanelProps {
  showId: string
  date: string
  halls: BoardHall[]
}

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'guards', label: 'Guards' },
  { id: 'staffers', label: 'Staffers' },
]

export default function WorkerPanel({ showId, date, halls }: WorkerPanelProps) {
  const { panelWorkers, isLoading, isError } = useWorkerPanel(showId, date, halls)

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return panelWorkers.filter(w => {
      if (q) {
        const name = `${w.first_name} ${w.last_name}`.toLowerCase()
        if (!name.includes(q)) return false
      }
      if (activeFilter === 'available') return w.availStatus === 'available'
      if (activeFilter === 'guards') return w.worker_type === 'guard'
      if (activeFilter === 'staffers') return w.worker_type === 'staffer'
      return true
    })
  }, [panelWorkers, search, activeFilter])

  const groups = useMemo<WorkerGroup[]>(() => {
    const supervisors = filtered.filter(w => w.is_supervisor)
    const guards = filtered.filter(w => w.worker_type === 'guard' && !w.is_supervisor)
    const staffers = filtered.filter(w => w.worker_type === 'staffer')
    return [
      { label: 'Supervisors', workers: supervisors },
      { label: 'Guards', workers: guards },
      { label: 'Staffers', workers: staffers },
    ].filter(g => g.workers.length > 0)
  }, [filtered])

  function toggleGroup(label: string) {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside className={styles.panel}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <span className={styles.title}>Workers</span>
        {!isLoading && !isError && (
          <span className={styles.workerCount}>{filtered.length}</span>
        )}
      </div>

      {/* ── Search ── */}
      <div className={styles.searchWrap}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search workers…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search workers"
        />
      </div>

      {/* ── Filter tabs ── */}
      <nav className={styles.filterTabs} aria-label="Worker filter">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.filterTab} ${activeFilter === tab.id ? styles['filterTab--active'] : ''}`}
            onClick={() => setActiveFilter(tab.id)}
            aria-pressed={activeFilter === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      {isLoading && (
        <div className={styles.stateBox}>Loading workers…</div>
      )}

      {isError && (
        <div className={styles.stateBox} style={{ color: 'var(--danger-500)' }}>
          Failed to load workers.
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className={styles.stateBox}>
          {search ? 'No workers match your search.' : 'No workers for this filter.'}
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className={styles.scroll} role="list" aria-label="Worker list">
          {groups.map(group => (
            <WorkerGroupSection
              key={group.label}
              group={group}
              collapsed={!!collapsed[group.label]}
              onToggle={() => toggleGroup(group.label)}
            />
          ))}
        </div>
      )}
    </aside>
  )
}
