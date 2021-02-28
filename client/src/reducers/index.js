import { combineReducers } from 'redux';
import authReducer from './authReducer';
import errorReducer from './errorReducer';
import showReducer from './showReducer';

export default combineReducers({
	authReducer,
	errorReducer,
	showReducer,
});
