import { useState } from 'react'
import type { ColumnMapping } from '../../../types/index'
import type { DetectionResult, RequiredField } from '../utils/detectColumnMapping'
import styles from './ColumnMappingStep.module.css'

const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  name: 'Post Name',
  post_type: 'Post Type',
  date: 'Date',
  start_time: 'Start Time',
  end_time: 'End Time',
  headcount_required: 'Headcount',
  notes: 'Notes',
}

const FIELD_HINTS: Partial<Record<keyof ColumnMapping, string>> = {
  end_time: 'May be the same column as Start Time for range values like "0600–0000"',
  post_type: 'Values like "Security", "Guard", "G" or "Staffing", "Staff", "S"',
  headcount_required: 'Number of guards or staff required at this post',
}

const REQUIRED_FIELDS: RequiredField[] = [
  'name',
  'post_type',
  'date',
  'start_time',
  'end_time',
  'headcount_required',
]

interface Props {
  headers: string[]
  detection: DetectionResult
  onBack: () => void
  onContinue: (mapping: ColumnMapping) => void
}

const ColumnMappingStep = ({ headers, detection, onBack, onContinue }: Props) => {
  const [draft, setDraft] = useState<Partial<ColumnMapping>>(detection.mapping)

  const set = (field: keyof ColumnMapping, value: string) =>
    setDraft((d) => ({ ...d, [field]: value || undefined }))

  const missingRequired = REQUIRED_FIELDS.filter((f) => !draft[f])
  const canContinue = missingRequired.length === 0

  const handleContinue = () => {
    if (!canContinue) return
    onContinue(draft as ColumnMapping)
  }

  return (
    <div className={styles.root}>
      <p className={styles.description}>
        Match each required field to the corresponding column from your Excel file. Auto-detected
        columns are pre-filled — confirm or adjust as needed before continuing.
      </p>

      <div className={styles.fieldList}>
        {/* Required fields */}
        {REQUIRED_FIELDS.map((field) => {
          const wasAutoDetected = detection.mapping[field] !== undefined
          const current = draft[field] ?? ''
          const isMissing = !current

          return (
            <div
              key={field}
              className={`${styles.fieldRow} ${isMissing ? styles.fieldRowMissing : ''}`}
            >
              <div className={styles.fieldMeta}>
                <label className={styles.fieldLabel} htmlFor={`map-${field}`}>
                  {FIELD_LABELS[field]}
                  <span className={styles.requiredMark} aria-hidden>
                    *
                  </span>
                </label>
                <div className={styles.chips}>
                  {wasAutoDetected && !isMissing && (
                    <span className={styles.chipAuto}>Auto-detected</span>
                  )}
                  {isMissing && <span className={styles.chipWarn}>No match — select a column</span>}
                </div>
                {FIELD_HINTS[field] && (
                  <span className={styles.hint}>{FIELD_HINTS[field]}</span>
                )}
              </div>

              <select
                id={`map-${field}`}
                className={`${styles.select} ${isMissing ? styles.selectMissing : ''}`}
                value={current}
                onChange={(e) => set(field, e.target.value)}
                aria-required="true"
                aria-invalid={isMissing}
                aria-describedby={FIELD_HINTS[field] ? `hint-${field}` : undefined}
              >
                <option value="">— select a column —</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          )
        })}

        {/* Notes — optional */}
        <div className={`${styles.fieldRow} ${styles.fieldRowOptional}`}>
          <div className={styles.fieldMeta}>
            <label className={styles.fieldLabel} htmlFor="map-notes">
              Notes
              <span className={styles.optionalMark}>(optional)</span>
            </label>
            {detection.mapping.notes && (
              <div className={styles.chips}>
                <span className={styles.chipAuto}>Auto-detected</span>
              </div>
            )}
          </div>

          <select
            id="map-notes"
            className={styles.select}
            value={draft.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
          >
            <option value="">— none / skip —</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Unmapped columns */}
      {detection.unmappedColumns.length > 0 && (
        <details className={styles.unmapped}>
          <summary className={styles.unmappedSummary}>
            Unmapped columns ({detection.unmappedColumns.length}) — ignored during import
          </summary>
          <ul className={styles.unmappedList}>
            {detection.unmappedColumns.map((col) => (
              <li key={col} className={styles.unmappedItem}>
                {col}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Validation summary */}
      {!canContinue && (
        <p className={styles.validationSummary} role="alert">
          {missingRequired.length === 1
            ? `"${FIELD_LABELS[missingRequired[0]]}" is required — select a column above to continue.`
            : `${missingRequired.length} required fields still need a column: ${missingRequired.map((f) => FIELD_LABELS[f]).join(', ')}.`}
        </p>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <button className="btn btn--ghost" onClick={onBack}>
          ← Back
        </button>
        <button className="btn btn--primary" onClick={handleContinue} disabled={!canContinue}>
          Continue →
        </button>
      </div>
    </div>
  )
}

export default ColumnMappingStep
