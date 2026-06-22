import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useShowDetail } from '../features/shows/hooks/useShowDetail'
import type { HallWithPosts, PostWithShifts } from '../features/shows/hooks/useShowDetail'
import ShowModal from '../features/shows/components/ShowModal'
import ShowCalendarView from '../features/shows/components/ShowCalendarView'
import SplitPreview from '../features/schedule/components/SplitPreview'
import SplitConfirmModal from '../features/schedule/components/SplitConfirmModal'
import BulkSplitReviewPanel from '../features/schedule/components/BulkSplitReviewPanel'
import Loader from '../components/Loader'
import type { Post } from '../types/index'
import '../features/shows/components/Show.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS = { draft: 'Draft', active: 'Active', closed: 'Closed' } as const
const STATUS_CLASSES = {
  draft: 'show-detail-status-pill--draft',
  active: 'show-detail-status-pill--active',
  closed: 'show-detail-status-pill--closed',
} as const

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

type HallPostGroup = { hall: HallWithPosts; posts: PostWithShifts[] }
type DateGroup = { date: string; hallGroups: HallPostGroup[] }

function groupByDateThenHall(halls: HallWithPosts[]): DateGroup[] {
  const dateMap = new Map<string, Map<string, HallPostGroup>>()
  for (const hall of halls) {
    for (const post of hall.posts) {
      if (!dateMap.has(post.date)) dateMap.set(post.date, new Map())
      const hallMap = dateMap.get(post.date)!
      if (!hallMap.has(hall.id)) hallMap.set(hall.id, { hall, posts: [] })
      hallMap.get(hall.id)!.posts.push(post)
    }
  }
  return [...dateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, hallMap]) => ({
      date,
      hallGroups: [...hallMap.values()].sort((a, b) =>
        a.hall.name.localeCompare(b.hall.name),
      ),
    }))
}

// ─── ReimportModal ───────────────────────────────────────────────────────────

