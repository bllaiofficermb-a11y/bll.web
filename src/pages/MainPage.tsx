import { useEffect, useRef, useState } from 'react'
import ProductsPage from './ProductsPage'
import { fetchLoginAttempts, type LoginStatus } from '../lib/loginLog'
import { listRecentActivities, recordAdminActivity, type ActivityRecord, type ActivityType } from '../lib/activityLog'
import { ref, remove, set, onValue } from 'firebase/database'
import { database, firebaseConfig } from '../lib/firebase'
import SecurityWatermark from '../components/SecurityWatermark'
import { listRecentAccessLogs, recordAccessLog, type AccessAction, type AccessLogRecord } from '../lib/accessLog'
import { syncAuthUserProfile } from '../lib/authUsers'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { toAuthPassword } from '../lib/seedAdmin'
import {
  ACCESS_LEVEL_OPTIONS,
  ROLE_OPTIONS,
  STATUS_OPTIONS,
  canViewEmployeeDirectory,
  canViewGuides,
  canViewLoginHistory,
  canViewProducts,
  defaultAccessLevelForRole,
  formatAccessLevelLabel,
  formatRoleLabel,
  formatStatusLabel,
  normalizeAccessLevel,
  normalizeRole,
  normalizeStatus,
  type AccessLevel,
  type CurrentUserAccess,
  type EmployeeRole,
  type EmployeeStatus,
} from '../lib/accessControl'

export interface EmployeeProfile {
  id: string
  name: string
  department: string
  startDate: string
  permission: string
  role: EmployeeRole
  status: EmployeeStatus
  accessLevel: AccessLevel
  avatarColor: string
  email?: string
  password?: string
  avatarUrl?: string
  authUid?: string
}

interface GuideDoc {
  id: string
  title: string
  category: string
  fileName: string
  fileUrl?: string
  fileDataUrl?: string
  department?: string
  accessLevel?: AccessLevel
}

interface LoginAttempt {
  id: string
  employeeId: string
  status: LoginStatus
  reason: string
  isAdmin?: boolean
  createdAt: string
  role?: EmployeeRole
  employeeStatus?: EmployeeStatus
  accessLevel?: AccessLevel
  department?: string
}

const DEPARTMENT_OPTIONS = ['บริหาร', 'บัญชีและการเงิน', 'กราฟฟิก', 'IT&AI', 'การตลาด', 'ขนส่ง', 'สต๊อก', 'โมเดิร์นเทรด', 'ดีลเลอร์', 'บุคคล']
const DEPARTMENTS = ['ทั้งหมด', ...DEPARTMENT_OPTIONS]
const LEGACY_DEPARTMENT_LABELS: Record<string, string> = {
  'บัญชี': 'บัญชีและการเงิน',
  'IT & AI': 'IT&AI',
  'IT AI': 'IT&AI',
  'IT-AI': 'IT&AI',
  'HR': 'บุคคล',
  'Human Resources': 'บุคคล',
  'พนักงานคลัง': 'สต๊อก',
  'คลัง': 'สต๊อก',
  'Logistic': 'ขนส่ง',
  'โลจิสติกส์': 'ขนส่ง',
}

const normalizeDepartment = (department?: string) => {
  const trimmed = (department || '').trim()
  return LEGACY_DEPARTMENT_LABELS[trimmed] || trimmed
}
const GUIDE_CATEGORIES = ['เซลส์ / การตลาด / ดีไซเนอร์ / AI', 'ซัพพอร์ต', 'Logistic', 'บัญชี']

