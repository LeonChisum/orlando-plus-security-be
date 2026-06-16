import React, { Component, useEffect, useState } from "react";
import { Route, Redirect, Switch } from "react-router-dom";
import { connect, useDispatch } from "react-redux";

import Nav from "../nav/Nav";
import Loader from "../auth/Loader";
import { ShowDashboard } from "../shows/ShowDashboard";

import { getShows } from "../../actions/showActions";
import { ShowCalendar } from "../shows/ShowCalendar";

export const Dashboard = (props) => {
  const dispatch = useDispatch();

  const [shows, setShows] = useState(null);

  useEffect(() => {
    const retrieveShows = () => {
      dispatch(getShows());
      setShows(props.shows);
    };
    retrieveShows();
  }, []);

  const accessToken = localStorage.getItem("token");

  if (props.isLoading) {
    return <Loader />;
  }

  return accessToken ? (
    <div>
      <Nav />
      <Switch>
        {props.shows && (
          <Route path='/'>
            <ShowDashboard shows={props.shows} isLoading={props.isLoading} />
          </Route>
        )}
        <Route path='/showdashboard'>
          <ShowCalendar />
        </Route>
      </Switch>
    </div>
  ) : (
    <Redirect to='/' />
  );
};

const mapStateToProps = (state) => ({
  currentAdmin: state.authReducer.currentAdmin,
  isLoading: state.authReducer.isLoading,
  shows: state.showReducer.shows,
});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
