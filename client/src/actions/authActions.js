import axios from 'axios';
import { ADMIN_LOADING, ADMIN_LOADED, LOGIN_SUCCESS, LOGIN_FAIL, LOGOUT_SUCCESS } from "../actions/types"

export const login = (admin) => (dispatch) => {
    axios.post("http://localhost:5000/auth/login", admin)
        .then(res => {
            const { accessToken } = res.data
            localStorage.setItem('token', accessToken )
            dispatch({ type: LOGIN_SUCCESS, payload: res.data })
        })
        .catch(err => dispatch({ type: LOGIN_FAIL }))
}

export const logout = () => (dispatch) => {
    localStorage.removeItem('token')
    dispatch({ type: LOGOUT_SUCCESS })
}