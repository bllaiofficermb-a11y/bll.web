import { get, limitToLast, orderByChild, push, query, ref, remove, set } from 'firebase/database'
import { auth, database } from './firebase'
import type { AccessLevel, EmployeeRole } from './accessControl'

export type AccessAction =
  | 'view_section'
  | 'view_document'
  | 'download_document'
  | 'view_product'
  | 'download_file'

export interface AccessLogRecord {
  id: string
  actor: string
  actorName: string
  department: string
  role: EmployeeRole | ''
  action: AccessAction
  resourceType: string
  resourceId: string
  resourceTitle: string
  accessLevel: AccessLevel | ''
  createdAt: string
}

export async function recordAccessLog(input: Omit<AccessLogRecord, 'id' | 'createdAt'>) {
  if (!auth.currentUser) {
    throw new Error('ต้องเข้าสู่ระบบก่อนบันทึกประวัติการเปิดดู')
  }

  const accessLogsRef = ref(database, 'access_logs')
  const logRef = push(accessLogsRef)
  const payload = {
    ...input,
    createdAt: new Date().toISOString(),
  }

  await set(logRef, payload)

  return {
    path: logRef.toString(),
    payload,
    cleanup: async () => {
      await remove(logRef)
    },
  }
}

export async function listRecentAccessLogs(limit = 80) {
  const q = query(ref(database, 'access_logs'), orderByChild('createdAt'), limitToLast(limit))
  const snapshot = await get(q)
  return snapshot.exists() ? snapshot.val() : null
}
