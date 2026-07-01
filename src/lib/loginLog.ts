import { get, push, ref, remove, set, query, orderByChild, limitToLast, endAt, startAt } from 'firebase/database'
import { auth, database, ensureAnonymousAuth } from './firebase'
import type { AccessLevel, EmployeeRole, EmployeeStatus } from './accessControl'

export type LoginStatus = 'success' | 'failed'

export async function recordLoginAttempt(details: {
  employeeId: string
  status: LoginStatus
  reason?: string
  isAdmin?: boolean
  role?: EmployeeRole
  employeeStatus?: EmployeeStatus
  accessLevel?: AccessLevel
  department?: string
}) {
  if (!auth.currentUser) {
    await ensureAnonymousAuth()
  }

  const loginAttemptsRef = ref(database, 'login_attempts')
  const attemptRef = push(loginAttemptsRef)

  const payload = {
    employeeId: details.employeeId.trim(),
    status: details.status,
    reason: details.reason ?? '',
    isAdmin: details.isAdmin ?? false,
    role: details.role ?? '',
    employeeStatus: details.employeeStatus ?? '',
    accessLevel: details.accessLevel ?? '',
    department: details.department ?? '',
    createdAt: new Date().toISOString(),
  }

  await set(attemptRef, payload)

  return {
    path: attemptRef.toString(),
    payload,
    cleanup: async () => {
      await remove(attemptRef)
    },
  }
}

export async function fetchLoginAttempts(options: { date?: string, lastCreatedAt?: string, limit?: number }) {
  const limitCount = options.limit || 25;
  const attemptsRef = ref(database, 'login_attempts');
  
  let q;
  if (options.date) {
    const startOfDay = `${options.date}T00:00:00.000Z`;
    const endOfDay = `${options.date}T23:59:59.999Z`;
    
    let queryEnd = endOfDay;
    if (options.lastCreatedAt && options.lastCreatedAt < endOfDay) {
      queryEnd = options.lastCreatedAt;
    }
    
    q = query(attemptsRef, orderByChild('createdAt'), startAt(startOfDay), endAt(queryEnd), limitToLast(limitCount));
  } else {
    if (options.lastCreatedAt) {
      q = query(attemptsRef, orderByChild('createdAt'), endAt(options.lastCreatedAt), limitToLast(limitCount));
    } else {
      q = query(attemptsRef, orderByChild('createdAt'), limitToLast(limitCount));
    }
  }

  const snapshot = await get(q);
  return snapshot.exists() ? snapshot.val() : null;
}
