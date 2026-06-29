import { useState } from 'react'
import logoImg from './assets/logo.png'
import './App.css'
import MainPage from './pages/MainPage'
import MapPage from './pages/MapPage'

export default function App() {
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<'home' | 'map'>('home')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      const finalId = employeeId.trim() ? employeeId : 'BLL001'
      setEmployeeId(finalId)
      
      // Check admin role
      if (finalId.toLowerCase() === 'admin') {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }

      setSuccessMessage('เข้าสู่ระบบสำเร็จ!')
      setTimeout(() => {
        setIsLoggedIn(true)
      }, 500)
    }, 800)
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
            <button
              className={`menu-btn ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              แผนที่แยกจังหวัด
            </button>
          </nav>

          <div className="navbar-user-actions">
            <div className="user-badge">
              <svg className="user-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>รหัสพนักงาน: {employeeId.toUpperCase()}</span>
            </div>
            <button
              onClick={() => {
                setIsLoggedIn(false)
                setActiveTab('home')
                setSuccessMessage('')
                setEmployeeId('')
                setPassword('')
              }}
              className="navbar-logout-btn"
            >
              ออกจากระบบ
            </button>
          </div>
        </header>

        {activeTab === 'home' ? <MainPage isAdmin={isAdmin} /> : <MapPage isAdmin={isAdmin} />}
      </div>
    )
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">

        <div className="login-header">
          <div className="logo-container">
            <img src={logoImg} className="logo-image" alt="BLL Logo" />
          </div>
          <h2 className="login-title">BLL INTERNAL DATA</h2>
          <p className="login-subtitle">กรุณายืนยันตัวตนพนักงานเพื่อเข้าใช้งาน</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
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
  )
}
