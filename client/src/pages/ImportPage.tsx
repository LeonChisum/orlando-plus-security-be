import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useShow } from '../features/shows/hooks/useShows'
import FileUploadStep from '../features/imports/components/FileUploadStep'
import ColumnMappingStep from '../features/imports/components/ColumnMappingStep'
import HallTagStep from '../features/imports/components/HallTagStep'
import type { ParsedWorkbook, } from '../features/imports/utils/parseExcel'
import { extractPostRows } from '../features/imports/utils/parseExcel'
import { detectMapping } from '../features/imports/utils/detectColumnMapping'
import type { DetectionResult } from '../features/imports/utils/detectColumnMapping'
import type { ColumnMapping, MappedPostRow, PendingHall } from '../types/index'
import Loader from '../components/Loader'
import styles from './ImportPage.module.css'

type Step = 1 | 2 | 3 | 4

const STEPS: { label: string }[] = [
  { label: 'Upload' },
  { label: 'Map Columns' },
  { label: 'Tag Halls' },
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
  const [mappedPosts, setMappedPosts] = useState<MappedPostRow[]>([])
  const [pendingHalls, setPendingHalls] = useState<PendingHall[]>([])

  const showDetailPath = `/shows/${id}`

  if (isLoading) return <Loader />

  const handleParsed = (wb: ParsedWorkbook, name: string) => {
    setParsedWorkbook(wb)
    setFileName(name)
    setSelectedSheetIndex(0)
    setDetection(null)
    setColumnMapping(null)
    setMappedPosts([])
    setPendingHalls([])
  }

  const handleSheetChange = (idx: number) => {
    setSelectedSheetIndex(idx)
    setDetection(null)
    setColumnMapping(null)
    setMappedPosts([])
    setPendingHalls([])
  }

  const handleStep1Continue = () => {
    if (!parsedWorkbook) return
    const rawRows = parsedWorkbook.sheets[selectedSheetIndex]
    const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : []
    const result = detectMapping(headers)
    setDetection(result)

    if (result.confidence === 'high') {
      const mapping = result.mapping as ColumnMapping
      setColumnMapping(mapping)
      const posts = extractPostRows(rawRows, mapping)
      setMappedPosts(posts)
      setPendingHalls([])
      setStep(3)
    } else {
      setStep(2)
    }
  }

  const handleStep2Continue = (mapping: ColumnMapping) => {
    setColumnMapping(mapping)
    if (!parsedWorkbook) return
    const rawRows = parsedWorkbook.sheets[selectedSheetIndex]
    const posts = extractPostRows(rawRows, mapping)
    setMappedPosts(posts)
    setPendingHalls([])
    setStep(3)
  }

  const handleStep3Continue = (posts: MappedPostRow[], halls: PendingHall[]) => {
    setMappedPosts(posts)
    setPendingHalls(halls)
    setStep(4)
  }

  const handleBack = () => {
    if (step === 1) {
      navigate(showDetailPath)
    } else if (step === 2) {
      setStep(1)
    } else if (step === 3) {
      // Go back to column mapping so it can be reviewed / adjusted
      setStep(2)
    } else {
      setStep(3)
    }
  }

  // Headers for the currently selected sheet
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

        {step === 3 && id && (
          <>
            <h2 className={styles.stepHeading}>Step 3 — Tag Halls</h2>
            <HallTagStep
              showId={id}
              initialPosts={mappedPosts}
              initialPendingHalls={pendingHalls}
              onBack={handleBack}
              onContinue={handleStep3Continue}
            />
          </>
        )}

        {step === 4 && columnMapping && (
          <>
            <h2 className={styles.stepHeading}>Step 4 — Review & Confirm</h2>
            <div className={styles.placeholder}>
              <span className={styles.placeholderIcon}>✅</span>
              <p className={styles.placeholderTitle}>Review import</p>
              <p className={styles.placeholderSub}>
                Validate rows and confirm before writing to the database.
                <br />
                Coming in ticket 2.5.
              </p>
              <div className={styles.mappingSummary}>
                <span className={styles.mappingSummaryLabel}>
                  {mappedPosts.length} posts · {pendingHalls.length} new{' '}
                  {pendingHalls.length === 1 ? 'hall' : 'halls'} pending
                </span>
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
