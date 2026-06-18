// ─── Auth ────────────────────────────────────────────────────────────────────

export interface Admin {
  id: string
  email: string
  first_name?: string
  last_name?: string
}

// ─── Workers ─────────────────────────────────────────────────────────────────

export type WorkerType = 'guard' | 'staffer'

export interface DLicense {
  blue_card: boolean
  number?: string
  exp?: string
}

export interface GLicense {
  active_license: boolean
  number?: string
  exp?: string
}

export interface CCW {
  active_license: boolean
  number?: string
  exp?: string
}

export interface Uniform {
  polo?: { has_issued: boolean; size?: string; qty?: number }
  jacket?: { has_issued: boolean; size?: string }
}

export interface Badge {
  has_issued: boolean
  barcode?: string
}

export interface ShiftPref {
  start_time?: number
  end_time?: number
}

export interface EmergencyContact {
  name?: string
  phone?: string
  relation?: string
}

export interface Worker {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  worker_type: WorkerType
  is_supervisor: boolean
  is_active: boolean
  ssn?: string
  birth_date?: string
  start_date?: string
  position?: string
  rating?: string
  transportation?: string
  d_license?: DLicense
  g_license?: GLicense
  ccw?: CCW
  uniform?: Uniform
  badge?: Badge
  shift_pref?: ShiftPref
  emergency_contact?: EmergencyContact
  created_at: string
  updated_at: string
}

export type WorkerInsert = Omit<Worker, 'id' | 'created_at' | 'updated_at'>
export type WorkerUpdate = Partial<WorkerInsert>

// ─── Shows ────────────────────────────────────────────────────────────────────

export type ShowStatus = 'draft' | 'active' | 'closed'

export interface Show {
  id: string
  name: string
  client_name: string
  venue: string
  start_date: string
  end_date: string
  status: ShowStatus
  notes?: string
  created_at: string
  updated_at: string
}

export type ShowInsert = Omit<Show, 'id' | 'created_at' | 'updated_at'>
export type ShowUpdate = Partial<ShowInsert>

// ─── Halls ────────────────────────────────────────────────────────────────────

export interface Hall {
  id: string
  show_id: string
  name: string
  floor_level?: string
  created_at: string
  updated_at: string
}

export type HallInsert = Omit<Hall, 'id' | 'created_at' | 'updated_at'>
export type HallUpdate = Partial<HallInsert>

// ─── Posts ────────────────────────────────────────────────────────────────────

export type PostType = 'security' | 'staffing'

export interface Post {
  id: string
  hall_id: string
  name: string
  post_type: PostType
  date: string
  start_time: string
  end_time: string
  headcount_required: number
  notes?: string
  created_at: string
  updated_at: string
}

export type PostInsert = Omit<Post, 'id' | 'created_at' | 'updated_at'>
export type PostUpdate = Partial<PostInsert>

// ─── Shifts ───────────────────────────────────────────────────────────────────

export type SplitStrategy = 'equal_thirds' | 'equal_halves' | 'single' | 'manual'
export type ShiftStatus = 'open' | 'filled' | 'no_show'

export interface Shift {
  id: string
  post_id: string
  date: string
  start_time: string
  end_time: string
  split_strategy: SplitStrategy
  status: ShiftStatus
  created_at: string
  updated_at: string
}

export type ShiftInsert = Omit<Shift, 'id' | 'created_at' | 'updated_at'>
export type ShiftUpdate = Partial<ShiftInsert>

// ─── Assignments ──────────────────────────────────────────────────────────────

export type AssignmentStatus = 'pending' | 'confirmed' | 'declined' | 'no_show'

export interface Assignment {
  id: string
  shift_id: string
  worker_id: string
  status: AssignmentStatus
  early_release_time?: string
  acknowledged_at?: string
  override_reason?: string
  override_by?: string
  created_at: string
  updated_at: string
}

export type AssignmentInsert = Omit<Assignment, 'id' | 'created_at' | 'updated_at'>
export type AssignmentUpdate = Partial<AssignmentInsert>

// ─── Availability Tokens ──────────────────────────────────────────────────────

export type TokenType = 'availability' | 'acknowledgment'

export interface AvailabilityToken {
  id: string
  worker_id: string
  show_id?: string
  token: string
  token_type: TokenType
  expires_at: string
  used_at?: string
  created_at: string
}

// ─── Availability ─────────────────────────────────────────────────────────────

export type AvailabilityType = 'standing' | 'per_show'

export interface Availability {
  id: string
  worker_id: string
  availability_type: AvailabilityType
  show_id?: string
  day_of_week?: number
  date?: string
  start_time: string
  end_time: string
  created_at: string
  updated_at: string
}

export type AvailabilityInsert = Omit<Availability, 'id' | 'created_at' | 'updated_at'>
export type AvailabilityUpdate = Partial<AvailabilityInsert>

// ─── Imports ──────────────────────────────────────────────────────────────────

export interface RawImportRow {
  [columnHeader: string]: string | number | null
}

export interface MappedPostRow {
  rawIndex: number
  name: string
  post_type: PostType
  date: string
  start_time: string
  end_time: string
  headcount_required: number
  notes: string | null
  hall_id: string | null
  validationErrors: string[]
}

export interface ColumnMapping {
  name: string
  post_type: string
  date: string
  start_time: string
  end_time: string
  headcount_required: string
  notes?: string
}

export interface PendingHall {
  tempId: string
  name: string
  floor_level: string | null
}

// ─── Overtime Flags ───────────────────────────────────────────────────────────

export interface OvertimeFlag {
  id: string
  worker_id: string
  show_id?: string
  week_start: string
  total_hours: number
  resolved_by?: string
  resolved_at?: string
  created_at: string
}

export type OvertimeFlagInsert = Omit<OvertimeFlag, 'id' | 'created_at'>
