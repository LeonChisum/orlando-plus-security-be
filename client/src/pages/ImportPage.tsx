import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useShow } from '../features/shows/hooks/useShows'
import FileUploadStep from '../features/imports/components/FileUploadStep'
import ColumnMappingStep from '../features/imports/components/ColumnMappingStep'
import HallTagStep from '../features/imports/components/HallTagStep'
import ReviewConfirmStep from '../features/imports/components/ReviewConfirmStep'
import type { ParsedWorkbook } from '../features/imports/utils/parseExcel'
import { extractPostRows } from '../features/imports/utils/parseExcel'
import { detectMapping } from '../features/imports/utils/detectColumnMapping'
import type { DetectionResult } from '../features/imports/utils/detectColumnMapping'
import type { ColumnMapping, MappedPostRow, PendingHall, ImportSession } from '../types/index'
import Loader from '../components/Loader'
import styles from './ImportPage.module.css'

type Step = 1 | 2 | 3 | 4

const STEPS: { label: string }[] = [
  { label: 'Upload' },
  { label: 'Map Columns' },
  { label: 'Tag Halls' },
  { label: 'Review' },
]

const STEP_LABELS: Record<Step, string> = {
  1: 'Upload',
  2: 'Map Columns',
  3: 'Tag Halls',
  4: 'Review & Confirm',
}

function sessionKey(showId: string) {
  return `ops_import_${showId}`
}

function readSession(showId: string | undefined): ImportSession | null {
  if (!showId) return null
  try {
    const raw = sessionStorage.getItem(sessionKey(showId))
    if (raw) {
      const s = JSON.parse(raw) as ImportSession
      if (s.showId === showId) return s
    }
  } catch {
    if (showId) sessionStorage.removeItem(sessionKey(showId))
  }
  return null
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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

// ─── Session prompt ───────────────────────────────────────────────────────────

interface SessionPromptProps {
  session: ImportSession
  onResume: () => void
  onFresh: () => void
}

const SessionPrompt = ({ session, onResume, onFresh }: SessionPromptProps) => (
  <div className={styles.sessionPrompt} role="alert">
    <div className={styles.sessionPromptIcon} aria-hidden>◷</div>
    <div className={styles.sessionPromptBody}>
      <p className={styles.sessionPromptTitle}>Previous import session found</p>
      <p className={styles.sessionPromptMeta}>
        {session.fileName ?? 'Unknown file'}
        {session.fileSize !== null && ` · ${formatBytes(session.fileSize)}`}
        {' · Paused at Step '}
        {session.step} — {STEP_LABELS[session.step as Step]}
      </p>
    </div>
    <div className={styles.sessionPromptActions}>
      <button className="btn btn--primary" onClick={onResume}>
        Resume
      </button>
      <button className="btn btn--ghost" onClick={onFresh}>
        Start fresh
      </button>
    </div>
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
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [detection, setDetection] = useState<DetectionResult | null>(null)
  const [mappedPosts, setMappedPosts] = useState<MappedPostRow[]>([])
  const [pendingHalls, setPendingHalls] = useState<PendingHall[]>([])
  const [skippedEmptyCount, setSkippedEmptyCount] = useState(0)

  // Populated synchronously from sessionStorage so there's no flash of the wizard
  const [savedSession, setSavedSession] = useState<ImportSession | null>(() => readSession(id))
  // False while user still needs to make a resume/fresh choice
  const [sessionResolved, setSessionResolved] = useState<boolean>(() => readSession(id) === null)

  const showDetailPath = `/shows/${id}`

  // Persist session whenever meaningful state changes, but only after the user
  // has resolved any existing session (avoids overwriting a good session before they choose)
  useEffect(() => {
    if (!id || !sessionResolved) return
    if (step === 1 && !fileName) return
    const session: ImportSession = {
      showId: id,
      step,
      fileName,
      fileSize,
      skippedEmptyCount,
      mappedPosts,
      pendingHalls,
    }
    sessionStorage.setItem(sessionKey(id), JSON.stringify(session))
  }, [step, fileName, fileSize, mappedPosts, pendingHalls, skippedEmptyCount, id, sessionResolved])

  const clearSession = () => {
    if (id) sessionStorage.removeItem(sessionKey(id))
  }

  const handleResume = () => {
    if (!savedSession) return
    setMappedPosts(savedSession.mappedPosts)
    setPendingHalls(savedSession.pendingHalls)
    setSkippedEmptyCount(savedSession.skippedEmptyCount)
    setFileName(savedSession.fileName)
    setFileSize(savedSession.fileSize)
    // Jump to the saved step if posts are available; otherwise start at Upload
    // (steps 1–2 require the File object which can't be serialized)
    const target: Step =
      savedSession.step >= 3 && savedSession.mappedPosts.length > 0
        ? (savedSession.step as Step)
        : 1
    setStep(target)
    setSavedSession(null)
    setSessionResolved(true)
  }

  const handleStartFresh = () => {
    clearSession()
    setSavedSession(null)
    setSessionResolved(true)
  }

  if (isLoading) return <Loader />

  const handleParsed = (wb: ParsedWorkbook, name: string, size: number) => {
    setParsedWorkbook(wb)
    setFileName(name)
    setFileSize(size)
    setSelectedSheetIndex(0)
    setDetection(null)
    setMappedPosts([])
    setPendingHalls([])
  }

  const handleSheetChange = (idx: number) => {
    setSelectedSheetIndex(idx)
    setDetection(null)
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
      const { posts, skippedEmptyCount: count } = extractPostRows(rawRows, mapping)
      setMappedPosts(posts)
      setSkippedEmptyCount(count)
      setPendingHalls([])
      setStep(3)
    } else {
      setStep(2)
    }
  }

  const handleStep2Continue = (mapping: ColumnMapping) => {
    if (!parsedWorkbook) return
    const rawRows = parsedWorkbook.sheets[selectedSheetIndex]
    const { posts, skippedEmptyCount: count } = extractPostRows(rawRows, mapping)
    setMappedPosts(posts)
    setSkippedEmptyCount(count)
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
      setStep(2)
    } else {
      setStep(3)
    }
  }

  const handleSuccess = () => {
    clearSession()
    navigate(showDetailPath)
  }

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

      {/* Session prompt — shown in place of wizard until user makes a choice */}
      {savedSession ? (
        <SessionPrompt
          session={savedSession}
          onResume={handleResume}
          onFresh={handleStartFresh}
        />
      ) : (
        <>
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

            {step === 4 && id && (
              <>
                <h2 className={styles.stepHeading}>Step 4 — Review & Confirm</h2>
                <ReviewConfirmStep
                  showId={id}
                  posts={mappedPosts}
                  pendingHalls={pendingHalls}
                  skippedEmptyCount={skippedEmptyCount}
                  onBack={handleBack}
                  onSuccess={handleSuccess}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ImportPage
