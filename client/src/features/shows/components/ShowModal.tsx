import { useEffect } from 'react'
import ShowForm from './ShowForm'
import type { Show } from '../../../types/index'

interface Props {
  mode: 'add' | 'edit'
  show?: Show
  onClose: () => void
}

const ShowModal = ({ mode, show, onClose }: Props) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'add' ? 'New show' : 'Edit show'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <ShowForm show={show} onClose={onClose} />
      </div>
    </div>
  )
}

export default ShowModal
