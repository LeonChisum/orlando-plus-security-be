import type { Worker } from '../../../types/index'
import styles from './BadgeMini.module.css'

interface Props {
  worker: Worker
  /** Applied when the mini is used as a dnd-kit drag overlay */
  isDragging?: boolean
}

const initials = (w: Worker) =>
  `${w.first_name.charAt(0)}${w.last_name.charAt(0)}`.toUpperCase()

const BadgeMini = ({ worker, isDragging = false }: Props) => {
  const isGuard = worker.worker_type === 'guard'

  return (
    <div
      className={`${styles.mini} ${isDragging ? styles.dragging : ''} ${!worker.is_active ? styles.inactive : ''}`}
      aria-label={`${worker.first_name} ${worker.last_name}, ${isGuard ? 'Guard' : 'Staffer'}`}
    >
      {/* Avatar monogram */}
      <div className={styles.avatar} aria-hidden="true">
        {initials(worker)}
      </div>

      {/* Name + role */}
      <div className={styles.info}>
        <span className={styles.name}>
          {worker.first_name} {worker.last_name}
        </span>
        <div className={styles.meta}>
          <span className={`${styles.typeChip} ${isGuard ? styles.guard : styles.staffer}`}>
            {isGuard ? 'Guard' : 'Staffer'}
          </span>
          {worker.is_supervisor && (
            <span className={styles.supDot} title="Supervisor" aria-label="Supervisor" />
          )}
          {!worker.is_active && (
            <span className={styles.inactiveLabel}>Inactive</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default BadgeMini
