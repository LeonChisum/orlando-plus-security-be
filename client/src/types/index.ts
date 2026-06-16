// ─── Auth ────────────────────────────────────────────────────────────────────

export interface Admin {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

// ─── Workers ─────────────────────────────────────────────────────────────────

export type WorkerRole = 'guard' | 'staffer'
export type WorkerStatus = 'active' | 'inactive'

export interface Worker {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: WorkerRole
  status: WorkerStatus
  ssn?: string
  birthDate?: string
  startDate?: string
  dLicense?: { blueCard: boolean; number?: string; exp?: string }
  gLicense?: { activeLicense: boolean; number?: string; exp?: string }
  ccw?: { activeLicense: boolean; number?: string; exp?: string }
  uniform?: {
    polo?: { hasIssued: boolean; size?: string; qty?: number }
    jacket?: { hasIssued: boolean; size?: string }
  }
  badge?: { hasIssued: boolean; barcode?: string }
  position?: string
  rating?: string
  shiftPref?: { startTime?: number; endTime?: number }
  transportation?: string
  emergencyContact?: { name?: string; phone?: string; relation?: string }
  createdAt: string
  updatedAt: string
}

export type WorkerInsert = Omit<Worker, 'id' | 'createdAt' | 'updatedAt'>
export type WorkerUpdate = Partial<WorkerInsert>

// ─── Shows ────────────────────────────────────────────────────────────────────

export interface Show {
  id: string
  name: string
  location: string
  moveIn: string
  showDayStart: string
  showDayEnd: string
  moveOut: string
  confirmed?: number
  pending?: number
  createdAt: string
  updatedAt: string
}

export type ShowInsert = Omit<Show, 'id' | 'createdAt' | 'updatedAt'>
export type ShowUpdate = Partial<ShowInsert>

// ─── Halls ────────────────────────────────────────────────────────────────────

export interface Hall {
  id: string
  showId: string
  name: string
  createdAt: string
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export type PostType = 'security' | 'staffing'

export interface Post {
  id: string
  hallId: string
  name: string
  location: string
  type: PostType
  date: string
  startTime: number
  endTime: number
  notes?: string
  createdAt: string
}

// ─── Shifts ───────────────────────────────────────────────────────────────────

export type SplitStrategy = 'single' | 'equal_halves' | 'equal_thirds'

export interface Shift {
  id: string
  postId: string
  hourStart: number
  hourEnd: number
  splitStrategy: SplitStrategy
  confirmed: boolean
  createdAt: string
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export type AssignmentStatus = 'pending' | 'confirmed' | 'no_show'

export interface Assignment {
  id: string
  shiftId: string
  workerId: string
  status: AssignmentStatus
  isOverride: boolean
  acknowledgedAt?: string
  createdAt: string
  updatedAt: string
}

// ─── Availability ─────────────────────────────────────────────────────────────

export interface Availability {
  id: string
  workerId: string
  showId?: string
  date: string
  available: boolean
  createdAt: string
}
