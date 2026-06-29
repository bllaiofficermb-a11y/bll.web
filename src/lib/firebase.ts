import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'

export const firebaseConfig = {
  apiKey: 'AIzaSyC4KxtsTF_-TCcofYQkbZhf5GV7NHNtZhQ',
  authDomain: 'bll-web.firebaseapp.com',
  projectId: 'bll-web',
  databaseURL: 'https://bll-web-default-rtdb.asia-southeast1.firebasedatabase.app',
  storageBucket: 'bll-web.firebasestorage.app',
  messagingSenderId: '679481055440',
  appId: '1:679481055440:web:c433025924f5f6ecb3a6d5',
  measurementId: 'G-6BRC33WDG8',
}

const otherProjectFirebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
}

const firebaseDatabaseUrl = 'https://bll-web-default-rtdb.asia-southeast1.firebasedatabase.app'

declare global {
  // eslint-disable-next-line no-var
  var __bllFirebaseApp: ReturnType<typeof initializeApp> | undefined
}

export const app =
  globalThis.__bllFirebaseApp ?? (globalThis.__bllFirebaseApp = getApps().length ? getApp() : initializeApp({
    ...firebaseConfig,
    databaseURL: firebaseDatabaseUrl,
  }))

export const otherProject =
  otherProjectFirebaseConfig.apiKey && otherProjectFirebaseConfig.appId
    ? initializeApp(otherProjectFirebaseConfig, 'other')
    : null

export const defaultStorage = getStorage()
export const defaultFirestore = getFirestore()
export const database = getDatabase(app, firebaseDatabaseUrl)
export const auth = getAuth(app)
export const ensureAnonymousAuth = () => signInAnonymously(auth)

export const otherStorage = otherProject ? getStorage(otherProject) : null
export const otherFirestore = otherProject ? getFirestore(otherProject) : null
export const otherDatabase = otherProject ? getDatabase(otherProject) : null

export const getDefaultAppName = () => getApp().name

export const analyticsPromise: Promise<Analytics | null> = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null)
