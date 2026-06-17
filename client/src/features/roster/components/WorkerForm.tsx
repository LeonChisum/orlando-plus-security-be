import { useState } from 'react'
import { useCreateWorker, useUpdateWorker } from '../hooks/useWorkerMutations'
import type { Worker, WorkerInsert, WorkerType } from '../../../types/index'

interface Props {
  worker?: Worker
  onClose: () => void
}

interface FormState {
  first_name: string
  last_name: string
  email: string
  phone: string
  worker_type: WorkerType
  position: string
  is_supervisor: boolean
  is_active: boolean
}

const empty: FormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  worker_type: 'guard',
  position: '',
  is_supervisor: false,
  is_active: true,
}

const toFormState = (w: Worker): FormState => ({
  first_name: w.first_name,
  last_name: w.last_name,
  email: w.email,
  phone: w.phone ?? '',
  worker_type: w.worker_type,
  position: w.position ?? '',
  is_supervisor: w.is_supervisor,
  is_active: w.is_active,
})

const WorkerForm = ({ worker, onClose }: Props) => {
  const isEdit = !!worker
  const [form, setForm] = useState<FormState>(isEdit ? toFormState(worker) : empty)
  const [error, setError] = useState<string | null>(null)

  const create = useCreateWorker()
  const update = useUpdateWorker()
  const isPending = create.isPending || update.isPending

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = () => {
    setError(null)

    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      setError('First name, last name, and email are required.')
      return
    }

    const payload: WorkerInsert = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      worker_type: form.worker_type,
      position: form.position.trim() || undefined,
      is_supervisor: form.is_supervisor,
      is_active: form.is_active,
    }

    if (isEdit) {
      update.mutate(
        { id: worker.id, data: payload },
        { onSuccess: onClose, onError: (e) => setError(e.message) }
      )
    } else {
      create.mutate(payload, {
        onSuccess: onClose,
        onError: (e) => setError(e.message),
      })
    }
  }

  return (
    <div className="worker-form">
      <div className="wf-row wf-row--2">
        <div className="wf-field">
          <label>First name *</label>
          <input
            value={form.first_name}
            onChange={(e) => set('first_name', e.target.value)}
            placeholder="First name"
          />
        </div>
        <div className="wf-field">
          <label>Last name *</label>
          <input
            value={form.last_name}
            onChange={(e) => set('last_name', e.target.value)}
            placeholder="Last name"
          />
        </div>
      </div>

      <div className="wf-row wf-row--2">
        <div className="wf-field">
          <label>Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="email@example.com"
          />
        </div>
        <div className="wf-field">
          <label>Phone</label>
          <input
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="(555) 000-0000"
          />
        </div>
      </div>

      <div className="wf-row wf-row--2">
        <div className="wf-field">
          <label>Type *</label>
          <select
            value={form.worker_type}
            onChange={(e) => set('worker_type', e.target.value as WorkerType)}
          >
            <option value="guard">Guard</option>
            <option value="staffer">Staffer</option>
          </select>
        </div>
        <div className="wf-field">
          <label>Position</label>
          <input
            value={form.position}
            onChange={(e) => set('position', e.target.value)}
            placeholder="e.g. Lead Guard"
          />
        </div>
      </div>

      <div className="wf-row wf-row--checks">
        <label className="wf-check">
          <input
            type="checkbox"
            checked={form.is_supervisor}
            onChange={(e) => set('is_supervisor', e.target.checked)}
          />
          Supervisor
        </label>
        {isEdit && (
          <label className="wf-check">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
            />
            Active
          </label>
        )}
      </div>

      {error && <p className="wf-error">{error}</p>}

      <div className="wf-actions">
        <button className="btn btn--ghost" onClick={onClose} disabled={isPending}>
          Cancel
        </button>
        <button className="btn btn--primary" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add worker'}
        </button>
      </div>
    </div>
  )
}

export default WorkerForm
