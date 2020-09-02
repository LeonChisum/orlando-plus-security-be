import React, { useState } from 'react'
import styles from './Login.css'
import Logo from '../../images/OPSLogo.png'
import axios from 'axios'

export default function Login() {
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
