import { useEffect } from 'react'
import WorkerForm from './WorkerForm'
import type { Worker } from '../../../types/index'

interface Props {
  mode: 'add' | 'edit'
  worker?: Worker
  onClose: () => void
}

const WorkerModal = ({ mode, worker, onClose }: Props) => {
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
          <h2>{mode === 'add' ? 'Add worker' : 'Edit worker'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <WorkerForm worker={worker} onClose={onClose} />
      </div>
    </div>
  )
}

export default WorkerModal
