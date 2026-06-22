import { useState, useMemo, useRef, useEffect } from 'react'
import type { MappedPostRow, Hall, PendingHall } from '../../../types/index'
import { useHalls } from '../hooks/useHalls'
import styles from './HallTagStep.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = 'name' | 'post_type' | 'date' | 'hall_id'

// ─── SortHeader ───────────────────────────────────────────────────────────────

interface SortHeaderProps {
  field: SortField
  active: boolean
  dir: 'asc' | 'desc'
  onClick: (field: SortField) => void
  children: React.ReactNode
}

const SortHeader = ({ field, active, dir, onClick, children }: SortHeaderProps) => (
  <th
    className={`${styles.th} ${active ? styles.thActive : ''}`}
    onClick={() => onClick(field)}
    aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
  >
    <span className={styles.thInner}>
      {children}
      <span className={styles.sortIcon} aria-hidden="true">
        {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </span>
  </th>
)

// ─── HallDropCell ─────────────────────────────────────────────────────────────

interface HallDropCellProps {
  hallId: string | null
  halls: Hall[]
  pendingHalls: PendingHall[]
  onChange: (hallId: string | null) => void
  onAddPendingHall: (name: string) => string
}

const HallDropCell = ({
  hallId,
  halls,
  pendingHalls,
  onChange,
  onAddPendingHall,
}: HallDropCellProps) => {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (creating) inputRef.current?.focus()
  }, [creating])

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__new__') {
      setCreating(true)
      setNewName('')
    } else {
      onChange(e.target.value || null)
    }
  }

  const handleConfirm = () => {
    const name = newName.trim()
    if (!name) {
      setCreating(false)
      return
    }
    const tempId = onAddPendingHall(name)
    onChange(tempId)
    setCreating(false)
    setNewName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
    if (e.key === 'Escape') {
      setCreating(false)
      setNewName('')
    }
  }

  if (creating) {
    return (
      <div className={styles.newHallInput}>
        <input
          ref={inputRef}
          className={styles.newHallField}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hall name..."
          maxLength={100}
          aria-label="New hall name"
        />
        <button
          className={styles.newHallConfirm}
          onClick={handleConfirm}
          type="button"
          aria-label="Confirm hall name"
        >
          ✓
        </button>
        <button
          className={styles.newHallCancel}
          onClick={() => {
            setCreating(false)
            setNewName('')
          }}
          type="button"
          aria-label="Cancel"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <select
      className={`${styles.hallSelect} ${!hallId ? styles.hallSelectEmpty : ''}`}
      value={hallId ?? ''}
      onChange={handleSelectChange}
      aria-label="Assign hall"
    >
      <option value="">— select hall —</option>
      {halls.map((h) => (
        <option key={h.id} value={h.id}>
          {h.name}
        </option>
      ))}
      {pendingHalls.map((ph) => (
        <option key={ph.tempId} value={ph.tempId}>
          {ph.name} (new)
        </option>
      ))}
      <option value="__new__">+ New Hall...</option>
    </select>
  )
}

// ─── HallTagStep ──────────────────────────────────────────────────────────────

interface Props {
  showId: string
  initialPosts: MappedPostRow[]
  initialPendingHalls: PendingHall[]
  onBack: () => void
  onContinue: (posts: MappedPostRow[], pendingHalls: PendingHall[]) => void
}

