export const EMPLOYEE_ROLES = ['admin', 'manager', 'user', 'probation'] as const
export const EMPLOYEE_STATUSES = ['active', 'probation', 'resigned'] as const
export const ACCESS_LEVELS = ['public', 'department', 'confidential', 'restricted'] as const

export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number]
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]
export type AccessLevel = (typeof ACCESS_LEVELS)[number]

export interface CurrentUserAccess {
  employeeId: string
  name: string
  department: string
  role: EmployeeRole
  status: EmployeeStatus
  accessLevel: AccessLevel
}

export const ROLE_OPTIONS: Array<{ value: EmployeeRole; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'user', label: 'User' },
  { value: 'probation', label: 'Probation' },
]

export const STATUS_OPTIONS: Array<{ value: EmployeeStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'probation', label: 'Probation' },
  { value: 'resigned', label: 'Resigned' },
]

export const ACCESS_LEVEL_OPTIONS: Array<{ value: AccessLevel; label: string }> = [
  { value: 'public', label: 'ข้อมูลพื้นฐาน' },
  { value: 'department', label: 'ข้อมูลแผนก' },
  { value: 'confidential', label: 'ข้อมูลสำคัญ' },
  { value: 'restricted', label: 'ข้อมูลลับมาก' },
]

const isEmployeeRole = (value: string): value is EmployeeRole =>
  EMPLOYEE_ROLES.includes(value as EmployeeRole)

const isEmployeeStatus = (value: string): value is EmployeeStatus =>
  EMPLOYEE_STATUSES.includes(value as EmployeeStatus)

const isAccessLevel = (value: string): value is AccessLevel =>
  ACCESS_LEVELS.includes(value as AccessLevel)

export const defaultAccessLevelForRole = (role: EmployeeRole): AccessLevel => {
  if (role === 'admin') return 'restricted'
  if (role === 'manager') return 'confidential'
  if (role === 'probation') return 'public'
  return 'department'
}

export const normalizeRole = (role?: unknown, permission?: unknown): EmployeeRole => {
  const raw = String(role ?? permission ?? 'user').trim().toLowerCase()
  if (isEmployeeRole(raw)) return raw
  return 'user'
}

export const normalizeStatus = (status?: unknown, role: EmployeeRole = 'user'): EmployeeStatus => {
  const raw = String(status ?? '').trim().toLowerCase()
  if (isEmployeeStatus(raw)) return raw
  return role === 'probation' ? 'probation' : 'active'
}

export const normalizeAccessLevel = (accessLevel?: unknown, role: EmployeeRole = 'user'): AccessLevel => {
  const raw = String(accessLevel ?? '').trim().toLowerCase()
  if (isAccessLevel(raw)) return raw
  return defaultAccessLevelForRole(role)
}

export const formatRoleLabel = (role: EmployeeRole) =>
  ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role

export const formatStatusLabel = (status: EmployeeStatus) =>
  STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status

export const formatAccessLevelLabel = (level: AccessLevel) =>
  ACCESS_LEVEL_OPTIONS.find((option) => option.value === level)?.label ?? level

export const canLoginWithStatus = (status: EmployeeStatus) => status !== 'resigned'
export const isAdminRole = (role: EmployeeRole) => role === 'admin'

export const canViewEmployeeDirectory = (profile?: CurrentUserAccess | null) =>
  profile?.role === 'admin'

export const canViewLoginHistory = (profile?: CurrentUserAccess | null) =>
  profile?.role === 'admin'

export const canViewProducts = (profile?: CurrentUserAccess | null) =>
  profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'user'

export const canViewMap = (profile?: CurrentUserAccess | null) =>
  profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'user'

export const canViewGuides = (profile?: CurrentUserAccess | null) =>
  Boolean(profile) && profile?.status !== 'resigned'
