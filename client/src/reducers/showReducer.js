import {
  SHOWS_LOADED,
  SHOWS_FAIL,
  SHOWS_LOADING,
  SINGLE_SHOW_LOADED,
} from "../actions/types";

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
        isLoading: false,
      };
    case SHOWS_FAIL:
      return {
        message: {},
        status: null,
        id: null,
      };
    case SINGLE_SHOW_LOADED:
      return {
        ...state,
        show: action.payload,
        isLoading: false,
      };
    default:
      return state;
  }
}
