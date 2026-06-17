import { useState } from 'react'
import { useWorkers } from '../hooks/useWorkers'
import { useToggleWorkerActive } from '../hooks/useWorkerMutations'
import WorkerRow from './WorkerRow'
import WorkerModal from './WorkerModal'
import ConfirmModal from './ConfirmModal'
import Loader from '../../../components/Loader'
import type { Worker, WorkerType } from '../../../types/index'
import './Roster.css'

type TypeFilter = WorkerType | 'all'
type ModalState = { mode: 'add' } | { mode: 'edit'; worker: Worker } | null

const RosterTable = () => {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [confirmWorker, setConfirmWorker] = useState<Worker | null>(null)

  const toggleActive = useToggleWorkerActive()

  const { data: workers, isLoading, isError } = useWorkers({
    worker_type: typeFilter === 'all' ? undefined : typeFilter,
    include_inactive: includeInactive,
  })

  const filteredWorkers = (() => {
    if (!workers || !searchQuery.trim()) return workers
    const q = searchQuery.trim().toLowerCase()
    return workers.filter((w) => {
      const fullName = `${w.first_name} ${w.last_name}`.toLowerCase()
      const reverseName = `${w.last_name} ${w.first_name}`.toLowerCase()
      const license = (w.d_license?.number ?? '').toLowerCase()
      return fullName.includes(q) || reverseName.includes(q) || license.includes(q)
    })
  })()

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

        <div className="roster-search">
          <input
            type="search"
            placeholder="Search by name or license #…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="roster-count">
          {filteredWorkers?.length ?? 0} {filteredWorkers?.length === 1 ? 'person' : 'people'}
        </div>

        {filteredWorkers?.length === 0 ? (
          <p className="roster-empty">No workers match the current filter.</p>
        ) : (
          <table className="roster-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>License #</th>
                <th>Position</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers?.map((worker) => (
                <WorkerRow
                  key={worker.id}
                  worker={worker}
                  onClick={(w) => setModal({ mode: 'edit', worker: w })}
                  onDeactivate={(w) => setConfirmWorker(w)}
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

      {confirmWorker && (
        <ConfirmModal
          title="Deactivate worker"
          message={`Deactivate ${confirmWorker.first_name} ${confirmWorker.last_name}? They will be hidden from active rosters.`}
          confirmLabel="Deactivate"
          danger
          isPending={toggleActive.isPending}
          onConfirm={() =>
            toggleActive.mutate(
              { id: confirmWorker.id, is_active: false },
              { onSuccess: () => setConfirmWorker(null) }
            )
          }
          onClose={() => setConfirmWorker(null)}
        />
      )}
    </>
  )
}

export default RosterTable
