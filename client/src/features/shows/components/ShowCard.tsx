import React from 'react'
import type { Show } from '../../../types/index'

interface Props {
  show: Show
}

const ShowCard = ({ show }: Props) => (
  <div className="show-card-container">
    <div className="show-card-title">
      <h3>{show.name}</h3>
    </div>
    <div className="show-card-details">
      <h4>Location</h4>
      <p>{show.location}</p>
    </div>
    <div className="show-card-details">
      <h4>Move-In</h4>
      <p>{show.moveIn}</p>
    </div>
    <div className="show-card-details">
      <h4>Show Day(s)</h4>
      <p>
        {show.showDayStart} – {show.showDayEnd}
      </p>
    </div>
    <div className="show-card-details">
      <h4>Move-Out</h4>
      <p>{show.moveOut}</p>
    </div>
    <div className="show-card-details">
      <div>
        <h4>Confirmed</h4>
        <p>{show.confirmed}</p>
      </div>
      <div>
        <h4>Pending</h4>
        <p>{show.pending}</p>
      </div>
    </div>
  </div>
)

export default ShowCard
