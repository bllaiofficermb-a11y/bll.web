import { get, push, ref, remove, set } from 'firebase/database'
import { auth, database, ensureAnonymousAuth } from './firebase'

export type LoginStatus = 'success' | 'failed'

export async function recordLoginAttempt(details: {
  employeeId: string
  status: LoginStatus
  reason?: string
  isAdmin?: boolean
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

export async function listRecentLoginAttempts() {
  const snapshot = await get(ref(database, 'login_attempts'))
  return snapshot.exists() ? snapshot.val() : null
}
