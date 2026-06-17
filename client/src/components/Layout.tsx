import { Outlet } from 'react-router-dom'
import Nav from './Nav'
import styles from './Layout.module.css'

const Layout = () => (
  <div className={styles.shell}>
    <Nav />
    <main className={styles.canvas}>
      <Outlet />
    </main>
  </div>
)

export default Layout
