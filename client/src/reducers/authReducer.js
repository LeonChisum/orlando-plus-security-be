import { ADMIN_LOADING, ADMIN_LOADED, LOGIN_SUCCESS, LOGIN_FAIL, LOGOUT_SUCCESS } from '../actions/types';

const initialState = {
	token: localStorage.getItem('token'),
	isLoading: false,
	isAuthenticated: false,
	currentAdmin: null,
};

const authReducer = (state = initialState, action) => {
	switch (action.type) {
		case ADMIN_LOADING:
			return {
				...state,
				isLoading: true,
			};
		case ADMIN_LOADED:
			return {
				...state,
				isAuthenticated: true,
				isLoading: false,
				currentAdmin: action.payload.user,
			};
		case LOGIN_SUCCESS:
			return {
				...state,
				isAuthenticated: true,
				isLoading: false,
				currentAdmin: action.payload.user,
				token: action.payload.accessToken,
			};
		case LOGIN_FAIL:
		case LOGOUT_SUCCESS:
			localStorage.removeItem('token');
			return {
				...state,
				token: null,
				currentAdmin: null,
				isAuthenticated: false,
				isLoading: false,
			};
		default:
			return state;
	}
};

export default authReducer;
