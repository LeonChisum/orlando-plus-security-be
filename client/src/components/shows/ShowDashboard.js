import React, { useEffect } from "react";
import { connect, useDispatch } from "react-redux";

import { ShowCard } from "./ShowCard";

import "./Show.css";
import Loader from "../auth/Loader";

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
            <ShowCard
              key={show.__id}
              name={show.name}
              location={show.location}
              moveIn={show.moveIn}
              moveOut={show.moveOut}
              confirmed={show.confirmed}
              pending={show.pending}
              showDayStart={show.showDayStart}
              showDayEnd={show.showDayEnd}
            />
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
