import { useState } from 'react'
import { useWorkers } from '../hooks/useWorkers'
import WorkerRow from './WorkerRow'
import WorkerModal from './WorkerModal'
import Loader from '../../../components/Loader'
import type { Worker, WorkerType } from '../../../types/index'
import './Roster.css'

type TypeFilter = WorkerType | 'all'
type ModalState = { mode: 'add' } | { mode: 'edit'; worker: Worker } | null

const RosterTable = () => {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)

  const { data: workers, isLoading, isError } = useWorkers({
    worker_type: typeFilter === 'all' ? undefined : typeFilter,
    include_inactive: includeInactive,
  })

  if (isLoading) return <Loader />

  if (isError)
    return (
      <div className="roster-error">
        <p>Unable to load roster. Check your connection and try again.</p>
      </div>
    )

  return (
    <>
      <div className="roster-container">
        <div className="roster-header">
          <h1>Personnel Roster</h1>
          <div className="roster-controls">
            <div className="roster-type-tabs">
              {(['all', 'guard', 'staffer'] as TypeFilter[]).map((t) => (
                <button
                  key={t}
                  className={`tab-btn${typeFilter === t ? ' tab-btn--active' : ''}`}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === 'all' ? 'All' : t === 'guard' ? 'Guards' : 'Staffers'}
                </button>
              ))}
            </div>
            <label className="roster-inactive-toggle">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              Show inactive
            </label>
            <button
              className="btn btn--primary"
              onClick={() => setModal({ mode: 'add' })}
            >
              + Add worker
            </button>
          </div>
        </div>

        <div className="roster-count">
          {workers?.length ?? 0} {workers?.length === 1 ? 'person' : 'people'}
        </div>

        {workers?.length === 0 ? (
          <p className="roster-empty">No workers match the current filter.</p>
        ) : (
          <table className="roster-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Position</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {workers?.map((worker) => (
                <WorkerRow
                  key={worker.id}
                  worker={worker}
                  onClick={(w) => setModal({ mode: 'edit', worker: w })}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <WorkerModal
          mode={modal.mode}
          worker={modal.mode === 'edit' ? modal.worker : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

export default RosterTable
