import axios from 'axios';
import { ADMIN_LOADING, ADMIN_LOADED, LOGIN_SUCCESS, LOGIN_FAIL, LOGOUT_SUCCESS } from "../actions/types"

export const login = (admin) => (dispatch) => {
    axios.post("http://localhost:5000/auth/login", admin)
        .then(data => {
            console.log(data)
            dispatch({ type: LOGIN_SUCCESS, payload: data.data })
        })
        .catch(err => dispatch({ type: LOGIN_FAIL }))
}