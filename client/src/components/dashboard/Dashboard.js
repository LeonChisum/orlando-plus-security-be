import React, { Component, useEffect, useState } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { connect, useDispatch } from 'react-redux';

import Nav from '../nav/Nav';
import Loader from '../auth/Loader';
import { ShowDashboard } from '../shows/ShowDashboard';

import { getShows } from '../../actions/showActions';

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

	const accessToken = localStorage.getItem('token');

	if (props.isLoading) {
		return <Loader />;
	}
	console.log('shows', props.shows);
	return accessToken ? (
		<div>
			<Nav />
			{<ShowDashboard shows={props.shows} isLoading={props.isLoading} />}
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
