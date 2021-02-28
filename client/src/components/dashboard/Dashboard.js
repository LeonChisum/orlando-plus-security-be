import React, { Component, useEffect } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { connect, useSelector } from 'react-redux';
import Nav from '../nav/Nav';
import Loader from '../auth/Loader';
import { ShowDashboard } from '../shows/ShowDashboard';

export const Dashboard = (props) => {
	const accessToken = localStorage.getItem('token');

	if (props.isLoading) {
		return <Loader />;
	}

	return accessToken ? (
		<div>
			<Nav />
			<ShowDashboard />
		</div>
	) : (
		<Redirect to='/' />
	);
};

const mapStateToProps = (state) => ({
	currentAdmin: state.authReducer.currentAdmin,
	isLoading: state.authReducer.isLoading,
});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
