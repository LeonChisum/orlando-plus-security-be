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
      <h4>Venue</h4>
      <p>{show.venue}</p>
    </div>
    <div className="show-card-details">
      <h4>Client</h4>
      <p>{show.client_name}</p>
    </div>
    <div className="show-card-details">
      <h4>Start</h4>
      <p>{show.start_date}</p>
    </div>
    <div className="show-card-details">
      <h4>End</h4>
      <p>{show.end_date}</p>
    </div>
    <div className="show-card-details">
      <h4>Status</h4>
      <p>{show.status}</p>
    </div>
  </div>
)

export default ShowCard
