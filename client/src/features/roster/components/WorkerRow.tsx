import type { Worker } from '../../../types/index'

interface Props {
  worker: Worker
  onClick: (worker: Worker) => void
}

const WorkerRow = ({ worker, onClick }: Props) => {
  const fullName = `${worker.last_name}, ${worker.first_name}`

  return (
    <tr
      className={`worker-row${!worker.is_active ? ' worker-row--inactive' : ''}`}
      onClick={() => onClick(worker)}
    >
      <td>
        {fullName}
        {worker.is_supervisor && (
          <span className="badge badge--supervisor">SUP</span>
        )}
      </td>
      <td>
        <span className={`badge badge--type badge--${worker.worker_type}`}>
          {worker.worker_type}
        </span>
      </td>
      <td>{worker.position ?? '—'}</td>
      <td>{worker.phone ?? '—'}</td>
      <td>{worker.email}</td>
      <td>
        <span className={`badge badge--status badge--${worker.is_active ? 'active' : 'inactive'}`}>
          {worker.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
    </tr>
  )
}

export default WorkerRow
