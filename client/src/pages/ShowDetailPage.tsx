import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useShow } from '../features/shows/hooks/useShows'
import ShowModal from '../features/shows/components/ShowModal'
import ShowCalendarView from '../features/shows/components/ShowCalendarView'
import Loader from '../components/Loader'
import '../features/shows/components/Show.css'

const STATUS_LABELS = { draft: 'Draft', active: 'Active', closed: 'Closed' } as const
const STATUS_CLASSES = {
  draft: 'show-detail-status-pill--draft',
  active: 'show-detail-status-pill--active',
  closed: 'show-detail-status-pill--closed',
} as const

type View = 'calendar' | 'overview'

const ShowDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: show, isLoading, isError } = useShow(id ?? '')
  const [editModal, setEditModal] = useState(false)
  const [view, setView] = useState<View>('calendar')

  if (isLoading) return <Loader />

  if (isError || !show)
    return (
      <div className="sd-container">
        <p style={{ color: 'var(--danger-500)' }}>Show not found.</p>
      </div>
    )

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
                {show.start_date} – {show.end_date}
              </span>
            </div>
          </div>
          <div className="show-detail-actions">
            <span className={`show-detail-status-pill ${STATUS_CLASSES[show.status]}`}>
              {STATUS_LABELS[show.status]}
            </span>
            <button className="btn btn--ghost" onClick={() => setEditModal(true)}>
              Edit
            </button>
            <button className="btn btn--primary" disabled>
              Import buy order
            </button>
          </div>
        </div>
      </div>

      {/* ── View toggle ── */}
      <div className="show-view-tabs">
        <button
          className={`show-view-tab ${view === 'calendar' ? 'show-view-tab--active' : ''}`}
          onClick={() => setView('calendar')}
        >
          Calendar
        </button>
        <button
          className={`show-view-tab ${view === 'overview' ? 'show-view-tab--active' : ''}`}
          onClick={() => setView('overview')}
        >
          Overview
        </button>
      </div>

      {/* ── Content ── */}
      {view === 'calendar' && <ShowCalendarView show={show} />}

      {view === 'overview' && (
        <div className="show-detail-empty">
          <p className="show-detail-empty-headline">No posts imported yet</p>
          <p className="show-detail-empty-sub">
            Import a buy order to create posts and shifts for this show.
          </p>
          <button className="btn btn--primary" disabled>
            Import buy order
          </button>
        </div>
      )}

      {editModal && (
        <ShowModal mode="edit" show={show} onClose={() => setEditModal(false)} />
      )}
    </div>
  )
}

export default ShowDetailPage
