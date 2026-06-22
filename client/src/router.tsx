import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import LoginPage from './pages/LoginPage'
import ShowsPage from './pages/ShowsPage'
import ShowDetailPage from './pages/ShowDetailPage'
import ImportPage from './pages/ImportPage'
import RosterPage from './pages/RosterPage'
import ScheduleBoardPage from './pages/ScheduleBoardPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <Navigate to="/shows" replace /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/shows', element: <ShowsPage /> },
          { path: '/shows/:id', element: <ShowDetailPage /> },
          { path: '/shows/:id/import', element: <ImportPage /> },
          { path: '/roster', element: <RosterPage /> },
          { path: '/schedule/:id', element: <ScheduleBoardPage /> },
        ],
      },
    ],
  },
])
