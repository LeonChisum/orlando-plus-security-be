import React, { Component, useEffect } from 'react'
import { Route, Redirect } from "react-router-dom"
import { connect, useSelector } from 'react-redux'
import Nav from '../nav/Nav'
import Loader from '../auth/Loader'

export const Dashboard = (props) => {
    // const { currentAdmin } = useSelector((state) => state.authReducer )
    // console.log(currentAdmin)
    const accessToken = localStorage.getItem('token')

    if (props.isLoading) {
        return <Loader/>
    }

    return (
         props.currentAdmin ? <div>
            <Nav/>
        </div>  : <Redirect to="/" />
    )
}

const mapStateToProps = (state) => ({
    currentAdmin: state.authReducer.currentAdmin,
    isLoading: state.authReducer.isLoading
})

const mapDispatchToProps = {
    
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard)
