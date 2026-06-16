import React from 'react'
import { Navigate } from 'react-router-dom'
import ShowDashboard from '../features/shows/components/ShowDashboard'

const ShowsPage = () => {
  const token = localStorage.getItem('token')

  if (!token) return <Navigate to="/login" replace />

  return <ShowDashboard />
}

export default ShowsPage
