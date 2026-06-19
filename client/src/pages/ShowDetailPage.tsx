import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useShowDetail } from '../features/shows/hooks/useShowDetail'
import type { HallWithPosts, PostWithShifts } from '../features/shows/hooks/useShowDetail'
import ShowModal from '../features/shows/components/ShowModal'
import ShowCalendarView from '../features/shows/components/ShowCalendarView'
import Loader from '../components/Loader'
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

function groupByDate(posts: PostWithShifts[]): [string, PostWithShifts[]][] {
  const map = new Map<string, PostWithShifts[]>()
  for (const post of posts) {
    const bucket = map.get(post.date) ?? []
    bucket.push(post)
    map.set(post.date, bucket)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
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

const PostRow = ({ post }: { post: PostWithShifts }) => (
  <div className="sd-post-row">
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
      {post.shifts.length} {post.shifts.length === 1 ? 'shift' : 'shifts'}
    </span>
  </div>
)

// ─── HallSection ─────────────────────────────────────────────────────────────

const HallSection = ({ hall }: { hall: HallWithPosts }) => {
  const [collapsed, setCollapsed] = useState(false)
  const dateGroups = useMemo(() => groupByDate(hall.posts), [hall.posts])
  const postCount = hall.posts.length
  const shiftCount = hall.posts.reduce((acc, p) => acc + p.shifts.length, 0)

  return (
    <section className="sd-hall-section">
      <button
        className="sd-hall-header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className="sd-hall-chevron" aria-hidden>{collapsed ? '▶' : '▼'}</span>
        <span className="sd-hall-name">{hall.name}</span>
        {hall.floor_level && <span className="sd-hall-floor">{hall.floor_level}</span>}
        <span className="sd-hall-counts">
          {postCount} {postCount === 1 ? 'post' : 'posts'}
          {' · '}
          {shiftCount} {shiftCount === 1 ? 'shift' : 'shifts'}
        </span>
      </button>

      {!collapsed && (
        <div className="sd-hall-body">
          {dateGroups.length === 0 ? (
            <p className="sd-hall-empty">No posts in this hall.</p>
          ) : (
            dateGroups.map(([date, posts]) => (
              <div key={date} className="sd-date-group">
                <div className="sd-date-label">{formatDate(date)}</div>
                <div className="sd-post-list">
                  {posts.map((post) => (
                    <PostRow key={post.id} post={post} />
                  ))}
                </div>
              </div>
            ))
          )}
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
        <div className="sd-overview">
          {!hasPosts ? (
            <div className="show-detail-empty">
              <p className="show-detail-empty-headline">No posts imported yet</p>
              <p className="show-detail-empty-sub">
                Import a buy order to create posts and shifts for this show.
              </p>
              <button className="btn btn--primary" onClick={() => navigate(`/shows/${id}/import`)}>
                Import buy order
              </button>
            </div>
          ) : (
            <div className="sd-halls">
              {show.halls
                .filter((h) => h.posts.length > 0)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((hall) => (
                  <HallSection key={hall.id} hall={hall} />
                ))}
            </div>
          )}
        </div>
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
    </div>
  )
}

export default ShowDetailPage
