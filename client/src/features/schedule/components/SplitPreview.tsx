import { useMemo } from 'react'
import type { Post } from '../../../types/index'
import { suggestStrategy, splitPostIntoShifts } from '../utils/splitPostIntoShifts'
import styles from './SplitPreview.module.css'

const STRATEGY_LABELS: Record<string, string> = {
  single: '1 shift',
  equal_halves: '2 shifts · equal halves',
  equal_thirds: '3 shifts · equal thirds',
}

interface SplitPreviewProps {
  post: Post
  onConfirm: (post: Post) => void
}

export default function SplitPreview({ post, onConfirm }: SplitPreviewProps) {
  const strategy = useMemo(() => suggestStrategy(post), [post])
  const shifts = useMemo(() => splitPostIntoShifts(post, strategy), [post, strategy])

  return (
    <div className={styles.root}>
      <span className={styles.badge}>{STRATEGY_LABELS[strategy]}</span>
      <div className={styles.times}>
        {shifts.map((s, i) => (
          <span key={i} className={styles.timeRange}>
            {s.start_time}–{s.end_time}
          </span>
        ))}
      </div>
      <button className={styles.confirmBtn} onClick={() => onConfirm(post)}>
        Confirm splits
      </button>
    </div>
  )
}
