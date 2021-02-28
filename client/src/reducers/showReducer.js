import { SHOWS_LOADED, SHOWS_FAIL } from '../actions/types';

const initialState = {
	show: {},
	shows: [],
};

export default function (state = initialState, action) {
	switch (action.type) {
		case SHOWS_LOADED:
			return {
				...state,
				shows: action.payload.data,
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
