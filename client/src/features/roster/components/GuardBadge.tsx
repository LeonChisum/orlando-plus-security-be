import { useState, useRef, useEffect } from 'react'
import type { Worker, WorkerUpdate } from '../../../types/index'
import { useUpdateWorker, useToggleWorkerActive } from '../hooks/useWorkerMutations'
import styles from './GuardBadge.module.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (w: Worker) =>
  `${w.first_name.charAt(0)}${w.last_name.charAt(0)}`.toUpperCase()

const formatPhone = (raw: string): string => {
  const d = raw.replace(/\D/g, '')
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  return raw
}

const minsToHHMM = (mins: number | undefined): string => {
  if (mins == null) return ''
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const hhmmToMins = (s: string): number | undefined => {
  const match = s.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return undefined
  return parseInt(match[1]) * 60 + parseInt(match[2])
}

const daysTil = (dateStr: string | undefined): number | null => {
  if (!dateStr) return null
  return (new Date(dateStr).getTime() - Date.now()) / 86_400_000
}

// ─── Shield logo ──────────────────────────────────────────────────────────────

const ShieldIcon = () => (
  <svg width="26" height="30" viewBox="0 0 26 30" fill="none" aria-hidden="true">
    <path
      d="M13 1L1 6v9c0 7.5 5 13.8 12 15.5C20 28.8 25 22.5 25 15V6L13 1z"
      fill="rgba(212,175,55,0.12)"
      stroke="rgba(212,175,55,0.55)"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path
      d="M13 6L4 10v5.5c0 5 3.3 9.5 9 11 5.7-1.5 9-6 9-11V10L13 6z"
      fill="rgba(212,175,55,0.18)"
    />
    <path
      d="M9.5 15.5l2.5 2.5 5-5"
      stroke="rgba(212,175,55,0.85)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// ─── EditableField ────────────────────────────────────────────────────────────

interface EditableFieldProps {
  label: string
  value: string
  onSave: (val: string) => Promise<void>
  type?: 'text' | 'email' | 'tel'
  placeholder?: string
  mono?: boolean
  required?: boolean
  formatDisplay?: (v: string) => string
}

const EditableField = ({
  label,
  value,
  onSave,
  type = 'text',
  placeholder = '—',
  mono,
  required,
  formatDisplay,
}: EditableFieldProps) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!editing) setDraft(value) }, [value, editing])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])
  useEffect(() => {
    if (savedAt === null) return
    const t = setTimeout(() => setSavedAt(null), 2000)
    return () => clearTimeout(t)
  }, [savedAt])

  const commit = async () => {
    const trimmed = draft.trim()
    if (required && !trimmed) { setError(`${label} is required`); return }
    if (trimmed === value.trim()) { setEditing(false); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(trimmed)
      setEditing(false)
      setSavedAt(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => { setDraft(value); setEditing(false); setError(null) }
  const displayed = formatDisplay ? (value ? formatDisplay(value) : '') : value

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.fieldControl}>
        {editing ? (
          <input
            ref={inputRef}
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void commit()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); void commit() }
              if (e.key === 'Escape') cancel()
            }}
            placeholder={placeholder}
            disabled={saving}
            className={`${styles.fieldInput} ${mono ? styles.mono : ''} ${error ? styles.fieldInputError : ''}`}
            aria-label={label}
            aria-invalid={!!error}
          />
        ) : (
          <button
            className={`${styles.fieldValue} ${mono ? styles.mono : ''} ${!value ? styles.fieldValueEmpty : ''}`}
            onClick={() => setEditing(true)}
            aria-label={`Edit ${label}`}
          >
            <span>{displayed || placeholder}</span>
            <span className={styles.editPencil} aria-hidden="true">✏</span>
          </button>
        )}
        {saving && <span className={styles.fieldStatus} aria-live="polite">…</span>}
        {savedAt !== null && !saving && (
          <span className={`${styles.fieldStatus} ${styles.fieldSaved}`} aria-live="polite">✓</span>
        )}
      </div>
      {error && <p className={styles.fieldError} role="alert">{error}</p>}
    </div>
  )
}

// ─── GuardBadge ───────────────────────────────────────────────────────────────

interface Props {
  worker: Worker
  onClose: () => void
}

