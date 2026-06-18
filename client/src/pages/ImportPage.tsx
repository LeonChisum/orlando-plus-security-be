import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useShow } from '../features/shows/hooks/useShows'
import FileUploadStep from '../features/imports/components/FileUploadStep'
import ColumnMappingStep from '../features/imports/components/ColumnMappingStep'
import type { ParsedWorkbook } from '../features/imports/utils/parseExcel'
import { detectMapping } from '../features/imports/utils/detectColumnMapping'
import type { DetectionResult } from '../features/imports/utils/detectColumnMapping'
import type { ColumnMapping } from '../types/index'
import Loader from '../components/Loader'
import styles from './ImportPage.module.css'

type Step = 1 | 2 | 3

const STEPS: { label: string }[] = [
  { label: 'Upload' },
  { label: 'Map Columns' },
  { label: 'Review' },
]

// ─── Stepper ─────────────────────────────────────────────────────────────────

interface StepperProps {
  current: Step
}

const Stepper = ({ current }: StepperProps) => (
  <div className={styles.stepper} role="list" aria-label="Import steps">
    {STEPS.map((s, idx) => {
      const num = (idx + 1) as Step
      const isActive = num === current
      const isDone = num < current
      return (
        <div key={s.label} className={styles.stepItem} role="listitem">
          <div
            className={`${styles.stepCircle} ${isActive ? styles.stepCircleActive : ''} ${isDone ? styles.stepCircleDone : ''}`}
            aria-current={isActive ? 'step' : undefined}
          >
            {isDone ? '✓' : num}
          </div>
          <span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''}`}>
            {s.label}
          </span>
          {idx < STEPS.length - 1 && (
            <div className={`${styles.stepConnector} ${isDone ? styles.stepConnectorDone : ''}`} />
          )}
        </div>
      )
    })}
  </div>
)

// ─── Main page ────────────────────────────────────────────────────────────────

const ImportPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: show, isLoading } = useShow(id ?? '')

  const [step, setStep] = useState<Step>(1)
  const [parsedWorkbook, setParsedWorkbook] = useState<ParsedWorkbook | null>(null)
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0)
  const [fileName, setFileName] = useState<string | null>(null)
  const [detection, setDetection] = useState<DetectionResult | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null)

  const showDetailPath = `/shows/${id}`

  if (isLoading) return <Loader />

  const handleParsed = (wb: ParsedWorkbook, name: string) => {
    setParsedWorkbook(wb)
    setFileName(name)
    setSelectedSheetIndex(0)
    // Reset downstream state when a new file is loaded
    setDetection(null)
    setColumnMapping(null)
  }

  const handleSheetChange = (idx: number) => {
    setSelectedSheetIndex(idx)
    // Reset mapping when the sheet changes — columns may differ
    setDetection(null)
    setColumnMapping(null)
  }

  const handleStep1Continue = () => {
    if (!parsedWorkbook) return
    const rows = parsedWorkbook.sheets[selectedSheetIndex]
    const headers = rows.length > 0 ? Object.keys(rows[0]) : []
    const result = detectMapping(headers)
    setDetection(result)

    if (result.confidence === 'high') {
      setColumnMapping(result.mapping as ColumnMapping)
      setStep(3)
    } else {
      setStep(2)
    }
  }

  const handleStep2Continue = (mapping: ColumnMapping) => {
    setColumnMapping(mapping)
    setStep(3)
  }

  const handleBack = () => {
    if (step === 1) {
      navigate(showDetailPath)
    } else if (step === 2) {
      setStep(1)
    } else {
      // From step 3, always go to step 2 so mapping can be reviewed/edited
      setStep(2)
    }
  }

  // Headers for the currently selected sheet (used by ColumnMappingStep)
  const currentHeaders =
    parsedWorkbook && parsedWorkbook.sheets[selectedSheetIndex]?.length > 0
      ? Object.keys(parsedWorkbook.sheets[selectedSheetIndex][0])
      : []

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={`btn btn--ghost ${styles.back}`} onClick={() => navigate(showDetailPath)}>
          ← {show?.name ?? 'Show'}
        </button>
        <h1 className={styles.title}>Import Buy Order</h1>
        {show && (
          <p className={styles.subtitle}>
            {show.client_name} · {show.venue} · {show.start_date}
            {show.start_date !== show.end_date ? ` – ${show.end_date}` : ''}
          </p>
        )}
      </div>

      {/* Stepper */}
      <Stepper current={step} />

      {/* Step body */}
      <div className={styles.body}>
        {step === 1 && (
          <>
            <h2 className={styles.stepHeading}>Step 1 — Upload File</h2>
            <FileUploadStep
              parsedWorkbook={parsedWorkbook}
              selectedSheetIndex={selectedSheetIndex}
              fileName={fileName}
              onParsed={handleParsed}
              onSheetChange={handleSheetChange}
              onBack={handleBack}
              onContinue={handleStep1Continue}
            />
          </>
        )}

        {step === 2 && detection && (
          <>
            <h2 className={styles.stepHeading}>Step 2 — Map Columns</h2>
            <ColumnMappingStep
              headers={currentHeaders}
              detection={detection}
              onBack={handleBack}
              onContinue={handleStep2Continue}
            />
          </>
        )}

        {step === 3 && columnMapping && (
          <>
            <h2 className={styles.stepHeading}>Step 3 — Review & Confirm</h2>
            <div className={styles.placeholder}>
              <span className={styles.placeholderIcon}>✅</span>
              <p className={styles.placeholderTitle}>Review import</p>
              <p className={styles.placeholderSub}>
                Validate rows, tag halls, and confirm before writing to the database.
                <br />
                Coming in ticket 2.5.
              </p>
              <div className={styles.mappingSummary}>
                <span className={styles.mappingSummaryLabel}>Active column mapping</span>
                <dl className={styles.mappingList}>
                  {(Object.entries(columnMapping) as [string, string][]).map(([field, col]) => (
                    <div key={field} className={styles.mappingEntry}>
                      <dt className={styles.mappingField}>{field}</dt>
                      <dd className={styles.mappingCol}>{col}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            <div className={styles.placeholderFooter}>
              <button className="btn btn--ghost" onClick={handleBack}>
                ← Back
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => setStep(2)}
                style={{ marginLeft: 'auto' }}
              >
                Edit Column Mapping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ImportPage
