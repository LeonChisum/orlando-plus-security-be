import React, { useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';

import { getShows } from '../../actions/showActions';
import { ShowCard } from './ShowCard';

export const ShowDashboard = ({ shows }) => {
	const dispatch = useDispatch();

	useEffect(() => {
		dispatch(getShows());
		console.log(shows);
	}, []);

	return (
		<div className='sd-container'>
			<div className='sd-title'>
				<h1> Upcoming Shows</h1>
			</div>
			<div className='sd-show-container'>{shows && shows.map((show) => <p>{show}</p>)}</div>
		</div>
	);
};

const mapStateToProps = (state) => ({
	shows: state.showReducer.shows,
});

export default connect(mapStateToProps, null)(ShowDashboard);