const GuardBadge = ({ worker, onClose }: Props) => {
  const update = useUpdateWorker()
  const toggleActive = useToggleWorkerActive()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = (data: WorkerUpdate): Promise<void> =>
    update.mutateAsync({ id: worker.id, data }).then(() => undefined)

  const isGuard = worker.worker_type === 'guard'
  const daysToExpiry = daysTil(worker.d_license?.exp)
  const certExpired = daysToExpiry !== null && daysToExpiry < 0
  const certExpiringSoon = daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 60

  return (
    <div
      className={styles.card}
      role="region"
      aria-label={`Profile: ${worker.first_name} ${worker.last_name}`}
    >
      {/* ── Chrome header band ─────────────────────────────────────────────── */}
      <header className={styles.headerBand}>
        <div className={styles.headerLeft}>
          <ShieldIcon />
          <div className={styles.headerText}>
            <span className={styles.eyebrow}>
              {isGuard ? 'Security Personnel' : 'Event Staff'}
            </span>
            <span className={styles.orgName}>Orlando Plus</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          {isGuard && worker.d_license?.number && (
            <div className={styles.licenseBlock}>
              <span className={styles.licenseLabel}>Class D</span>
              <span className={styles.licenseNum}>{worker.d_license.number}</span>
            </div>
          )}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close profile">×</button>
        </div>
      </header>

      {/* ── Body: identity col + fields col ───────────────────────────────── */}
      <div className={styles.bodyGrid}>

        {/* Left: identity (dark chrome) */}
        <div className={styles.identityCol}>
          <div className={styles.avatarRing}>
            <div className={styles.avatar} aria-hidden="true">{initials(worker)}</div>
          </div>

          <p className={styles.firstName}>{worker.first_name}</p>
          <p className={styles.lastName}>{worker.last_name}</p>

          <div className={styles.roleRow}>
            <span className={`${styles.roleChip} ${isGuard ? styles.roleGuard : styles.roleStaffer}`}>
              {isGuard ? 'Guard' : 'Staffer'}
            </span>
            {worker.is_supervisor && <span className={styles.supChip}>Supervisor</span>}
            {!worker.is_active && <span className={styles.inactiveChip}>Inactive</span>}
          </div>

          <div className={styles.capBlock}>
            <span className={styles.capDot} aria-hidden="true" />
            <div className={styles.capLines}>
              <span className={styles.capLine}>Security</span>
              {isGuard
                ? <span className={styles.capLine}>Staffing</span>
                : <span className={`${styles.capLine} ${styles.capLineDim}`}>Staffing only</span>
              }
            </div>
          </div>
        </div>

        {/* Right: editable fields (light canvas) */}
        <div className={styles.fieldsCol} role="group" aria-label="Editable profile fields">

          {/* Contact */}
          <section className={styles.section} aria-labelledby="bc-contact">
            <h3 id="bc-contact" className={styles.sectionLabel}>Contact</h3>
            <div className={styles.fieldGrid}>
              <EditableField
                label="Phone"
                value={worker.phone ?? ''}
                formatDisplay={formatPhone}
                onSave={(val) => save({ phone: val.replace(/\D/g, '') || undefined })}
                type="tel"
                placeholder="(555) 000-0000"
                mono
              />
              <EditableField
                label="Email"
                value={worker.email}
                onSave={(val) => save({ email: val })}
                type="email"
                placeholder="email@example.com"
                mono
                required
              />
              <EditableField
                label="Position"
                value={worker.position ?? ''}
                onSave={(val) => save({ position: val || undefined })}
                placeholder="e.g. Lead Guard"
              />
              <EditableField
                label="Rating"
                value={worker.rating ?? ''}
                onSave={(val) => save({ rating: val || undefined })}
                placeholder="e.g. 4/5"
              />
            </div>
          </section>

          {/* Credentials — guards only */}
          {isGuard && (
            <section className={styles.section} aria-labelledby="bc-creds">
              <h3 id="bc-creds" className={styles.sectionLabel}>Credentials</h3>
              <div className={styles.fieldGrid}>
                <EditableField
                  label="Class D #"
                  value={worker.d_license?.number ?? ''}
                  onSave={(val) =>
                    save({
                      d_license: {
                        blue_card: worker.d_license?.blue_card ?? false,
                        ...worker.d_license,
                        number: val || undefined,
                      },
                    })
                  }
                  placeholder="e.g. D1234567"
                  mono
                  required
                />
                <EditableField
                  label="D Expires"
                  value={worker.d_license?.exp ?? ''}
                  onSave={(val) =>
                    save({
                      d_license: {
                        blue_card: worker.d_license?.blue_card ?? false,
                        ...worker.d_license,
                        exp: val || undefined,
                      },
                    })
                  }
                  placeholder="YYYY-MM-DD"
                  mono
                />
              </div>
              {(certExpiringSoon || certExpired) && (
                <p
                  className={`${styles.certAlert} ${certExpired ? styles.certExpired : styles.certExpiring}`}
                  role="alert"
                >
                  {certExpired
                    ? '⚠ License has expired'
                    : `⚠ Expires in ${Math.ceil(daysToExpiry!)} days`}
                </p>
              )}
            </section>
          )}

          {/* Details */}
          <section className={styles.section} aria-labelledby="bc-details">
            <h3 id="bc-details" className={styles.sectionLabel}>Details</h3>
            <div className={styles.fieldGrid}>
              <EditableField
                label="Transportation"
                value={worker.transportation ?? ''}
                onSave={(val) => save({ transportation: val || undefined })}
                placeholder="e.g. Own car"
              />
              <EditableField
                label="Polo Size"
                value={worker.uniform?.polo?.size ?? ''}
                onSave={(val) =>
                  save({
                    uniform: {
                      ...worker.uniform,
                      polo: { has_issued: worker.uniform?.polo?.has_issued ?? false, qty: worker.uniform?.polo?.qty, size: val || undefined },
                    },
                  })
                }
                placeholder="S / M / L / XL"
              />
              <EditableField
                label="Jacket Size"
                value={worker.uniform?.jacket?.size ?? ''}
                onSave={(val) =>
                  save({
                    uniform: {
                      ...worker.uniform,
                      jacket: { has_issued: worker.uniform?.jacket?.has_issued ?? false, size: val || undefined },
                    },
                  })
                }
                placeholder="S / M / L / XL"
              />
              <EditableField
                label="Shift Start"
                value={minsToHHMM(worker.shift_pref?.start_time)}
                onSave={(val) =>
                  save({
                    shift_pref: { ...worker.shift_pref, start_time: hhmmToMins(val) },
                  })
                }
                placeholder="HH:MM"
                mono
              />
              <EditableField
                label="Shift End"
                value={minsToHHMM(worker.shift_pref?.end_time)}
                onSave={(val) =>
                  save({
                    shift_pref: { ...worker.shift_pref, end_time: hhmmToMins(val) },
                  })
                }
                placeholder="HH:MM"
                mono
              />
            </div>
          </section>
        </div>
      </div>

      {/* ── Footer: status + supervisor toggle + actions ───────────────────── */}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <div className={styles.flagRow}>
            <span className={`${styles.flag} ${worker.is_active ? styles.flagOk : styles.flagInactive}`}>
              {worker.is_active ? '● Active' : '○ Inactive'}
            </span>
            {worker.is_supervisor && (
              <span className={`${styles.flag} ${styles.flagSup}`}>◆ Supervisor</span>
            )}
            {certExpiringSoon && !certExpired && (
              <span className={`${styles.flag} ${styles.flagWarn}`}>⚠ Cert expiring</span>
            )}
            {certExpired && (
              <span className={`${styles.flag} ${styles.flagDanger}`}>✕ Cert expired</span>
            )}
          </div>
          <label className={styles.supToggle}>
            <input
              type="checkbox"
              checked={worker.is_supervisor}
              onChange={(e) => void save({ is_supervisor: e.target.checked })}
              className={styles.supCheck}
            />
            <span>Supervisor role</span>
          </label>
        </div>

        <div className={styles.footerActions}>
          {worker.is_active ? (
            <button
              className="btn btn--danger-ghost"
              disabled={toggleActive.isPending}
              onClick={() =>
                toggleActive.mutate({ id: worker.id, is_active: false }, { onSuccess: onClose })
              }
            >
              {toggleActive.isPending ? 'Deactivating…' : 'Deactivate'}
            </button>
          ) : (
            <button
              className="btn btn--success"
              disabled={toggleActive.isPending}
              onClick={() => toggleActive.mutate({ id: worker.id, is_active: true })}
            >
              {toggleActive.isPending ? 'Reactivating…' : 'Reactivate'}
            </button>
          )}
          <button className="btn btn--ghost" onClick={onClose}>Close</button>
        </div>
      </div>

      {/* ── Decorative barcode ─────────────────────────────────────────────── */}
      <div className={styles.barcodeFooter} aria-hidden="true" />
    </div>
  )
}

export default GuardBadge
