import React from 'react'
import { Link } from 'react-router-dom'
import { useShows } from '../hooks/useShows'
import ShowCard from './ShowCard'
import Loader from '../../../components/Loader'
import './Show.css'

const ShowDashboard = () => {
  const { data: shows, isLoading, isError } = useShows()

  if (isLoading) return <Loader />

  if (isError)
    return (
      <div className="sd-container">
        <p>Unable to load shows. Make sure the backend is running.</p>
      </div>
    )

  return (
    <div className="sd-container">
      <div className="sd-title">
        <h1>Upcoming Shows</h1>
      </div>
      <div className="sd-show-container">
        {shows?.map((show) => (
          <Link
            key={show.id}
            to={`/shows/${show.id}`}
            state={{ selectedShow: show }}
          >
            <ShowCard show={show} />
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ShowDashboard
