import React from 'react'
import { Outlet } from 'react-router-dom'
import Nav from './Nav'

const Layout = () => (
  <div className="app-container">
    <Nav />
    <Outlet />
  </div>
)

export default Layout
