import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Loader from './Loader'

const RequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <Loader />
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default RequireAuth
