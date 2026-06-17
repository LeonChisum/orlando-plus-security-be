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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <img src={Logo} alt="Orlando Plus Security logo" className="login-logo" />
        <p className="login-eyebrow">Supervisor Access</p>
        <h1 className="login-title">OPS Scheduler</h1>

        <div className="login-form" onKeyDown={handleKeyDown}>
          <div className="login-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </div>
          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button
            className="login-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
