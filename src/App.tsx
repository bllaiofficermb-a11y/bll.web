import { useEffect, useState } from 'react'
import logoImg from './assets/logo.png'
import './App.css'
import MainPage from './pages/MainPage'
import MapPage from './pages/MapPage'
import { recordLoginAttempt } from './lib/loginLog'
import { toAuthPassword } from './lib/seedAdmin'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { get, ref, set } from 'firebase/database'
import { auth, database } from './lib/firebase'
import { readAuthUserProfile, syncAuthUserProfile } from './lib/authUsers'
import {
  canLoginWithStatus,
  canViewMap,
  defaultAccessLevelForRole,
  isAdminRole,
  normalizeAccessLevel,
  normalizeRole,
  normalizeStatus,
  type CurrentUserAccess,
} from './lib/accessControl'

const departmentOptions = ['บริหาร', 'บัญชีและการเงิน', 'กราฟฟิก', 'IT&AI', 'การตลาด', 'ขนส่ง', 'สต๊อก', 'โมเดิร์นเทรด', 'ดีลเลอร์', 'บุคคล']

const getEmployeePathCandidates = (employeeId: string) => {
  const trimmed = employeeId.trim()
  return Array.from(new Set([
    trimmed.toLowerCase(),
    trimmed,
    trimmed.toUpperCase(),
  ].filter(Boolean)))
}

const loadEmployeeAccessProfile = async (employeeId: string): Promise<CurrentUserAccess | null> => {
  for (const candidate of getEmployeePathCandidates(employeeId)) {
    const snapshot = await get(ref(database, `employees/${candidate}`))
    if (!snapshot.exists()) continue

    const value = snapshot.val() as Record<string, unknown>
    const role = normalizeRole(value.role, value.permission)
    const status = normalizeStatus(value.status, role)
    const accessLevel = normalizeAccessLevel(value.accessLevel, role)

    return {
      // Keep this value aligned with the Realtime Database key.
      // Security rules use it to verify that the signed-in Firebase Auth UID
      // belongs to the same employee record before bootstrapping authUsers.
      employeeId: candidate,
      name: String(value.name ?? ''),
      department: String(value.department ?? ''),
      role,
      status,
      accessLevel,
    }
  }

  return null
}

const loadCurrentAccessProfile = async (uid: string, employeeIdFallback: string): Promise<CurrentUserAccess | null> => {
  try {
    const authUserProfile = await readAuthUserProfile(uid)
    if (authUserProfile) return authUserProfile
  } catch (error) {
    console.warn('Unable to read authUsers profile. Falling back to employees profile:', error)
  }

  const employeeProfile = await loadEmployeeAccessProfile(employeeIdFallback)

  if (employeeProfile) {
    void syncAuthUserProfile(uid, {
      id: employeeProfile.employeeId,
      name: employeeProfile.name,
      department: employeeProfile.department,
      role: employeeProfile.role,
      status: employeeProfile.status,
      accessLevel: employeeProfile.accessLevel,
    }).catch((error) => {
      console.warn('Unable to bootstrap authUsers profile:', error)
    })
  }

  return employeeProfile
}

