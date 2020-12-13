import axios from 'axios';
import { ADMIN_LOADING, ADMIN_LOADED, LOGIN_SUCCESS, LOGIN_FAIL, LOGOUT_SUCCESS } from "../actions/types"
import { returnErrors } from "./errorActions"

export const login = (admin) => (dispatch) => {
    // Load admin
    dispatch({ type: ADMIN_LOADING })

    // send request to Backend
    axios.post("http://localhost:5000/auth/login", admin)
        .then(res => {
            const { accessToken } = res.data
            localStorage.setItem('token', accessToken )
            dispatch({ type: LOGIN_SUCCESS, payload: res.data })
        })
        .catch(err => {
            dispatch(returnErrors(err.response.data.message, err.response.status))
            dispatch({ type: LOGIN_FAIL })
        })
}

export const logout = () => (dispatch) => {
    dispatch({ type: LOGOUT_SUCCESS })
}