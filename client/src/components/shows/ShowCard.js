import React from 'react'
import { connect } from 'react-redux'

export const ShowCard = (props) => {
    return (
        <div>
            
        </div>
    )
}

const mapStateToProps = (state) => ({
    shows: state.showReducer.shows
})

const mapDispatchToProps = {
    
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowCard)
