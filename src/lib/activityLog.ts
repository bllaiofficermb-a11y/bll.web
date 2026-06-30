import { get, push, ref, remove, set } from 'firebase/database'
import { auth, database, ensureAnonymousAuth } from './firebase'

export type ActivityType =
  | 'employee_created'
  | 'employee_updated'
  | 'employee_deleted'
  | 'guide_created'
  | 'guide_updated'
  | 'guide_deleted'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'map_rep_created'
  | 'map_rep_updated'
  | 'map_rep_deleted'
  | 'map_province_updated'
  | 'map_shop_created'
  | 'map_shop_deleted'
  | 'map_point_created'
  | 'map_point_updated'
  | 'map_point_deleted'
  | 'map_point_moved'
  | 'map_profile_moved'

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
