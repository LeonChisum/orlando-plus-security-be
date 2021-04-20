import { SHOWS_LOADED, SHOWS_FAIL, SHOWS_LOADING } from '../actions/types';

const initialState = {
	show: {},
	shows: [],
	isLoading: false,
};

export default function (state = initialState, action) {
	switch (action.type) {
		case SHOWS_LOADING:
			return {
				...state,
				isLoading: true,
			};
		case SHOWS_LOADED:
			return {
				...state,
				shows: action.payload,
			};
		case SHOWS_FAIL:
			return {
				message: {},
				status: null,
				id: null,
			};
		default:
			return state;
	}
}
