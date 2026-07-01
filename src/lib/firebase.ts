import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'

const getEnv = (key: string) => {
  const value = import.meta.env[key]

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }

  return value
}

export const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  databaseURL: getEnv('VITE_FIREBASE_DATABASE_URL'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
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

const firebaseDatabaseUrl = firebaseConfig.databaseURL

declare global {
  // eslint-disable-next-line no-var
  var __bllFirebaseApp: ReturnType<typeof initializeApp> | undefined
}

export const app =
  globalThis.__bllFirebaseApp ??
  (globalThis.__bllFirebaseApp = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig))

export const otherProject =
  otherProjectFirebaseConfig.apiKey && otherProjectFirebaseConfig.appId
    ? initializeApp(otherProjectFirebaseConfig, 'other')
    : null

export const defaultStorage = getStorage(app)
export const defaultFirestore = getFirestore(app)
export const database = getDatabase(app, firebaseDatabaseUrl)
export const auth = getAuth(app)

export const otherStorage = otherProject ? getStorage(otherProject) : null
export const otherFirestore = otherProject ? getFirestore(otherProject) : null
export const otherDatabase = otherProject ? getDatabase(otherProject) : null

export const getDefaultAppName = () => getApp().name