const ReimportModal = ({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) => {
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Escape') onClose() }
  return (
    <div className="modal-overlay" role="dialog" aria-modal aria-labelledby="reimport-title" onKeyDown={handleKey}>
      <div className="modal-panel" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2 id="reimport-title">Re-import buy order?</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5 }}>
            Existing posts on this show will remain. During import you can choose to skip or
            overwrite any posts that conflict with the new file.
          </p>
          <div className="wf-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
            <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn--primary" onClick={onConfirm}>Continue to import</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── PostRow ─────────────────────────────────────────────────────────────────

interface PostRowProps {
  post: PostWithShifts
  onSplitConfirm: (post: Post) => void
}

const PostRow = ({ post, onSplitConfirm }: PostRowProps) => (
  <div className={`sd-post-row${post.shifts.length === 0 ? ' sd-post-row--unsplit' : ''}`}>
    <span className="sd-post-name">{post.name}</span>
    <span className={`sd-type-badge sd-type-badge--${post.post_type}`}>
      {post.post_type === 'security' ? 'Security' : 'Staffing'}
    </span>
    <span className="sd-post-time">
      {post.start_time}–{post.end_time}
    </span>
    <span className="sd-post-meta">
      {post.headcount_required} {post.headcount_required === 1 ? 'person' : 'people'}
    </span>
    <span className="sd-post-meta sd-post-shifts">
      {post.shifts.length > 0
        ? `${post.shifts.length} ${post.shifts.length === 1 ? 'shift' : 'shifts'}`
        : '—'}
    </span>
    {post.shifts.length === 0 && (
      <div className="sd-split-preview-bar">
        <SplitPreview post={post} onConfirm={onSplitConfirm} />
      </div>
    )}
  </div>
)

// ─── HallGroup ────────────────────────────────────────────────────────────────

interface HallGroupProps extends HallPostGroup {
  onSplitConfirm: (post: Post) => void
}

const HallGroup = ({ hall, posts, onSplitConfirm }: HallGroupProps) => (
  <div className="sd-hall-group">
    <div className="sd-hall-label">
      <span className="sd-hall-name">{hall.name}</span>
      {hall.floor_level && <span className="sd-hall-floor">{hall.floor_level}</span>}
    </div>
    <div className="sd-post-list">
      {posts.map((post) => (
        <PostRow key={post.id} post={post} onSplitConfirm={onSplitConfirm} />
      ))}
    </div>
  </div>
)

// ─── DateSection ──────────────────────────────────────────────────────────────

interface DateSectionProps extends DateGroup {
  onSplitConfirm: (post: Post) => void
}

const DateSection = ({ date, hallGroups, onSplitConfirm }: DateSectionProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const postCount = hallGroups.reduce((acc, hg) => acc + hg.posts.length, 0)
  const shiftCount = hallGroups.reduce(
    (acc, hg) => acc + hg.posts.reduce((a, p) => a + p.shifts.length, 0),
    0,
  )

  return (
    <section className="sd-date-section">
      <button
        className="sd-date-header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className="sd-hall-chevron" aria-hidden>{collapsed ? '▶' : '▼'}</span>
        <span className="sd-date-title">{formatDate(date)}</span>
        <span className="sd-hall-counts">
          {postCount} {postCount === 1 ? 'post' : 'posts'}
          {' · '}
          {shiftCount} {shiftCount === 1 ? 'shift' : 'shifts'}
        </span>
      </button>

      {!collapsed && (
        <div className="sd-date-body">
          {hallGroups.map(({ hall, posts }) => (
            <HallGroup key={hall.id} hall={hall} posts={posts} onSplitConfirm={onSplitConfirm} />
          ))}
        </div>
      )}
    </section>
  )
}

// ─── ShowDetailPage ───────────────────────────────────────────────────────────

type View = 'overview' | 'calendar'

const ShowDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: show, isLoading, isError } = useShowDetail(id ?? '')
  const [editModal, setEditModal] = useState(false)
  const [reimportModal, setReimportModal] = useState(false)
  const [view, setView] = useState<View>('overview')
  const [splitPost, setSplitPost] = useState<Post | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const unsplitEntries = useMemo(
    () =>
      (show?.halls ?? []).flatMap((h) =>
        h.posts.filter((p) => p.shifts.length === 0).map((p) => ({ post: p, hallName: h.name })),
      ),
    [show],
  )

  if (isLoading) return <Loader />

  if (isError || !show)
    return (
      <div className="sd-container">
        <p style={{ color: 'var(--danger-500)' }}>Show not found.</p>
      </div>
    )

  const hasPosts = show.halls.some((h) => h.posts.length > 0)
  const totalShifts = show.halls.reduce(
    (acc, h) => acc + h.posts.reduce((a, p) => a + p.shifts.length, 0),
    0,
  )

  const handleImportClick = () => {
    if (hasPosts) {
      setReimportModal(true)
    } else {
      navigate(`/shows/${id}/import`)
    }
  }

  return (
    <div className="sd-container">
      {/* ── Show header ── */}
      <div className="show-detail-header">
        <button className="btn btn--ghost show-detail-back" onClick={() => navigate('/shows')}>
          ← Shows
        </button>

        <div className="show-detail-title-row">
          <div>
            <h1 className="show-detail-name">{show.name}</h1>
            <div className="show-detail-meta">
              <span>{show.client_name}</span>
              <span className="show-detail-sep">·</span>
              <span>{show.venue}</span>
              <span className="show-detail-sep">·</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {show.start_date}
                {show.start_date !== show.end_date ? ` – ${show.end_date}` : ''}
              </span>
            </div>
          </div>

          <div className="show-detail-actions">
            <span className={`show-detail-status-pill ${STATUS_CLASSES[show.status]}`}>
              {STATUS_LABELS[show.status]}
            </span>
            <button
              className="btn btn--ghost"
              disabled={!totalShifts}
              title={!totalShifts ? 'Available after shifts are created (Phase 3)' : undefined}
              onClick={() => navigate(`/schedule/${id}`)}
            >
              View schedule
            </button>
            <button className="btn btn--ghost" onClick={() => setEditModal(true)}>
              Edit
            </button>
            <button className="btn btn--primary" onClick={handleImportClick}>
              {hasPosts ? 'Re-import' : 'Import buy order'}
            </button>
          </div>
        </div>
      </div>

      {/* ── View toggle ── */}
      <div className="show-view-tabs">
        <button
          className={`show-view-tab ${view === 'overview' ? 'show-view-tab--active' : ''}`}
          onClick={() => setView('overview')}
        >
          Overview
        </button>
        <button
          className={`show-view-tab ${view === 'calendar' ? 'show-view-tab--active' : ''}`}
          onClick={() => setView('calendar')}
        >
          Calendar
        </button>
      </div>

      {/* ── Overview ── */}
      {view === 'overview' && (
        <OverviewPanel
          hasPosts={hasPosts}
          halls={show.halls}
          onImport={() => navigate(`/shows/${id}/import`)}
          onSplitConfirm={setSplitPost}
          onBulkOpen={() => setBulkOpen(true)}
        />
      )}

      {/* ── Calendar ── */}
      {view === 'calendar' && <ShowCalendarView show={show} />}

      {/* ── Modals ── */}
      {editModal && (
        <ShowModal mode="edit" show={show} onClose={() => setEditModal(false)} />
      )}

      {reimportModal && (
        <ReimportModal
          onConfirm={() => { setReimportModal(false); navigate(`/shows/${id}/import`) }}
          onClose={() => setReimportModal(false)}
        />
      )}

      {/* SplitConfirmModal (per-post from overview) — commitShifts wired in 3.7 */}
      {splitPost && (
        <SplitConfirmModal
          post={splitPost}
          onCommit={(_post, _strategy) => setSplitPost(null)}
          onClose={() => setSplitPost(null)}
        />
      )}

      {/* BulkSplitReviewPanel — slide-over drawer — commitShifts wired in 3.7 */}
      {bulkOpen && (
        <BulkSplitReviewPanel
          entries={unsplitEntries}
          onCommit={(_commits) => setBulkOpen(false)}
          onClose={() => setBulkOpen(false)}
        />
      )}
    </div>
  )
}

