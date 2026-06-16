import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import ShowsPage from './pages/ShowsPage'
import RosterPage from './pages/RosterPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <Navigate to="/shows" replace /> },
  {
    element: <Layout />,
    children: [
      { path: '/shows', element: <ShowsPage /> },
      { path: '/roster', element: <RosterPage /> },
    ],
  },
])
