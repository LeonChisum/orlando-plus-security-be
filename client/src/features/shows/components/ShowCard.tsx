import type { Show } from '../../../types/index'

const STATUS_LABELS: Record<Show['status'], string> = {
  draft: 'Draft',
  active: 'Active',
  closed: 'Closed',
}

const STATUS_STYLES: Record<Show['status'], React.CSSProperties> = {
  draft: { background: 'var(--surface-sunken)', color: 'var(--text-muted)', border: '1px solid var(--border)' },
  active: { background: 'var(--ok-bg)', color: 'var(--ok-500)' },
  closed: { background: 'var(--surface-sunken)', color: 'var(--text-faint)', border: '1px solid var(--border)' },
}

const pillBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.2rem 0.65rem',
  borderRadius: 'var(--radius-pill)',
  fontSize: '0.72rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

interface Props {
  show: Show
  postCount?: number
}

const ShowCard = ({ show, postCount }: Props) => (
  <div className="show-card-container">
    <div className="show-card-title">
      <h3>{show.name}</h3>
    </div>
    <div className="show-card-details">
      <div className="show-card-detail-row">
        <i className="fas fa-map-marker-alt" />
        {show.venue}
      </div>
      <div className="show-card-detail-row">
        <i className="fas fa-building" />
        {show.client_name}
      </div>
      <div className="show-card-detail-row">
        <i className="far fa-calendar" />
        {show.start_date} – {show.end_date}
      </div>
    </div>
    <div className="show-card-meta">
      {postCount !== undefined && (
        <span className="show-card-post-count">
          {postCount} {postCount === 1 ? 'post' : 'posts'}
        </span>
      )}
      <span style={{ ...pillBase, ...STATUS_STYLES[show.status] }}>
        {STATUS_LABELS[show.status]}
      </span>
    </div>
  </div>
)

export default ShowCard
