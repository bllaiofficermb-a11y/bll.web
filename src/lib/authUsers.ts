import { get, ref, set } from 'firebase/database'
import { database } from './firebase'
import {
  defaultAccessLevelForRole,
  normalizeAccessLevel,
  normalizeRole,
  normalizeStatus,
  type AccessLevel,
  type CurrentUserAccess,
  type EmployeeRole,
  type EmployeeStatus,
} from './accessControl'

export interface AuthUserProfile {
  uid: string
  employeeId: string
  name: string
  department: string
  role: EmployeeRole
  status: EmployeeStatus
  accessLevel: AccessLevel
  email?: string
  updatedAt: string
}

export interface EmployeeLikeForAuthUser {
  id?: string
  name?: string
  department?: string
  role?: unknown
  permission?: unknown
  status?: unknown
  accessLevel?: unknown
  email?: string
  authUid?: string
}

export const buildAuthUserProfile = (uid: string, employee: EmployeeLikeForAuthUser): AuthUserProfile => {
  const role = normalizeRole(employee.role, employee.permission)
  const status = normalizeStatus(employee.status, role)
  const accessLevel = normalizeAccessLevel(employee.accessLevel, role)

  return {
    uid,
    employeeId: String(employee.id ?? '').trim(),
    name: String(employee.name ?? '').trim(),
    department: String(employee.department ?? '').trim(),
    role,
    status,
    accessLevel: accessLevel || defaultAccessLevelForRole(role),
    email: employee.email ? String(employee.email).trim() : '',
    updatedAt: new Date().toISOString(),
  }
}

export async function syncAuthUserProfile(uid: string | undefined, employee: EmployeeLikeForAuthUser) {
  if (!uid) return null

  const payload = buildAuthUserProfile(uid, employee)
  await set(ref(database, `authUsers/${uid}`), payload)
  return payload
}

export async function readAuthUserProfile(uid: string): Promise<CurrentUserAccess | null> {
  const snapshot = await get(ref(database, `authUsers/${uid}`))
  if (!snapshot.exists()) return null

  const raw = snapshot.val() as Record<string, unknown>
  const role = normalizeRole(raw.role)
  const status = normalizeStatus(raw.status, role)
  const accessLevel = normalizeAccessLevel(raw.accessLevel, role)

  return {
    employeeId: String(raw.employeeId ?? ''),
    name: String(raw.name ?? ''),
    department: String(raw.department ?? ''),
    role,
    status,
    accessLevel,
  }
}
