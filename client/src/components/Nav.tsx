import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import styles from './Nav.module.css'

const Nav = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.link} ${isActive ? styles.linkActive : ''}`

  return (
    <header className={styles.nav}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <i className="fas fa-shield-alt" />
          <span className={styles.brandName}>
            <span className={styles.brandAccent}>OPS</span> Scheduler
          </span>
        </div>

        <div className={styles.divider} />

        <nav className={styles.links}>
          <NavLink to="/roster" className={linkClass}>
            <i className="fas fa-user-shield" />
            Personnel
          </NavLink>
          <NavLink to="/shows" className={linkClass}>
            <i className="far fa-calendar-alt" />
            Shows
          </NavLink>
          <span className={`${styles.link} ${styles.linkStub}`} title="Coming in Phase 4">
            <i className="fas fa-table" />
            Schedule
          </span>
          <span className={`${styles.link} ${styles.linkStub}`} title="Coming in Phase 6">
            <i className="fas fa-file-alt" />
            Reports
          </span>
        </nav>

        <div className={styles.userArea} ref={menuRef}>
          <button
            className={styles.userBtn}
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <i className={`fas fa-user-circle ${styles.userIcon}`} />
            <span className={styles.userEmail}>{user?.email ?? 'Admin'}</span>
            <i className={`fas fa-chevron-down ${styles.chevron} ${menuOpen ? styles.chevronOpen : ''}`} />
          </button>

          {menuOpen && (
            <div className={styles.dropdown} role="menu">
              <button className={styles.dropdownItem} role="menuitem">
                <i className="fas fa-user-edit" /> &nbsp;Edit Profile
              </button>
              <div className={styles.dropdownSep} />
              <button
                className={`${styles.dropdownItem} ${styles['dropdownItem--danger']}`}
                role="menuitem"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt" /> &nbsp;Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Nav
