import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useShows } from '../hooks/useShows'
import ShowCard from './ShowCard'
import ShowModal from './ShowModal'
import Loader from '../../../components/Loader'
import './Show.css'

const ShowDashboard = () => {
  const { data: shows, isLoading, isError } = useShows()
  const [showModal, setShowModal] = useState(false)

  if (isLoading) return <Loader />

  if (isError)
    return (
      <div className="sd-container">
        <p style={{ color: 'var(--danger-500)' }}>
          Unable to load shows. Make sure the backend is running.
        </p>
      </div>
    )

  return (
    <div className="sd-container">
      <div className="sd-header">
        <div className="sd-title">
          <h1>Shows</h1>
        </div>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}>
          + New show
        </button>
      </div>

      <div className="sd-show-container">
        {shows && shows.length === 0 && (
          <div className="sd-empty">
            <p className="sd-empty-headline">No shows yet</p>
            <p className="sd-empty-sub">Create a show to get started, then import a buy order.</p>
            <button className="btn btn--primary" onClick={() => setShowModal(true)}>
              + New show
            </button>
          </div>
        )}
        {shows?.map((show) => (
          <Link key={show.id} to={`/shows/${show.id}`}>
            <ShowCard show={show} />
          </Link>
        ))}
      </div>

      {showModal && (
        <ShowModal mode="add" onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

export default ShowDashboard
