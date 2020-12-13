import React, { useState } from 'react'
import { connect } from 'react-redux'
import styles from './Login.css'
import Logo from '../../images/OPSLogo.png'

import { login } from '../../actions/authActions'


const Login = (props) => {
    const [newUser, setNewUser] = useState({
        email: '',
        password: ''
    })

    const handleChange = (e) => (
        setNewUser({
            ...newUser,
            [e.target.name]: e.target.value
        })
    )

    const handleSubmit = (e) => {
        e.preventDefault();
        props.login(newUser)
        props.history.push('/showdashboard')
    }

    return (
        <div className="login-form-container">
            <img src={Logo} alt="OPS logo" />
            <h3>
                OPS Scheduler
            </h3>
            <form onSubmit={handleSubmit}>
                <label>Email Address</label>
                <input
                    name='email'
                    value={newUser.email}
                    onChange={handleChange} />
                <label>Password</label>
                <input
                    type='password'
                    name='password'
                    value={newUser.password}
                    onChange={handleChange} />
                <input type="button" value="Login" onClick={handleSubmit} />
            </form>
        </div >
    )
}



export default connect(null, { login })(Login)