import React, { useEffect } from "react";
import { connect, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import "./Show.css";

import { ShowCard } from "./ShowCard";
import Loader from "../auth/Loader";
import { getSelectedShow } from "../../actions/showActions";
import { ShowCalendar } from "./ShowCalendar";

export const ShowDashboard = (props) => {
  const dispatch = useDispatch();

  if (props.isLoading) {
    return <Loader />;
  }

  return (
    <div className='sd-container'>
      <div className='sd-title'>
        <h1> Upcoming Shows</h1>
      </div>
      <div className='sd-show-container'>
        {/* rendering each show with its own details */}

        {props.shows &&
          props.shows.map((show) => (
            <Link
              to={{
                pathname: `/${show.name}`,
                state: { selectedShow: show },
              }}>
              <ShowCard
                key={show._id}
                name={show.name}
                location={show.location}
                moveIn={show.moveIn}
                moveOut={show.moveOut}
                confirmed={show.confirmed}
                pending={show.pending}
                showDayStart={show.showDayStart}
                showDayEnd={show.showDayEnd}
              />
            </Link>
          ))}
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  shows: state.showReducer.shows,
  isLoading: state.showReducer.isLoading,
});

export default connect(mapStateToProps, null)(ShowDashboard);
