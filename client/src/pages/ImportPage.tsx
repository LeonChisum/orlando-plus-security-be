import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useShow } from '../features/shows/hooks/useShows'
import FileUploadStep from '../features/imports/components/FileUploadStep'
import type { ParsedWorkbook } from '../features/imports/utils/parseExcel'
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

  const showDetailPath = `/shows/${id}`

  if (isLoading) return <Loader />

  const handleParsed = (wb: ParsedWorkbook, name: string) => {
    setParsedWorkbook(wb)
    setFileName(name)
    setSelectedSheetIndex(0)
  }

  const handleBack = () => {
    if (step === 1) {
      navigate(showDetailPath)
    } else {
      setStep((s) => (s - 1) as Step)
    }
  }

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
              onSheetChange={setSelectedSheetIndex}
              onBack={handleBack}
              onContinue={() => setStep(2)}
            />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className={styles.stepHeading}>Step 2 — Map Columns</h2>
            <div className={styles.placeholder}>
              <span className={styles.placeholderIcon}>🗂</span>
              <p className={styles.placeholderTitle}>Column mapping</p>
              <p className={styles.placeholderSub}>
                Tell us which Excel columns correspond to post name, date, times, and headcount.
                <br />
                Coming in ticket 2.3.
              </p>
            </div>
            <div className={styles.placeholderFooter}>
              <button className="btn btn--ghost" onClick={handleBack}>
                ← Back
              </button>
            </div>
          </>
        )}

        {step === 3 && (
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
            </div>
            <div className={styles.placeholderFooter}>
              <button className="btn btn--ghost" onClick={handleBack}>
                ← Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ImportPage
