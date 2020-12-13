import React, { Component } from 'react'
import { Route, Redirect } from "react-router-dom"
import { connect, useSelector } from 'react-redux'
import Nav from '../nav/Nav'

export const Dashboard = () => {
    const { currentAdmin } = useSelector((state) => state.authReducer )
    console.log(currentAdmin)
    const accessToken = localStorage.getItem('token')

    if (!accessToken) {
        return <Redirect to="/" />
    }

    return (
        <div>
            <Nav/>
        </div>
    )
}

const mapStateToProps = (state) => ({
    
})

const mapDispatchToProps = {
    
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard)
