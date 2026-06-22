import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateShow, useUpdateShow } from '../hooks/useShows'
import type { Show, ShowInsert } from '../../../types/index'

interface Props {
  show?: Show
  onClose: () => void
}

interface FormState {
  name: string
  client_name: string
  venue: string
  start_date: string
  end_date: string
  notes: string
}

const empty: FormState = {
  name: '',
  client_name: '',
  venue: '',
  start_date: '',
  end_date: '',
  notes: '',
}

const toFormState = (s: Show): FormState => ({
  name: s.name,
  client_name: s.client_name,
  venue: s.venue,
  start_date: s.start_date,
  end_date: s.end_date,
  notes: s.notes ?? '',
})

const validate = (form: FormState): string | null => {
  if (form.name.trim().length < 2) return 'Show name must be at least 2 characters.'
  if (form.client_name.trim().length < 2) return 'Client name must be at least 2 characters.'
  if (form.venue.trim().length < 2) return 'Venue must be at least 2 characters.'
  if (!form.start_date) return 'Start date is required.'
  if (!form.end_date) return 'End date is required.'
  if (form.end_date < form.start_date) return 'End date must be on or after start date.'
  return null
}

const ShowForm = ({ show, onClose }: Props) => {
  const isEdit = !!show
  const [form, setForm] = useState<FormState>(isEdit ? toFormState(show) : empty)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const create = useCreateShow()
  const update = useUpdateShow()
  const isPending = create.isPending || update.isPending

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = () => {
    setError(null)
    const validationError = validate(form)
    if (validationError) {
      setError(validationError)
      return
    }

    const payload: ShowInsert = {
      name: form.name.trim(),
      client_name: form.client_name.trim(),
      venue: form.venue.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      notes: form.notes.trim() || undefined,
      status: isEdit ? show.status : 'draft',
    }

    if (isEdit) {
      update.mutate(
        { id: show.id, data: payload },
        { onSuccess: onClose, onError: (e) => setError(e.message) }
      )
    } else {
      create.mutate(payload, {
        onSuccess: (created) => navigate(`/shows/${created.id}`),
        onError: (e) => setError(e.message),
      })
    }
  }

  return (
    <div className="show-form">
      <div className="wf-row wf-row--1">
        <div className="wf-field">
          <label>Show name *</label>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Europa 2025"
          />
        </div>
      </div>

      <div className="wf-row wf-row--2">
        <div className="wf-field">
          <label>Client name *</label>
          <input
            value={form.client_name}
            onChange={(e) => set('client_name', e.target.value)}
            placeholder="e.g. ReedPop"
          />
        </div>
        <div className="wf-field">
          <label>Venue *</label>
          <input
            value={form.venue}
            onChange={(e) => set('venue', e.target.value)}
            placeholder="e.g. Orange County Convention Center"
          />
        </div>
      </div>

      <div className="wf-row wf-row--2">
        <div className="wf-field">
          <label>Start date *</label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => set('start_date', e.target.value)}
          />
        </div>
        <div className="wf-field">
          <label>End date *</label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => set('end_date', e.target.value)}
          />
        </div>
      </div>

      <div className="wf-row wf-row--1">
        <div className="wf-field">
          <label>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Optional notes…"
            rows={3}
          />
        </div>
      </div>

      {error && <p className="wf-error">{error}</p>}

      <div className="wf-actions">
        <button className="btn btn--ghost" onClick={onClose} disabled={isPending}>
          Cancel
        </button>
        <button className="btn btn--primary" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create show'}
        </button>
      </div>
    </div>
  )
}

export default ShowForm
