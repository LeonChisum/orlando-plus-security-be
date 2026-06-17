import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../images/OPSLogo.png'
import './Login.css'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCredentials({ ...credentials, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    setError('')
    setIsSubmitting(true)
    try {
      await login(credentials.email, credentials.password)
      navigate('/shows')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setIsSubmitting(false)
    }
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
        {error && <p className="login-error">{error}</p>}
        <input
          type="button"
          value={isSubmitting ? 'Logging in...' : 'Login'}
          onClick={handleSubmit}
          disabled={isSubmitting}
        />
      </form>
    </div>
  )
}

export default LoginPage
