import React from 'react';
import { connect } from 'react-redux';

export const ShowCard = (props) => {
	return (
		<div className='show-card-container'>
			<h3>{props.name}</h3>
			<div>
				<h4>Location</h4>
				<p>{props.location}</p>
			</div>
			<div>
				<h4>Move-In</h4>
				<p>{props.moveIn}</p>
			</div>
			<div>
				<h4>Show Day(s)</h4>
				<p>
					{props.showDayStart}-{props.showDayEnd}
				</p>
			</div>
			<div>
				<h4>Move-Out</h4>
				<p>{props.moveOut}</p>
			</div>
			<div>
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
