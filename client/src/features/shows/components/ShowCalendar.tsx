import React from 'react'
import { useLocation } from 'react-router-dom'
import type { Show } from '../../../types/index'

interface LocationState {
  selectedShow: Show
}

const ShowCalendar = () => {
  const location = useLocation()
  const { selectedShow } = location.state as LocationState

  return (
    <div>
      <h2>{selectedShow?.name}</h2>
    </div>
  )
}

export default ShowCalendar
