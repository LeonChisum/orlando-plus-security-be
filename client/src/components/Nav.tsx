import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Nav.css'

const Nav = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div id="nav-section">
      <div className="nav-header">
        <h1>OPS Scheduler</h1>
        <ul>
          <li>
            <NavLink
              to="/roster"
              className={({ isActive }) => (isActive ? 'nav-active' : '')}
            >
              <i className="fas fa-user-shield" /> Personnel
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/shows"
              className={({ isActive }) => (isActive ? 'nav-active' : '')}
            >
              <i className="far fa-window-maximize" /> Shows
            </NavLink>
          </li>
        </ul>
        <div className="icon">
          <div className="adminMenu">
            <h3>Edit Profile</h3>
            <h3 onClick={handleLogout} style={{ cursor: 'pointer' }}>
              Logout
            </h3>
          </div>
          <i className="fas fa-sort-down" />
          <i className="fas fa-street-view" />
        </div>
      </div>
    </div>
  )
}

export default Nav