export default function App() {
  const savedEmpId = localStorage.getItem('bll_last_employee_id')
  const [employeeId, setEmployeeId] = useState(savedEmpId || '')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | ''>('')
  const [isLoggedIn, setIsLoggedIn] = useState(!!savedEmpId)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUserAccess | null>(null)
  const [isRegisterAdminOpen, setIsRegisterAdminOpen] = useState(false)
  const [registerAdminLoading, setRegisterAdminLoading] = useState(false)
  const [registerAdminError, setRegisterAdminError] = useState('')
  const [registerAdminForm, setRegisterAdminForm] = useState({
    name: '',
    department: 'IT&AI',
    startDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    email: '',
    password: '',
  })
  // Navigation Tab
  const [activeTab, setActiveTab] = useState<'home' | 'map'>('home')

  useEffect(() => {
    if (!toastType) return

    const timer = window.setTimeout(() => {
      setToastMessage('')
      setToastType('')
    }, 2600)

    return () => window.clearTimeout(timer)
  }, [toastType])

  useEffect(() => {
    let logoutTimer: number | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const loginTimeStr = localStorage.getItem('bll_login_timestamp');
        let isValidSession = true;
        const FOUR_HOURS = 4 * 60 * 60 * 1000;
        
        if (loginTimeStr) {
          const loginTime = parseInt(loginTimeStr, 10);
          const timeElapsed = Date.now() - loginTime;
          if (timeElapsed >= FOUR_HOURS) {
            isValidSession = false;
          } else {
            const remaining = FOUR_HOURS - timeElapsed;
            logoutTimer = window.setTimeout(() => {
              void signOut(auth);
              setIsLoggedIn(false);
              showToast('เซสชันหมดอายุ (4 ชม.) กรุณาล็อกอินใหม่', 'error');
            }, remaining);
          }
        } else {
          localStorage.setItem('bll_login_timestamp', Date.now().toString());
          logoutTimer = window.setTimeout(() => {
            void signOut(auth);
            setIsLoggedIn(false);
            showToast('เซสชันหมดอายุ (4 ชม.) กรุณาล็อกอินใหม่', 'error');
          }, FOUR_HOURS);
        }

        if (!isValidSession) {
          void signOut(auth);
          setIsLoggedIn(false);
          setIsAdmin(false);
          setCurrentUser(null);
          setIsAuthLoading(false);
          return;
        }

        let emailStr = user.email
        let finalId = ''
        if (emailStr === 'admin@bll.com') {
           finalId = 'ADMIN001'
        } else if (emailStr.endsWith('@bll.com')) {
           finalId = emailStr.split('@')[0].toUpperCase()
        } else {
           finalId = emailStr
        }

        setEmployeeId(finalId)

        try {
          const accessProfile = await loadCurrentAccessProfile(user.uid, finalId)

          if (!accessProfile || !canLoginWithStatus(accessProfile.status)) {
            await signOut(auth)
            setIsLoggedIn(false)
            setIsAdmin(false)
            setCurrentUser(null)
            setIsAuthLoading(false)
            return
          }

          setEmployeeId(accessProfile.employeeId)
          setCurrentUser(accessProfile)
          setIsAdmin(isAdminRole(accessProfile.role))
          setIsLoggedIn(true)
        } catch (dbError) {
          console.error("Could not fetch user details from DB:", dbError)
          await signOut(auth)
          setIsLoggedIn(false)
          setIsAdmin(false)
          setCurrentUser(null)
        }
      } else {
        setIsLoggedIn(false)
        setIsAdmin(false)
        setCurrentUser(null)
      }
      setIsAuthLoading(false)
    })
    return () => {
      unsubscribe();
      if (logoutTimer) window.clearTimeout(logoutTimer);
    }
  }, [])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message)
    setToastType(type)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsLoading(true)

    setTimeout(async () => {
      const finalId = employeeId.trim() ? employeeId : 'BLL001'
      const normalizedId = finalId.trim().toLowerCase()
      setEmployeeId(finalId)
      try {
        let loginEmail = `${normalizedId}@bll.com`
        if (finalId.includes('@')) {
          loginEmail = finalId.trim()
        } else if (normalizedId === 'admin001') {
          loginEmail = 'admin@bll.com'
        }

        const loginPassword = toAuthPassword(password || '0000')
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword)

        if (userCredential.user) {
          const accessProfile = await loadCurrentAccessProfile(userCredential.user.uid, finalId)

          if (!accessProfile) {
            await signOut(auth)
            throw new Error('ไม่พบข้อมูลพนักงานในระบบ')
          }

          if (!canLoginWithStatus(accessProfile.status)) {
            await signOut(auth)
            throw new Error('บัญชีนี้ถูกปิดสิทธิ์แล้ว')
          }

          const isAdminUser = isAdminRole(accessProfile.role)

          setEmployeeId(accessProfile.employeeId)
          setCurrentUser(accessProfile)
          setIsAdmin(isAdminUser)
          showToast('เข้าสู่ระบบสำเร็จ', 'success')
          void recordLoginAttempt({
            employeeId: accessProfile.employeeId,
            status: 'success',
            isAdmin: isAdminUser,
            role: accessProfile.role,
            employeeStatus: accessProfile.status,
            accessLevel: accessProfile.accessLevel,
            department: accessProfile.department,
          })
            setTimeout(() => {
              localStorage.setItem('bll_last_employee_id', accessProfile.employeeId)
              localStorage.setItem('bll_login_timestamp', Date.now().toString())
              setIsLoggedIn(true)
            }, 500)
        }
      } catch (error) {
        console.error("Login error:", error)
        setIsAdmin(false)
        setCurrentUser(null)
        showToast('เข้าสู่ระบบไม่สำเร็จ', 'error')
        setErrorMessage(error instanceof Error ? error.message : 'ไม่สามารถตรวจสอบข้อมูลล็อกอินได้')
      } finally {
        setIsLoading(false)
      }
    }, 800)
  }

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterAdminError('')
    setRegisterAdminLoading(true)

    const normalizedId = registerAdminForm.employeeId.trim().toLowerCase()
    const email = registerAdminForm.email.trim()

    try {
      if (!normalizedId || !email || !registerAdminForm.password.trim()) {
        throw new Error('กรุณากรอก รหัสพนักงาน อีเมล และรหัสผ่าน')
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        toAuthPassword(registerAdminForm.password),
      )

      const adminEmployee = {
        id: normalizedId,
        name: registerAdminForm.name.trim() || normalizedId.toUpperCase(),
        department: registerAdminForm.department,
        startDate: registerAdminForm.startDate,
        permission: 'admin',
        role: 'admin' as const,
        status: 'active' as const,
        accessLevel: defaultAccessLevelForRole('admin'),
        avatarColor: '#14b8a6',
        email,
        password: registerAdminForm.password,
        authUid: userCredential.user.uid,
        createdAt: new Date().toISOString(),
      }

      await set(ref(database, `employees/${normalizedId}`), adminEmployee)
      await syncAuthUserProfile(userCredential.user.uid, adminEmployee)

      await signOut(auth)
      setIsRegisterAdminOpen(false)
      setRegisterAdminForm({
        name: '',
        department: 'IT&AI',
        startDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        email: '',
        password: '',
      })
      showToast('สร้าง admin สำเร็จ', 'success')
    } catch (error) {
      setRegisterAdminError(error instanceof Error ? error.message : 'สร้าง admin ไม่สำเร็จ')
      showToast('สร้าง admin ไม่สำเร็จ', 'error')
    } finally {
      setRegisterAdminLoading(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="auth-loading-screen">
        <svg className="loading-icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      </div>
    )
  }

  if (isLoggedIn) {
    return (
      <div className="dashboard-wrapper">
        <header className="navbar">
          <div className="navbar-brand">
            <img src={logoImg} className="navbar-logo" alt="BLL Logo" />
          </div>

          <nav className="navbar-menu">
            <button
              className={`menu-btn ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              หน้าหลัก
            </button>
            {canViewMap(currentUser) && (
              <button
                className={`menu-btn ${activeTab === 'map' ? 'active' : ''}`}
                onClick={() => setActiveTab('map')}
              >
                แผนที่แยกจังหวัด
              </button>
            )}
          </nav>

          <div className="navbar-user-actions">
            <div className="user-badge">
              <svg className="user-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>
                รหัสพนักงาน: {employeeId.toUpperCase()}
                {isAdmin ? ' (admin)' : ''}
              </span>
            </div>
            <button
              onClick={() => {
                void signOut(auth)
                setIsLoggedIn(false)
                setActiveTab('home')
                setSuccessMessage('')
                setEmployeeId('')
                setPassword('')
                setCurrentUser(null)
              }}
              className="navbar-logout-btn"
            >
              ออกจากระบบ
            </button>
          </div>
        </header>

        {activeTab === 'home' || !canViewMap(currentUser) ? (
          <MainPage isAdmin={isAdmin} currentEmployeeId={employeeId} currentUser={currentUser} />
        ) : (
          <MapPage isAdmin={isAdmin} currentEmployeeId={employeeId} />
        )}
      </div>
    )
  }

  return (
    <div className="login-shell">
      <div className="login-wrapper">
          <div className="login-card">

            <div className="login-header">
              <div className="logo-container">
                <img src={logoImg} className="logo-image" alt="BLL Logo" />
              </div>
              <h2 className="login-title">BLL INTERNAL DATA</h2>
            <p className="login-subtitle">กรุณายืนยันตัวตนพนักงานเพื่อเข้าใช้งาน</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
            {errorMessage && <div className="alert alert-error">{errorMessage}</div>}
            {successMessage && <div className="alert alert-success">{successMessage}</div>}

            <div className="input-group">
              <input
                type="text"
                id="employeeId"
                placeholder="รหัสพนักงาน (เช่น 0001 เพื่อเข้าสู่ระบบ)"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={isLoading}
                className="login-input"
                autoComplete="off"
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                id="password"
                placeholder="รหัสผ่าน (เลขท้าย 4 ตัวบัตรประชาชน)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="login-input"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className={`submit-btn ${isLoading ? 'btn-loading' : ''}`} disabled={isLoading}>
              {isLoading ? (
                <span className="spinner"></span>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>

          </form>
        </div>
      </div>

      {isRegisterAdminOpen && (
        <div className="modal-overlay">
          <div className="modal-content premium-modal login-register-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>สร้าง admin ชั่วคราว</h3>
              <button className="close-btn" onClick={() => setIsRegisterAdminOpen(false)}>×</button>
            </div>
            <form onSubmit={handleRegisterAdmin} className="modal-body">
              {registerAdminError && <div className="alert alert-error">{registerAdminError}</div>}
              <div className="form-group">
                <label>ชื่อ</label>
                <input
                  type="text"
                  value={registerAdminForm.name}
                  onChange={e => setRegisterAdminForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>แผนก</label>
                <select
                  value={registerAdminForm.department}
                  onChange={e => setRegisterAdminForm(prev => ({ ...prev, department: e.target.value }))}
                  required
                >
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>วันที่เข้าทำงาน</label>
                <input
                  type="date"
                  value={registerAdminForm.startDate}
                  onChange={e => setRegisterAdminForm(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>รหัสพนักงาน</label>
                <input
                  type="text"
                  value={registerAdminForm.employeeId}
                  onChange={e => setRegisterAdminForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>อีเมล</label>
                <input
                  type="email"
                  value={registerAdminForm.email}
                  onChange={e => setRegisterAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>รหัสผ่าน</label>
                <input
                  type="password"
                  value={registerAdminForm.password}
                  onChange={e => setRegisterAdminForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsRegisterAdminOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="save-btn" disabled={registerAdminLoading}>
                  {registerAdminLoading ? 'กำลังสร้าง...' : 'สร้าง admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={`toast-notification ${toastType}`}>
          <strong>{toastType === 'success' ? 'สำเร็จ' : 'ไม่สำเร็จ'}</strong>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  )
}
