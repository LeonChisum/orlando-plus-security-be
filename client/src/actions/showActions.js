import { axiosWithAuth } from '../helperFuncs';
import { SHOWS_LOADED, SHOWS_FAIL, SHOWS_LOADING } from '../actions/types';
import { returnErrors } from './errorActions';

export const getShows = () => (dispatch) => {
	// Load show
	dispatch({ type: SHOWS_LOADING });

	// send request to Backend
	axiosWithAuth()
		.get('/shows')
		.then((res) => {
			console.log(res);
			dispatch({ type: SHOWS_LOADED, payload: res.data });
		})
		.catch((err) => {
			dispatch(returnErrors(err.response.data.message, err.response.status));
			dispatch({ type: SHOWS_FAIL });
		});
};
