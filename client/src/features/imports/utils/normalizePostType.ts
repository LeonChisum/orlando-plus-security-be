import type { PostType } from '../../../types/index'

const SECURITY = new Set(['security', 'guard', 'sec', 'g'])
const STAFFING = new Set(['staffing', 'staff', 'staffer', 's'])

export function normalizePostType(raw: string): PostType | null {
  const n = raw.trim().toLowerCase()
  if (SECURITY.has(n)) return 'security'
  if (STAFFING.has(n)) return 'staffing'
  return null
}
