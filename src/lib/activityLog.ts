import { get, push, ref, remove, set } from 'firebase/database'
import { auth, database, ensureAnonymousAuth } from './firebase'

export type ActivityType =
  | 'employee_created'
  | 'employee_updated'
  | 'employee_deleted'
  | 'guide_created'
  | 'guide_updated'
  | 'guide_deleted'

export interface ActivityRecord {
  id: string
  actor: string
  type: ActivityType
  subject: string
  details: string
  createdAt: string
}

export async function recordAdminActivity(input: Omit<ActivityRecord, 'id' | 'createdAt'>) {
  if (!auth.currentUser) {
    await ensureAnonymousAuth()
  }

  const activitiesRef = ref(database, 'admin_activities')
  const activityRef = push(activitiesRef)
  const payload = {
    ...input,
    createdAt: new Date().toISOString(),
  }

  await set(activityRef, payload)

  return {
    path: activityRef.toString(),
    payload,
    cleanup: async () => {
      await remove(activityRef)
    },
  }
}

export async function listRecentActivities() {
  const snapshot = await get(ref(database, 'admin_activities'))
  return snapshot.exists() ? snapshot.val() : null
}
