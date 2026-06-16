import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../images/OPSLogo.png'
import './Login.css'

const LoginPage = () => {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({ email: '', password: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCredentials({ ...credentials, [e.target.name]: e.target.value })

  const handleSubmit = () => {
    // TODO ticket 1.6: wire up Supabase auth
    navigate('/shows')
  }

  return (
    <div className="login-form-container">
      <img src={Logo} alt="OPS logo" />
      <h3>OPS Scheduler</h3>
      <form>
        <label>Email Address</label>
        <input name="email" value={credentials.email} onChange={handleChange} />
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
        />
        <input type="button" value="Login" onClick={handleSubmit} />
      </form>
    </div>
  )
}

export default LoginPage
