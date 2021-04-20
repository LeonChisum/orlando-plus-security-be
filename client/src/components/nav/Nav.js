import React from 'react';
import { connect, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import './Nav.css';

import { logout } from '../../actions/authActions';

export const Nav = () => {
	const dispatch = useDispatch();

	return (
		<div id={`nav-section`}>
			<div className='nav-header'>
				<h1>OPS Scheduler</h1>
				<ul>
					<li>
						<NavLink to='/showdashboard'>
							<i className='fas fa-user-shield'></i> Personnel
						</NavLink>
					</li>
					<li>
						<NavLink to='/showdashboard' activeClassName='nav-active'>
							<i className='far fa-window-maximize'></i> Shows
						</NavLink>
					</li>
				</ul>
				<div className='icon'>
					<div className='adminMenu'>
						<h3>Edit Profile</h3>
						<h3>
							<NavLink to='/' onClick={() => dispatch(logout())}>
								Logout
							</NavLink>
						</h3>
					</div>
					<i className='fas fa-sort-down'></i>
					<i className='fas fa-street-view'></i>
				</div>
			</div>
		</div>
	);
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Nav);