const HallTagStep = ({
  showId,
  initialPosts,
  initialPendingHalls,
  onBack,
  onContinue,
}: Props) => {
  const { data: dbHalls = [] } = useHalls(showId)

  const [rows, setRows] = useState<MappedPostRow[]>(initialPosts)
  const [pendingHalls, setPendingHalls] = useState<PendingHall[]>(initialPendingHalls)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [bulkHallId, setBulkHallId] = useState('')

  // ── Derived counts ──────────────────────────────────────────────────────────
  const total = rows.length
  const security = rows.filter((r) => r.post_type === 'security').length
  const staffing = rows.filter((r) => r.post_type === 'staffing').length
  const untagged = rows.filter((r) => !r.hall_id).length
  const canContinue = untagged === 0

  // Combined hall list for sort lookups and dropdowns
  const allHallsFlat = useMemo(
    () => [
      ...dbHalls.map((h) => ({ id: h.id, name: h.name })),
      ...pendingHalls.map((ph) => ({ id: ph.tempId, name: ph.name })),
    ],
    [dbHalls, pendingHalls],
  )

  // ── Sorted rows ─────────────────────────────────────────────────────────────
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let aVal = ''
      let bVal = ''
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'post_type':
          aVal = a.post_type
          bVal = b.post_type
          break
        case 'date':
          aVal = a.date
          bVal = b.date
          break
        case 'hall_id':
          aVal = allHallsFlat.find((h) => h.id === a.hall_id)?.name.toLowerCase() ?? ''
          bVal = allHallsFlat.find((h) => h.id === b.hall_id)?.name.toLowerCase() ?? ''
          break
      }
      const cmp = aVal.localeCompare(bVal)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rows, sortField, sortDir, allHallsFlat])

  const allSelected =
    sortedRows.length > 0 && sortedRows.every((r) => selected.has(r.rawIndex))
  const someSelected = sortedRows.some((r) => selected.has(r.rawIndex))
  const selectedCount = sortedRows.filter((r) => selected.has(r.rawIndex)).length

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const handleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sortedRows.map((r) => r.rawIndex)))
    }
  }

  const handleSelectRow = (rawIndex: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(rawIndex)
      else next.delete(rawIndex)
      return next
    })
  }

  const handleAssignHall = (rawIndex: number, hallId: string | null) => {
    setRows((prev) =>
      prev.map((row) =>
        row.rawIndex === rawIndex ? { ...row, hall_id: hallId } : row,
      ),
    )
  }

  const handleAddPendingHall = (name: string): string => {
    const trimmed = name.trim()
    const existing = pendingHalls.find(
      (ph) => ph.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (existing) return existing.tempId
    const tempId = crypto.randomUUID()
    setPendingHalls((prev) => [...prev, { tempId, name: trimmed, floor_level: null }])
    return tempId
  }

  const handleBulkAssign = () => {
    if (!bulkHallId) return
    setRows((prev) =>
      prev.map((row) =>
        selected.has(row.rawIndex) ? { ...row, hall_id: bulkHallId } : row,
      ),
    )
    setSelected(new Set())
    setBulkHallId('')
  }

  const handleContinue = () => {
    if (!canContinue) return
    onContinue(rows, pendingHalls)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={styles.root}>
      {/* Summary bar */}
      <div className={styles.summary}>
        <span className={styles.summaryItem}>
          <strong>{total}</strong> posts
        </span>
        <span className={styles.summarySep} aria-hidden="true">·</span>
        <span className={styles.summaryItem}>
          <strong>{security}</strong> security
        </span>
        <span className={styles.summarySep} aria-hidden="true">·</span>
        <span className={styles.summaryItem}>
          <strong>{staffing}</strong> staffing
        </span>
        {untagged > 0 && (
          <>
            <span className={styles.summarySep} aria-hidden="true">·</span>
            <span className={styles.summaryUntagged} role="status">
              ⚠ <strong>{untagged}</strong> untagged
            </span>
          </>
        )}
        {untagged === 0 && total > 0 && (
          <>
            <span className={styles.summarySep} aria-hidden="true">·</span>
            <span className={styles.summaryAllTagged} role="status">
              ✓ all tagged
            </span>
          </>
        )}
      </div>

      {/* Bulk assign toolbar */}
      {someSelected && (
        <div className={styles.toolbar} role="toolbar" aria-label="Bulk assign toolbar">
          <span className={styles.toolbarCount}>
            {selectedCount} {selectedCount === 1 ? 'row' : 'rows'} selected
          </span>
          <label htmlFor="bulk-hall-select" className={styles.toolbarLabel}>
            Assign to:
          </label>
          <select
            id="bulk-hall-select"
            className={styles.toolbarSelect}
            value={bulkHallId}
            onChange={(e) => setBulkHallId(e.target.value)}
            aria-label="Hall for bulk assignment"
          >
            <option value="">— pick a hall —</option>
            {dbHalls.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
            {pendingHalls.map((ph) => (
              <option key={ph.tempId} value={ph.tempId}>
                {ph.name} (new)
              </option>
            ))}
          </select>
          <button
            className="btn btn--primary"
            onClick={handleBulkAssign}
            disabled={!bulkHallId}
            type="button"
          >
            Assign
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => setSelected(new Set())}
            type="button"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrap} role="region" aria-label="Posts to tag">
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thCheck} scope="col">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected
                  }}
                  onChange={handleSelectAll}
                  aria-label="Select all rows"
                  className={styles.checkbox}
                />
              </th>
              <SortHeader field="name" active={sortField === 'name'} dir={sortDir} onClick={handleSort}>
                Post Name
              </SortHeader>
              <SortHeader field="post_type" active={sortField === 'post_type'} dir={sortDir} onClick={handleSort}>
                Type
              </SortHeader>
              <SortHeader field="date" active={sortField === 'date'} dir={sortDir} onClick={handleSort}>
                Date
              </SortHeader>
              <th className={styles.th} scope="col">Start – End</th>
              <th className={styles.thNum} scope="col">#</th>
              <SortHeader field="hall_id" active={sortField === 'hall_id'} dir={sortDir} onClick={handleSort}>
                Hall
              </SortHeader>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const isSelected = selected.has(row.rawIndex)
              const isUntagged = !row.hall_id
              return (
                <tr
                  key={row.rawIndex}
                  className={`${styles.tr} ${isUntagged ? styles.trUntagged : ''} ${isSelected ? styles.trSelected : ''}`}
                >
                  <td className={styles.tdCheck}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectRow(row.rawIndex, e.target.checked)}
                      aria-label={`Select ${row.name}`}
                      className={styles.checkbox}
                    />
                  </td>
                  <td className={styles.tdName}>{row.name}</td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.typeBadge} ${
                        row.post_type === 'security' ? styles.typeSecurity : styles.typeStaffing
                      }`}
                    >
                      {row.post_type === 'security' ? 'SEC' : 'STAFF'}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.tdMono}`}>{row.date}</td>
                  <td className={`${styles.td} ${styles.tdMono}`}>
                    {row.start_time}–{row.end_time}
                  </td>
                  <td className={`${styles.tdNum} ${styles.tdMono}`}>
                    {row.headcount_required}
                  </td>
                  <td className={styles.tdHall}>
                    <HallDropCell
                      hallId={row.hall_id}
                      halls={dbHalls}
                      pendingHalls={pendingHalls}
                      onChange={(id) => handleAssignHall(row.rawIndex, id)}
                      onAddPendingHall={handleAddPendingHall}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Validation message */}
      {!canContinue && (
        <p className={styles.validationMsg} role="alert">
          {untagged === 1
            ? '1 post still needs a hall assigned before you can continue.'
            : `${untagged} posts still need a hall assigned before you can continue.`}
        </p>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <button className="btn btn--ghost" onClick={onBack} type="button">
          ← Back
        </button>
        <button
          className="btn btn--primary"
          onClick={handleContinue}
          disabled={!canContinue}
          type="button"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

export default HallTagStep
