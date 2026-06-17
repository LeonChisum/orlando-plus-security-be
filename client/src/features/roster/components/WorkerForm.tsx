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
  license_number: string
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
  license_number: '',
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
  license_number: w.d_license?.number ?? '',
  is_supervisor: w.is_supervisor,
  is_active: w.is_active,
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_DIGITS_RE = /^\d{10}$/

const validate = (form: FormState): string | null => {
  if (form.first_name.trim().length < 2) return 'First name must be at least 2 characters.'
  if (form.last_name.trim().length < 2) return 'Last name must be at least 2 characters.'
  if (!EMAIL_RE.test(form.email.trim())) return 'Enter a valid email address.'
  const digits = form.phone.replace(/\D/g, '')
  if (digits.length > 0 && !PHONE_DIGITS_RE.test(digits)) return 'Phone must be a 10-digit US number.'
  if (form.worker_type === 'guard' && !form.license_number.trim()) return 'License number is required for guards.'
  return null
}

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

    const validationError = validate(form)
    if (validationError) {
      setError(validationError)
      return
    }

    const payload: WorkerInsert = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.replace(/\D/g, '') || undefined,
      worker_type: form.worker_type,
      position: form.position.trim() || undefined,
      is_supervisor: form.is_supervisor,
      is_active: form.is_active,
      d_license: form.worker_type === 'guard' && form.license_number.trim()
        ? { blue_card: false, number: form.license_number.trim() }
        : undefined,
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

      {form.worker_type === 'guard' && (
        <div className="wf-row wf-row--1">
          <div className="wf-field">
            <label>Class D License # *</label>
            <input
              value={form.license_number}
              onChange={(e) => set('license_number', e.target.value)}
              placeholder="e.g. D1234567"
            />
          </div>
        </div>
      )}

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