export default function MainPage({
  isAdmin,
  currentEmployeeId,
  currentUser,
}: {
  isAdmin?: boolean
  currentEmployeeId?: string
  currentUser?: CurrentUserAccess | null
}) {
  const [activeView, setActiveView] = useState<'menu' | 'directory' | 'products' | 'guide' | 'login-history'>('menu')
  const [employees, setEmployees] = useState<EmployeeProfile[]>([])
  const [guideDocs, setGuideDocs] = useState<GuideDoc[]>([])
  const [selectedDept, setSelectedDept] = useState<string>('ทั้งหมด')
  const [selectedGuideCategory, setSelectedGuideCategory] = useState<string>(GUIDE_CATEGORIES[0])
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([])
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false)
  const [loginHistoryError, setLoginHistoryError] = useState('')
  const [activityRecords, setActivityRecords] = useState<ActivityRecord[]>([])
  const [accessRecords, setAccessRecords] = useState<AccessLogRecord[]>([])
  const authUserBackfillDoneRef = useRef(false)
  const canOpenDirectory = canViewEmployeeDirectory(currentUser)
  const canOpenProducts = canViewProducts(currentUser)
  const canOpenGuides = canViewGuides(currentUser)
  const canOpenLoginHistory = canViewLoginHistory(currentUser)

  // Edit, Add, Delete State
  const [editingEmp, setEditingEmp] = useState<EmployeeProfile | null>(null)
  const [editingOriginalEmpId, setEditingOriginalEmpId] = useState<string | null>(null)

  const [loginDateFilter, setLoginDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [loginHasMore, setLoginHasMore] = useState(true)

  const loadLoginLogs = async (isLoadMore = false) => {
    try {
      setLoginHistoryLoading(true)
      setLoginHistoryError('')

      let lastCreatedAt: string | undefined;
      if (isLoadMore && loginAttempts.length > 0) {
        lastCreatedAt = loginAttempts[loginAttempts.length - 1].createdAt;
      }

      const [loginData, activityData, accessData] = await Promise.all([
        fetchLoginAttempts({ 
          date: loginDateFilter || undefined, 
          lastCreatedAt, 
          limit: 26 
        }),
        !isLoadMore ? listRecentActivities() : Promise.resolve(null),
        !isLoadMore ? listRecentAccessLogs() : Promise.resolve(null),
      ]);

      if (!isLoadMore && activityData) {
        let activities = Object.entries(activityData).map(([id, value]) => ({
          id,
          actor: String((value as { actor?: string }).actor ?? ''),
          type: ((value as { type?: ActivityType }).type ?? 'guide_updated') as ActivityType,
          subject: String((value as { subject?: string }).subject ?? ''),
          details: String((value as { details?: string }).details ?? ''),
          createdAt: String((value as { createdAt?: string }).createdAt ?? ''),
        }));
        
        if (loginDateFilter) {
          activities = activities.filter(a => a.createdAt.startsWith(loginDateFilter));
        }
        
        activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setActivityRecords(activities);
      }

      if (!isLoadMore && accessData) {
        let records = Object.entries(accessData).map(([id, value]) => {
          const raw = value as Record<string, unknown>
          return {
            id,
            actor: String(raw.actor ?? ''),
            actorName: String(raw.actorName ?? ''),
            department: String(raw.department ?? ''),
            role: normalizeRole(raw.role),
            action: String(raw.action ?? 'view_document') as AccessAction,
            resourceType: String(raw.resourceType ?? ''),
            resourceId: String(raw.resourceId ?? ''),
            resourceTitle: String(raw.resourceTitle ?? ''),
            accessLevel: normalizeAccessLevel(raw.accessLevel),
            createdAt: String(raw.createdAt ?? ''),
          }
        })

        if (loginDateFilter) {
          records = records.filter(record => record.createdAt.startsWith(loginDateFilter))
        }

        records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        setAccessRecords(records)
      } else if (!isLoadMore) {
        setAccessRecords([])
      }

      const attempts = loginData
        ? Object.entries(loginData).map(([id, value]) => {
            const raw = value as Record<string, unknown>
            const role = normalizeRole(raw.role)
            const employeeStatus = normalizeStatus(raw.employeeStatus, role)
            const accessLevel = normalizeAccessLevel(raw.accessLevel, role)

            return {
            id,
            employeeId: String(raw.employeeId ?? ''),
            status: ((raw.status ?? 'failed') as LoginStatus),
            reason: String(raw.reason ?? ''),
            isAdmin: Boolean(raw.isAdmin ?? false),
            createdAt: String(raw.createdAt ?? ''),
            role,
            employeeStatus,
            accessLevel,
            department: String(raw.department ?? ''),
          }
        })
        : [];

      attempts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      let hasMore = false;
      if (isLoadMore) {
         if (lastCreatedAt && attempts.length > 0 && attempts[0].createdAt === lastCreatedAt) {
            attempts.shift();
         }
         hasMore = attempts.length === 25;
      } else {
         hasMore = attempts.length === 26;
         if (hasMore) {
            attempts.pop();
         }
      }

      setLoginHasMore(hasMore);

      if (isLoadMore) {
        setLoginAttempts(prev => [...prev, ...attempts]);
      } else {
        setLoginAttempts(attempts);
      }
    } catch (error) {
      setLoginHistoryError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoginHistoryLoading(false);
    }
  }

  const [isAdding, setIsAdding] = useState(false)
  const [deletingEmp, setDeletingEmp] = useState<EmployeeProfile | null>(null)
  const [editingGuide, setEditingGuide] = useState<GuideDoc | null>(null)
  const [isAddingGuide, setIsAddingGuide] = useState(false)
  const [deletingGuide, setDeletingGuide] = useState<GuideDoc | null>(null)

  useEffect(() => {
    const blockedView =
      (activeView === 'directory' && !canOpenDirectory) ||
      (activeView === 'products' && !canOpenProducts) ||
      (activeView === 'guide' && !canOpenGuides) ||
      (activeView === 'login-history' && !canOpenLoginHistory)

    if (blockedView) {
      setActiveView('menu')
    }
  }, [activeView, canOpenDirectory, canOpenGuides, canOpenLoginHistory, canOpenProducts])

  useEffect(() => {
    if (!canOpenDirectory) {
      setEmployees([])
      return
    }

    let mounted = true
    const employeesRef = ref(database, 'employees')
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      if (!mounted) return
      const data = snapshot.exists() ? snapshot.val() : null
      const items = data
        ? Object.entries(data).map(([id, value]) => {
          const raw = value as Record<string, unknown>
          const role = normalizeRole(raw.role, raw.permission)
          const status = normalizeStatus(raw.status, role)
          const accessLevel = normalizeAccessLevel(raw.accessLevel, role)

          return {
            id,
            name: String(raw.name ?? ''),
            department: normalizeDepartment(String(raw.department ?? '')),
            startDate: String(raw.startDate ?? new Date().toISOString().split('T')[0]),
            permission: String(raw.permission ?? role),
            role,
            status,
            accessLevel,
            avatarColor: String(raw.avatarColor ?? '#3b82f6'),
            avatarUrl: String(raw.avatarUrl ?? ''),
            authUid: String(raw.authUid ?? ''),
            email: String(raw.email ?? ''),
            password: String(raw.password ?? ''),
          }
        })
        : []
      setEmployees(items)
    }, (error) => {
      if (!mounted) return
      console.error("Firebase realtime error on employees:", error)
      setEmployees([])
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [canOpenDirectory])

  useEffect(() => {
    if (activeView !== 'guide' || !canOpenGuides) {
      setGuideDocs([])
      return
    }

    let mounted = true
    const guidesRef = ref(database, 'guides')
    const unsubscribe = onValue(guidesRef, (snapshot) => {
      if (!mounted) return
      const data = snapshot.exists() ? snapshot.val() : null
      const items = data
        ? Object.entries(data).map(([id, value]) => {
          const raw = value as Record<string, unknown>
          const accessLevel = normalizeAccessLevel(raw.accessLevel, 'user')

          return {
            id,
            title: String(raw.title ?? ''),
            category: String(raw.category ?? GUIDE_CATEGORIES[0]),
            fileName: String(raw.fileName ?? ''),
            fileUrl: String(raw.fileUrl ?? ''),
            fileDataUrl: String(raw.fileDataUrl ?? ''),
            department: normalizeDepartment(String(raw.department ?? '')),
            accessLevel,
          }
        })
        : []

      setGuideDocs(items)
    }, (error) => {
      if (!mounted) return
      console.error('Firebase realtime error on guides:', error)
      setGuideDocs([])
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [activeView, canOpenGuides])

  useEffect(() => {
    if (activeView !== 'login-history') return

    let isMounted = true
    loadLoginLogs(false)
      .finally(() => {
        if (!isMounted) return
        setLoginHistoryLoading(false)
      })

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView])

  useEffect(() => {
    if (!isAdmin || authUserBackfillDoneRef.current || employees.length === 0) return

    authUserBackfillDoneRef.current = true
    void Promise.all(
      employees
        .filter(emp => Boolean(emp.authUid))
        .map(emp => syncAuthUserProfile(emp.authUid, emp).catch(error => {
          console.error('Unable to sync authUsers profile:', emp.id, error)
          return null
        }))
    )
  }, [employees, isAdmin])

  const canViewGuideDoc = (doc: GuideDoc) => {
    if (!currentUser || currentUser.status === 'resigned') return false
    if (currentUser.role === 'admin') return true

    const docLevel = normalizeAccessLevel(doc.accessLevel, 'user')
    const docDepartment = normalizeDepartment(doc.department || '')
    const sameDepartment = !docDepartment || docDepartment === normalizeDepartment(currentUser.department)

    if (docLevel === 'public') return true
    if (docLevel === 'department') return sameDepartment && currentUser.role !== 'probation'
    if (docLevel === 'confidential') return sameDepartment && currentUser.role === 'manager'
    return false
  }

  const logGuideAccess = async (action: AccessAction, doc?: GuideDoc) => {
    if (!currentUser) return

    try {
      await recordAccessLog({
        actor: currentUser.employeeId,
        actorName: currentUser.name,
        department: currentUser.department,
        role: currentUser.role,
        action,
        resourceType: doc ? 'guide' : 'guide_section',
        resourceId: doc?.id || selectedGuideCategory,
        resourceTitle: doc?.title || `หมวดคู่มือ: ${selectedGuideCategory}`,
        accessLevel: doc?.accessLevel || 'department',
      })
    } catch (error) {
      console.error('Unable to record access log:', error)
    }
  }

  const visibleGuideDocs = guideDocs.filter(doc => doc.category === selectedGuideCategory && canViewGuideDoc(doc))

  useEffect(() => {
    if (activeView !== 'guide') return
    void logGuideAccess('view_section')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, selectedGuideCategory])

  const openAddModal = () => {
    setEditingOriginalEmpId(null)
    setEditingEmp({
      id: `BLL${String(employees.length + 1).padStart(3, '0')}`,
      name: '',
      department: '',
      startDate: new Date().toISOString().split('T')[0],
      permission: 'user',
      role: 'user',
      status: 'active',
      accessLevel: defaultAccessLevelForRole('user'),
      avatarColor: '#3b82f6',
      email: '',
      password: '',
    })
    setIsAdding(true)
  }

  const openEditModal = (emp: EmployeeProfile) => {
    setEditingOriginalEmpId(emp.id)
    setEditingEmp({ ...emp, department: normalizeDepartment(emp.department) })
    setIsAdding(false)
  }

  const closeEmployeeModal = () => {
    setEditingEmp(null)
    setEditingOriginalEmpId(null)
    setIsAdding(false)
  }

  const openAddGuideModal = () => {
    setEditingGuide({
      id: `guide-${Date.now()}`,
      title: '',
      category: GUIDE_CATEGORIES[0],
      fileName: '',
      fileUrl: '',
      department: currentUser?.department || '',
      accessLevel: 'department',
    })
    setIsAddingGuide(true)
  }

  const openEditGuideModal = (doc: GuideDoc) => {
    setEditingGuide(doc)
    setIsAddingGuide(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmp) return

    const originalEmpId = editingOriginalEmpId
    const isCreating = isAdding || !originalEmpId
    const finalId = editingEmp.id.trim()
    const finalEmail = (editingEmp.email || '').trim()
    const finalPassword = (editingEmp.password || '').trim()

    try {
      if (!finalId) {
        throw new Error('กรุณากรอกรหัสพนักงาน')
      }

      if (!editingEmp.name.trim()) {
        throw new Error('กรุณากรอกชื่อพนักงาน')
      }

      if (!editingEmp.department.trim()) {
        throw new Error('กรุณาเลือกแผนก')
      }

      if (isCreating && employees.some(emp => emp.id === finalId)) {
        throw new Error(`รหัสพนักงาน ${finalId} มีอยู่ในระบบแล้ว ห้ามเพิ่มซ้ำ`)
      }

      if (!isCreating && originalEmpId !== finalId && employees.some(emp => emp.id === finalId)) {
        throw new Error(`รหัสพนักงาน ${finalId} มีอยู่ในระบบแล้ว ถ้าต้องการแก้ไขให้ใช้รหัสอื่น`)
      }

      let authUid = editingEmp.authUid || ''

      if (isCreating && finalEmail && finalPassword) {
        // Create user in Firebase Auth only when adding a new employee.
        // Editing an employee must never create Auth again, otherwise it triggers auth/email-already-in-use.
        const secondaryApp = initializeApp(firebaseConfig, `Secondary-${Date.now()}`)
        const secondaryAuth = getAuth(secondaryApp)

        try {
          const userCredential = await createUserWithEmailAndPassword(
            secondaryAuth,
            finalEmail,
            toAuthPassword(finalPassword)
          )
          authUid = userCredential.user.uid
        } finally {
          await secondaryAuth.signOut().catch(() => undefined)
          await deleteApp(secondaryApp).catch(() => undefined)
        }
      }

      const role = normalizeRole(editingEmp.role, editingEmp.permission)
      const status = normalizeStatus(editingEmp.status, role)
      const accessLevel = normalizeAccessLevel(editingEmp.accessLevel, role)

      const finalEmp: EmployeeProfile = {
        ...editingEmp,
        id: finalId,
        name: editingEmp.name.trim(),
        email: finalEmail,
        password: finalPassword,
        department: normalizeDepartment(editingEmp.department),
        permission: role,
        role,
        status,
        accessLevel,
        authUid,
      }

      if (!isCreating && originalEmpId && originalEmpId !== finalId) {
        await remove(ref(database, `employees/${originalEmpId}`))
      }

      await set(ref(database, `employees/${finalEmp.id}`), finalEmp)
      await syncAuthUserProfile(finalEmp.authUid, finalEmp)

      if (isCreating) {
        setEmployees(prev => [...prev.filter(emp => emp.id !== finalEmp.id), finalEmp])
      } else {
        setEmployees(prev => prev.map(emp => emp.id === originalEmpId ? finalEmp : emp))
      }

      if (isAdmin) {
        await recordAdminActivity({
          actor: currentEmployeeId || 'ADMIN',
          type: isCreating ? 'employee_created' : 'employee_updated',
          subject: `${finalEmp.id} - ${finalEmp.name || 'ไม่ระบุชื่อ'}`,
          details: isCreating
            ? `เพิ่มพนักงานใหม่ แผนก: ${finalEmp.department || '-'} | สิทธิ์: ${formatRoleLabel(finalEmp.role)} | สถานะ: ${formatStatusLabel(finalEmp.status)}`
            : originalEmpId && originalEmpId !== finalEmp.id
              ? `อัปเดตข้อมูลพนักงาน แผนก: ${finalEmp.department || '-'} | สิทธิ์: ${formatRoleLabel(finalEmp.role)} | เปลี่ยนรหัสจาก ${originalEmpId} เป็น ${finalEmp.id}`
              : `อัปเดตข้อมูลพนักงาน แผนก: ${finalEmp.department || '-'} | สิทธิ์: ${formatRoleLabel(finalEmp.role)} | สถานะ: ${formatStatusLabel(finalEmp.status)}`,
        })
      }

      closeEmployeeModal()
    } catch (error) {
      console.error('Error saving employee:', error)
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูลพนักงาน'
      if (message.includes('auth/email-already-in-use')) {
        alert('อีเมลนี้มีบัญชี Firebase Auth อยู่แล้ว ถ้ากำลังแก้ไขพนักงานเดิม ระบบเวอร์ชันนี้จะไม่สร้างบัญชีซ้ำอีก ให้ลองแทนไฟล์ใหม่แล้วบันทึกอีกครั้ง')
        return
      }
      alert(message)
    }
  }

  const handleGuideSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGuide) return

    const finalDoc = {
      ...editingGuide,
      title: editingGuide.title.trim(),
      fileName: editingGuide.fileName.trim() || 'guide-file.pdf',
      department: normalizeDepartment(editingGuide.department || ''),
      accessLevel: normalizeAccessLevel(editingGuide.accessLevel, 'user'),
    }

    await set(ref(database, `guides/${finalDoc.id}`), finalDoc)

    if (isAdmin) {
      await recordAdminActivity({
        actor: currentEmployeeId || 'ADMIN',
        type: isAddingGuide ? 'guide_created' : 'guide_updated',
        subject: finalDoc.title || 'ไม่ระบุหัวข้อ',
        details: `${isAddingGuide ? 'เพิ่ม' : 'แก้ไข'}คู่มือหมวด ${finalDoc.category} | ไฟล์: ${finalDoc.fileName}`,
      })
    }

    setEditingGuide(null)
    setIsAddingGuide(false)
  }

  const handleGuideFileUpload = (file: File | null) => {
    if (!file || !editingGuide) return
    const reader = new FileReader()
    reader.onload = () => {
      setEditingGuide({
        ...editingGuide,
        fileUrl: '',
        fileDataUrl: String(reader.result ?? ''),
        fileName: file.name
      })
    }
    reader.readAsDataURL(file)
  }

  const downloadGuide = async (doc: GuideDoc) => {
    await logGuideAccess('download_document', doc)

    const downloadableUrl = doc.fileDataUrl || doc.fileUrl

    if (downloadableUrl) {
      const link = document.createElement('a')
      link.href = downloadableUrl
      link.download = doc.fileName || `${doc.title}.pdf`
      link.click()
      return
    }

    const blob = new Blob([`คู่มือ: ${doc.title}`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = doc.fileName || `${doc.title}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatLoginIdentifier = (attempt: LoginAttempt) => {
    const normalized = attempt.employeeId.trim().toLowerCase()
    if (attempt.isAdmin || attempt.role === 'admin' || normalized === 'admin') {
      return `${attempt.employeeId} (admin)`
    }
    return attempt.employeeId
  }

  return (
    <main className="dashboard-content">
      {activeView === 'products' && canOpenProducts ? (
        <ProductsPage isAdmin={isAdmin} currentEmployeeId={currentEmployeeId} onBack={() => setActiveView('menu')} />
      ) : activeView === 'login-history' && canOpenLoginHistory ? (
        <div className="guide-page">
          <div className="guide-page-header">
            <button className="back-btn" onClick={() => setActiveView('menu')}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
              ย้อนกลับ
            </button>
            <div className="guide-page-title">
              <h2>ดูประวัติการ login</h2>
              <p>รายการการเข้าใช้งานที่บันทึกจาก Firebase</p>
            </div>
          </div>

          <div className="login-history-toolbar">
            <div className="date-filter-wrapper">
              <span className="date-filter-label">เลือกวันที่:</span>
              <input 
                type="date" 
                className="date-filter-input" 
                value={loginDateFilter}
                onChange={(e) => setLoginDateFilter(e.target.value)}
              />
              <button className="date-filter-btn" onClick={() => loadLoginLogs(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                ค้นหา
              </button>
            </div>
            
            <button
              type="button"
              className="date-filter-refresh"
              onClick={() => loadLoginLogs(false)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              รีเฟรช
            </button>
          </div>

          {loginHistoryLoading && <div className="products-empty">กำลังโหลดประวัติการ login...</div>}
          {loginHistoryError && <div className="products-empty">{loginHistoryError}</div>}

          {!loginHistoryLoading && !loginHistoryError && (
            <div className="login-history-list">
              {loginAttempts.length === 0 ? (
                <div className="products-empty">ยังไม่มีข้อมูลประวัติ login</div>
              ) : (
                loginAttempts.map((attempt) => (
                  <article key={attempt.id} className="login-history-card premium-card">
                    <div className="login-history-main">
                      <div className={`login-history-status ${attempt.status}`}>
                        {attempt.status === 'success' ? 'สำเร็จ' : 'ไม่สำเร็จ'}
                      </div>
                      <div className="login-history-meta">
                        <h3>{formatLoginIdentifier(attempt) || '-'}</h3>
                        <p>{attempt.reason || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
                      </div>
                    </div>
                    <div className="login-history-time">
                      {attempt.createdAt ? new Date(attempt.createdAt).toLocaleString('th-TH') : '-'}
                    </div>
                  </article>
                ))
              )}
            </div>
          )}
          
          {loginHasMore && !loginHistoryLoading && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button className="guide-download-btn" onClick={() => loadLoginLogs(true)}>
                โหลดเพิ่มเติม
              </button>
            </div>
          )}

          <div className="guide-page-title" style={{ marginTop: '36px' }}>
            <h2>ประวัติการแก้ไขของ admin</h2>
            <p>บันทึกว่าผู้ดูแลคนไหนเพิ่ม แก้ไข หรือลบข้อมูลอะไร</p>
          </div>

          <div className="login-history-list">
            {activityRecords.length === 0 ? (
              <div className="products-empty">ยังไม่มีประวัติการแก้ไขของ admin</div>
            ) : (
              activityRecords.map((record) => (
                <article key={record.id} className="login-history-card premium-card">
                  <div className="login-history-main">
                    <div className={`login-history-status ${record.type.includes('deleted') ? 'failed' : 'success'}`}>
                      {record.type.includes('deleted')
                        ? 'ลบ'
                        : record.type.includes('created')
                          ? 'เพิ่ม'
                          : record.type.includes('moved')
                            ? 'ย้าย'
                            : 'แก้ไข'}
                    </div>
                    <div className="login-history-meta">
                      <h3>{record.subject}</h3>
                      <p>
                        {record.actor || 'ADMIN'} · {record.details}
                      </p>
                    </div>
                  </div>
                  <div className="login-history-time">
                    {record.createdAt ? new Date(record.createdAt).toLocaleString('th-TH') : '-'}
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="guide-page-title" style={{ marginTop: '36px' }}>
            <h2>ประวัติการเปิดดู / ดาวน์โหลดข้อมูล</h2>
            <p>ใช้ตามรอยข้อมูลสำคัญ เช่น คู่มือ เอกสาร หรือไฟล์ภายใน</p>
          </div>

          <div className="login-history-list">
            {accessRecords.length === 0 ? (
              <div className="products-empty">ยังไม่มีประวัติการเปิดดูข้อมูล</div>
            ) : (
              accessRecords.map((record) => (
                <article key={record.id} className="login-history-card premium-card">
                  <div className="login-history-main">
                    <div className={`login-history-status ${record.action.includes('download') ? 'success' : ''}`}>
                      {record.action.includes('download') ? 'ดาวน์โหลด' : 'เปิดดู'}
                    </div>
                    <div className="login-history-meta">
                      <h3>{record.resourceTitle || record.resourceId || '-'}</h3>
                      <p>
                        {record.actor || '-'} · {record.actorName || '-'} · {record.department || '-'} · {formatAccessLevelLabel(record.accessLevel || 'public')}
                      </p>
                    </div>
                  </div>
                  <div className="login-history-time">
                    {record.createdAt ? new Date(record.createdAt).toLocaleString('th-TH') : '-'}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      ) : activeView === 'guide' && canOpenGuides ? (
        <div className="guide-page">
          <SecurityWatermark currentUser={currentUser} label="คู่มือ/ข้อมูลภายใน" />
          <div className="guide-page-header">
            <button className="back-btn" onClick={() => setActiveView('menu')}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
              ย้อนกลับ
            </button>
            <div className="guide-page-title">
              <h2>คู่มือ</h2>
              <p>เลือกหมวดแล้วดาวน์โหลดไฟล์คู่มือได้ทันที</p>
            </div>
            {isAdmin && (
              <button className="add-emp-btn premium" onClick={openAddGuideModal}>
                + เพิ่มคู่มือ
              </button>
            )}
          </div>

          <div className="guide-category-grid">
            {GUIDE_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={`guide-category-card ${selectedGuideCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedGuideCategory(category)}
              >
                <strong>{category}</strong>
              </button>
            ))}
          </div>

          <div className="guide-doc-list">
            {visibleGuideDocs.map((doc) => (
              <article key={doc.id} className="guide-doc-card premium-card">
                <div className="guide-doc-main">
                  <div className="guide-doc-badge">PDF</div>
                  <div className="guide-doc-meta">
                    <h3>{doc.title}</h3>
                    <p>{doc.fileName}</p>
                  </div>
                </div>
                <div className="guide-doc-actions">
                  <button type="button" className="guide-download-btn" onClick={() => void downloadGuide(doc)}>
                    ดาวน์โหลด
                  </button>
                  {isAdmin && (
                    <>
                      <button type="button" className="emp-edit-btn" onClick={() => openEditGuideModal(doc)} title="แก้ไขคู่มือ">✎</button>
                      <button type="button" className="emp-delete-btn" onClick={() => setDeletingGuide(doc)} title="ลบคู่มือ">🗑️</button>
                    </>
                  )}
                </div>
              </article>
            ))}

            {visibleGuideDocs.length === 0 && (
              <div className="products-empty">ยังไม่มีคู่มือในหมวดนี้ หรือบัญชีนี้ยังไม่มีสิทธิ์เห็นข้อมูลในหมวดนี้</div>
            )}
          </div>
        </div>
      ) : activeView === 'menu' ? (
        <div className="main-menu-container">
          <div className="main-menu-grid">
            {canOpenDirectory && (
              <div className="main-menu-card premium-card" onClick={() => setActiveView('directory')}>
                <div className="main-menu-icon">👥</div>
                <h3>พนักงานทั้งหมด</h3>
                <p>ดูโปรไฟล์และข้อมูลพนักงานในระบบ</p>
              </div>
            )}
            {canOpenProducts && (
              <div className="main-menu-card premium-card" onClick={() => setActiveView('products')}>
                <div className="main-menu-icon">📦</div>
                <h3>รายการสินค้า</h3>
                <p>ดูข้อมูลสินค้า, สเปค และบรรจุภัณฑ์</p>
              </div>
            )}
            {canOpenGuides && (
              <div className="main-menu-card premium-card" onClick={() => setActiveView('guide')}>
                <div className="main-menu-icon">📘</div>
                <h3>คู่มือ</h3>
                <p>เปิดดูหัวข้อคู่มือและดาวน์โหลดไฟล์</p>
              </div>
            )}
            {canOpenLoginHistory && (
              <div className="main-menu-card premium-card" onClick={() => setActiveView('login-history')}>
                <div className="main-menu-icon">🕘</div>
                <h3>ดูประวัติการ login</h3>
                <p>ตรวจสอบการเข้าใช้งานของผู้ใช้</p>
              </div>
            )}
            <div className="main-menu-card premium-card disabled">
              <div className="main-menu-icon qc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.5 5.5L20 10l-5.5 2.5L12 18l-2.5-5.5L4 10l5.5-2.5L12 2z" />
                  <path d="M6 20h12" />
                  <path d="M9 20v-3h6v3" />
                </svg>
              </div>
              <h3>ระบบ QC</h3>
              <p>ฟีเจอร์ในอนาคต</p>
            </div>
          </div>
        </div>
      ) : activeView === 'directory' && canOpenDirectory ? (
        <div className="directory-container">
          <div className="directory-header">
            <button className="back-btn" onClick={() => setActiveView('menu')}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
              ย้อนกลับ
            </button>
            <h2>รายชื่อพนักงานทั้งหมด</h2>
            {canOpenDirectory && (
              <button className="add-emp-btn premium" onClick={openAddModal}>
                + เพิ่มพนักงาน
              </button>
            )}
          </div>

          <div className="dept-filter-container">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                className={`dept-filter-btn ${selectedDept === dept ? 'active' : ''}`}
                onClick={() => setSelectedDept(dept)}
              >
                <span>{dept}</span>
              </button>
            ))}
          </div>

          <div className="directory-grid">
            {employees.filter(emp => selectedDept === 'ทั้งหมด' || normalizeDepartment(emp.department) === selectedDept).map(emp => (
              <div key={emp.id} className="emp-card premium-card">
                <div
                  className="emp-avatar"
                  style={{
                    backgroundColor: emp.avatarColor,
                    backgroundImage: emp.avatarUrl ? `url(${emp.avatarUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!emp.avatarUrl && emp.name.charAt(0)}
                </div>
                <div className="emp-card-body">
                  <h3>{emp.name}</h3>
                  <p className="emp-id">รหัสพนักงาน: <strong>{emp.id}</strong></p>
                  <p className="emp-id">รหัสผ่าน: <strong>{emp.password || '-'}</strong></p>
                  <p className="emp-dept">แผนก: <span>{normalizeDepartment(emp.department)}</span></p>
                  <p className="emp-dept">สิทธิ์: <span>{formatRoleLabel(emp.role)}</span></p>
                  <p className="emp-dept">สถานะ: <span>{formatStatusLabel(emp.status)}</span></p>
                  <p className="emp-dept">ระดับข้อมูล: <span>{formatAccessLevelLabel(emp.accessLevel)}</span></p>
                  <p className="emp-date">วันที่เข้าทำงาน: <span>{new Date(emp.startDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</span></p>
                </div>
                {isAdmin && (
                  <div className="emp-actions">
                    <button
                      className="emp-edit-btn"
                      onClick={() => openEditModal(emp)}
                      title="แก้ไขข้อมูล"
                    >
                      ✎
                    </button>
                    <button
                      className="emp-delete-btn"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDeletingEmp(emp)
                      }}
                      title="ปิดสิทธิ์พนักงาน"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="main-menu-container">
          <div className="products-empty">ไม่มีสิทธิ์เปิดหน้านี้</div>
        </div>
      )}

      {/* Edit/Add Modal for Admin */}
      {isAdmin && editingEmp && (
        <div className="modal-overlay">
          <div className="modal-content premium-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isAdding ? 'เพิ่มพนักงานใหม่' : 'แก้ไขข้อมูลพนักงาน'}</h3>
              <button className="close-btn" onClick={closeEmployeeModal}>×</button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <div className="form-group">
                <label>รูปโปรไฟล์ (อัปโหลด)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setEditingEmp({ ...editingEmp, avatarUrl: url });
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label>ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={editingEmp.name}
                  onChange={e => setEditingEmp({ ...editingEmp, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>แผนก</label>
                <select
                  value={editingEmp.department}
                  onChange={e => setEditingEmp({ ...editingEmp, department: e.target.value })}
                  required
                >
                  <option value="" disabled>-- เลือกแผนก --</option>
                  {DEPARTMENT_OPTIONS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>วันที่เข้าทำงาน</label>
                <input
                  type="date"
                  value={editingEmp.startDate}
                  onChange={e => setEditingEmp({ ...editingEmp, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>รหัสพนักงาน</label>
                <input
                  type="text"
                  value={editingEmp.id}
                  onChange={e => setEditingEmp({ ...editingEmp, id: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>อีเมล</label>
                <input
                  type="email"
                  value={editingEmp.email || ''}
                  onChange={e => setEditingEmp({ ...editingEmp, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>รหัสผ่าน</label>
                <input
                  type="text"
                  value={editingEmp.password || ''}
                  onChange={e => setEditingEmp({ ...editingEmp, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>สิทธิ์การใช้งาน</label>
                <select
                  value={editingEmp.role || normalizeRole(editingEmp.permission)}
                  onChange={e => {
                    const nextRole = e.target.value as EmployeeRole
                    setEditingEmp({
                      ...editingEmp,
                      permission: nextRole,
                      role: nextRole,
                      status: nextRole === 'probation' ? 'probation' : editingEmp.status,
                      accessLevel: defaultAccessLevelForRole(nextRole),
                    })
                  }}
                  required
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>สถานะพนักงาน</label>
                <select
                  value={editingEmp.status || 'active'}
                  onChange={e => setEditingEmp({ ...editingEmp, status: e.target.value as EmployeeStatus })}
                  required
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>ระดับข้อมูลที่เห็นได้</label>
                <select
                  value={editingEmp.accessLevel || defaultAccessLevelForRole(editingEmp.role || 'user')}
                  onChange={e => setEditingEmp({ ...editingEmp, accessLevel: e.target.value as AccessLevel })}
                  required
                >
                  {ACCESS_LEVEL_OPTIONS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={closeEmployeeModal}>ยกเลิก</button>
                <button type="submit" className="save-btn">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isAdmin && deletingEmp && (
        <div className="modal-overlay">
          <div className="modal-content premium-modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ padding: '40px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#0f172a' }}>ยืนยันการปิดสิทธิ์</h3>
              <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
                คุณแน่ใจหรือไม่ว่าต้องการปิดสิทธิ์พนักงาน <strong>{deletingEmp.name}</strong>?<br />
                ข้อมูลเดิมจะยังอยู่ แต่บัญชีสถานะ resigned จะล็อกอินไม่ได้
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="cancel-btn" onClick={() => setDeletingEmp(null)}>ยกเลิก</button>
                <button
                  className="save-btn"
                  style={{ background: '#ef4444' }}
                  onClick={async () => {
                    const resignedEmployee: EmployeeProfile = {
                      ...deletingEmp,
                      status: 'resigned',
                    }
                    setEmployees(prev => prev.map(item => item.id === deletingEmp.id ? resignedEmployee : item))
                    await set(ref(database, `employees/${deletingEmp.id}`), resignedEmployee)
                    await syncAuthUserProfile(resignedEmployee.authUid, resignedEmployee)
                    if (isAdmin) {
                      await recordAdminActivity({
                        actor: currentEmployeeId || 'ADMIN',
                        type: 'employee_deleted',
                        subject: `${deletingEmp.id} - ${deletingEmp.name}`,
                        details: `ปิดสิทธิ์พนักงานเป็น resigned แผนก: ${deletingEmp.department}`,
                      })
                    }
                    setDeletingEmp(null)
                  }}
                >
                  ปิดสิทธิ์
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && editingGuide && (
        <div className="modal-overlay">
          <div className="modal-content premium-modal guide-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isAddingGuide ? 'เพิ่มคู่มือใหม่' : 'แก้ไขคู่มือ'}</h3>
              <button className="close-btn" onClick={() => { setEditingGuide(null); setIsAddingGuide(false); }}>×</button>
            </div>
            <form onSubmit={handleGuideSave} className="modal-body">
              <div className="form-group">
                <label>หมวดหมู่</label>
                <select
                  value={editingGuide.category}
                  onChange={e => setEditingGuide({ ...editingGuide, category: e.target.value })}
                  required
                >
                  {GUIDE_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>หัวข้อคู่มือ</label>
                <input
                  type="text"
                  value={editingGuide.title}
                  onChange={e => setEditingGuide({ ...editingGuide, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>แผนกที่เกี่ยวข้อง</label>
                <select
                  value={editingGuide.department || ''}
                  onChange={e => setEditingGuide({ ...editingGuide, department: e.target.value })}
                >
                  <option value="">ทุกแผนก / ไม่ระบุ</option>
                  {DEPARTMENT_OPTIONS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>ระดับข้อมูล</label>
                <select
                  value={editingGuide.accessLevel || 'department'}
                  onChange={e => setEditingGuide({ ...editingGuide, accessLevel: e.target.value as AccessLevel })}
                  required
                >
                  {ACCESS_LEVEL_OPTIONS.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>ไฟล์คู่มือ</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={e => handleGuideFileUpload(e.target.files?.[0] ?? null)}
                />
                <small className="guide-file-hint">{editingGuide.fileName || 'ยังไม่ได้เลือกไฟล์'}</small>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => { setEditingGuide(null); setIsAddingGuide(false); }}>ยกเลิก</button>
                <button type="submit" className="save-btn">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdmin && deletingGuide && (
        <div className="modal-overlay">
          <div className="modal-content premium-modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ padding: '40px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#0f172a' }}>ยืนยันการลบคู่มือ</h3>
              <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
                คุณแน่ใจหรือไม่ว่าต้องการลบ <strong>{deletingGuide.title}</strong>?
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="cancel-btn" onClick={() => setDeletingGuide(null)}>ยกเลิก</button>
                <button
                  className="save-btn"
                  style={{ background: '#ef4444' }}
                  onClick={async () => {
                    await remove(ref(database, `guides/${deletingGuide.id}`))
                    if (isAdmin) {
                      await recordAdminActivity({
                        actor: currentEmployeeId || 'ADMIN',
                        type: 'guide_deleted',
                        subject: deletingGuide.title,
                        details: `ลบคู่มือหมวด ${deletingGuide.category} | ไฟล์: ${deletingGuide.fileName}`,
                      })
                    }
                    setDeletingGuide(null)
                  }}
                >
                  ลบข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
