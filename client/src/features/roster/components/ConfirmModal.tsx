import { useEffect } from 'react'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  isPending?: boolean
  onConfirm: () => void
  onClose: () => void
}

const ConfirmModal = ({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  isPending = false,
  onConfirm,
  onClose,
}: Props) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-panel--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="confirm-body">
          <p className="confirm-message">{message}</p>
          <div className="confirm-actions">
            <button className="btn btn--ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </button>
            <button
              className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? 'Working…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
