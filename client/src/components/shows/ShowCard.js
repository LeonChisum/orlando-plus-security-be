import React, { useEffect } from "react";
import { connect } from "react-redux";

export const ShowCard = (props) => {
  useEffect(() => {
    console.log(props);
  }, []);

  const toShowCalender = () => {};

  return (
    <div className='show-card-container'>
      <div className='show-card-title'>
        <h3>{props.name}</h3>
      </div>
      <div className='show-card-details'>
        <div>
          <h4>Location</h4>
        </div>
        <div>
          <p>{props.location}</p>
        </div>
      </div>
      <div className='show-card-details'>
        <div>
          <h4>Move-In</h4>
        </div>
        <div>
          <p>{props.moveIn}</p>
        </div>
      </div>
      <div className='show-card-details'>
        <div>
          <h4>Show Day(s)</h4>
        </div>
        <div>
          <p>
            {props.showDayStart}-{props.showDayEnd}
          </p>
        </div>
      </div>
      <div className='show-card-details'>
        <div>
          <h4>Move-Out</h4>
        </div>
        <div>
          <p>{props.moveOut}</p>
        </div>
      </div>
      <div className='show-card-details'>
        <div>
          <h4>Confirmed</h4>
          <p>{props.confirmed}</p>
        </div>
        <div>
          <h4>Pending</h4>
          <p>{props.pending}</p>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(ShowCard);
