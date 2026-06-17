import { useState, useRef } from 'react'
import { parseWorkbook } from '../utils/parseExcel'
import type { ParsedWorkbook } from '../utils/parseExcel'
import styles from './FileUploadStep.module.css'

const MAX_BYTES = 10 * 1024 * 1024
const ACCEPTED_EXTS = ['xlsx', 'xls']
const PREVIEW_LIMIT = 30

interface Props {
  parsedWorkbook: ParsedWorkbook | null
  selectedSheetIndex: number
  fileName: string | null
  onParsed: (wb: ParsedWorkbook, name: string) => void
  onSheetChange: (idx: number) => void
  onBack: () => void
  onContinue: () => void
}

const FileUploadStep = ({
  parsedWorkbook,
  selectedSheetIndex,
  fileName,
  onParsed,
  onSheetChange,
  onBack,
  onContinue,
}: Props) => {
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    setError(null)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ACCEPTED_EXTS.includes(ext)) {
      setError('Unsupported file type. Please upload a .xlsx or .xls file.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('File exceeds the 10 MB limit. Please upload a smaller file.')
      return
    }
    setParsing(true)
    try {
      const wb = await parseWorkbook(file)
      onParsed(wb, file.name)
    } catch {
      setError('Could not parse the file. Make sure it is a valid Excel workbook.')
    } finally {
      setParsing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset so the same file can be re-selected after clearing
    e.target.value = ''
  }

  const hasFile = parsedWorkbook !== null && !parsing

  const zoneClass = [
    styles.zone,
    dragging && styles.zoneDragging,
    error && styles.zoneError,
    hasFile && !error && styles.zoneHasFile,
  ]
    .filter(Boolean)
    .join(' ')

  // Preview data
  const rows = hasFile ? parsedWorkbook.sheets[selectedSheetIndex] : []
  const previewRows = rows.slice(0, PREVIEW_LIMIT)
  const columns = previewRows.length > 0 ? Object.keys(previewRows[0]) : []
  const multipleSheets = parsedWorkbook && parsedWorkbook.sheetNames.length > 1

  return (
    <div className={styles.root}>
      {/* Drop zone */}
      <div
        className={zoneClass}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload Excel file"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className={styles.fileInput}
          onChange={handleFileInput}
          tabIndex={-1}
          aria-hidden
        />

        {parsing ? (
          <>
            <span className={styles.zoneIcon}>⏳</span>
            <span className={styles.zoneParsing}>Parsing workbook…</span>
          </>
        ) : hasFile && !error ? (
          <>
            <span className={styles.zoneIcon}>✓</span>
            <span className={styles.fileName}>{fileName}</span>
            <span className={styles.zoneHint}>Click or drop a new file to replace</span>
          </>
        ) : (
          <>
            <span className={styles.zoneIcon}>⬆</span>
            <span className={styles.zoneTitle}>Drag & drop your buy order here</span>
            <span className={styles.zoneHint}>.xlsx / .xls · Max 10 MB · or click to browse</span>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className={styles.error} role="alert">
          ⚠ {error}
        </p>
      )}

      {/* Sheet selector (only shown when workbook has multiple sheets) */}
      {hasFile && multipleSheets && (
        <div className={styles.sheetSection}>
          <span className={styles.sectionLabel}>Select Sheet</span>
          <div className={styles.sheetTabs} role="tablist" aria-label="Worksheet tabs">
            {parsedWorkbook.sheetNames.map((name, idx) => (
              <button
                key={name}
                role="tab"
                aria-selected={idx === selectedSheetIndex}
                className={`${styles.sheetTab} ${idx === selectedSheetIndex ? styles.sheetTabActive : ''}`}
                onClick={() => onSheetChange(idx)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview table */}
      {hasFile && previewRows.length > 0 && (
        <div className={styles.previewSection}>
          <span className={styles.sectionLabel}>
            Preview
            <span className={styles.previewMeta} style={{ fontFamily: 'var(--font-ui)', textTransform: 'none', letterSpacing: 0 }}>
              {' '}— showing {previewRows.length} of {rows.length} row{rows.length !== 1 ? 's' : ''}
              {rows.length > PREVIEW_LIMIT && ` (first ${PREVIEW_LIMIT} displayed)`}
            </span>
          </span>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.rowNum}>#</th>
                  {columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i}>
                    <td className={`${styles.rowNum} ${styles.nullCell}`}>{i + 2}</td>
                    {columns.map((col) => {
                      const val = row[col]
                      return (
                        <td key={col}>
                          {val === null || val === undefined ? (
                            <span className={styles.nullCell}>—</span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <button className="btn btn--ghost" onClick={onBack}>
          ← Back
        </button>
        <button
          className="btn btn--primary"
          onClick={onContinue}
          disabled={!hasFile}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

export default FileUploadStep