// ─── OverviewPanel ────────────────────────────────────────────────────────────

interface OverviewPanelProps {
  hasPosts: boolean
  halls: HallWithPosts[]
  onImport: () => void
  onSplitConfirm: (post: Post) => void
  onBulkOpen: () => void
}

const OverviewPanel = ({ hasPosts, halls, onImport, onSplitConfirm, onBulkOpen }: OverviewPanelProps) => {
  const dateGroups = useMemo(
    () => groupByDateThenHall(halls.filter((h) => h.posts.length > 0)),
    [halls],
  )

  const unsplitCount = useMemo(
    () => halls.reduce((acc, h) => acc + h.posts.filter((p) => p.shifts.length === 0).length, 0),
    [halls],
  )

  if (!hasPosts) {
    return (
      <div className="sd-overview">
        <div className="show-detail-empty">
          <p className="show-detail-empty-headline">No posts imported yet</p>
          <p className="show-detail-empty-sub">
            Import a buy order to create posts and shifts for this show.
          </p>
          <button className="btn btn--primary" onClick={onImport}>
            Import buy order
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sd-overview">
      {unsplitCount > 0 && (
        <div className="sd-split-banner">
          <span className="sd-split-banner-text">
            {unsplitCount} {unsplitCount === 1 ? 'post needs' : 'posts need'} shifts
          </span>
          <button className="btn btn--primary" onClick={onBulkOpen}>
            Split all posts
          </button>
        </div>
      )}
      <div className="sd-halls">
        {dateGroups.map(({ date, hallGroups }) => (
          <DateSection key={date} date={date} hallGroups={hallGroups} onSplitConfirm={onSplitConfirm} />
        ))}
      </div>
    </div>
  )
}

export default ShowDetailPage
