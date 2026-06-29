import { useState } from 'react'
import ProductsPage from './ProductsPage'

export interface EmployeeProfile {
  id: string
  name: string
  department: string
  startDate: string
  avatarColor: string
  avatarUrl?: string
}

const MOCK_EMPLOYEES: EmployeeProfile[] = [
  { id: 'BLL001', name: 'ดั๊ม', department: 'ฝ่ายขาย (เหนือ/กทม)', startDate: '2022-01-15', avatarColor: '#FCA5A5' },
  { id: 'BLL002', name: 'นิตย์', department: 'ฝ่ายขาย (เหนือ)', startDate: '2020-05-10', avatarColor: '#FCD34D' },
  { id: 'BLL003', name: 'โย', department: 'ฝ่ายขาย (อีสาน)', startDate: '2021-11-20', avatarColor: '#D8B4FE' },
  { id: 'BLL004', name: 'ต้อ', department: 'ฝ่ายขาย (อีสาน/กลาง)', startDate: '2023-08-05', avatarColor: '#7DD3FC' },
  { id: 'BLL005', name: 'เมฆ', department: 'ฝ่ายขาย (ตะวันออก/กลาง)', startDate: '2024-02-01', avatarColor: '#86EFAC' },
  { id: 'BLL006', name: 'นุ', department: 'ฝ่ายขาย (กลาง)', startDate: '2022-11-12', avatarColor: '#94A3B8' },
  { id: 'BLL007', name: 'หรั่ง', department: 'ฝ่ายขาย (กทม/ปริมณฑล)', startDate: '2020-03-01', avatarColor: '#FB923C' },
  { id: 'BLL008', name: 'บังเซ็ง', department: 'ฝ่ายขาย (ตะวันตก/ใต้)', startDate: '2023-05-22', avatarColor: '#FF3333' },
  { id: 'BLL009', name: 'ใหญ่', department: 'ฝ่ายขาย (ใต้)', startDate: '2021-09-09', avatarColor: '#2DD4BF' },
]

const DEPARTMENTS = ['ทั้งหมด', 'ฝ่ายขาย', 'บัญชี', 'HR', 'พนักงานคลัง', 'การตลาด', 'กราฟฟิก', 'IT & AI']

export default function MainPage({ isAdmin }: { isAdmin?: boolean }) {
  const [activeView, setActiveView] = useState<'menu' | 'directory' | 'products'>('menu')
  const [employees, setEmployees] = useState<EmployeeProfile[]>(MOCK_EMPLOYEES)
  const [selectedDept, setSelectedDept] = useState<string>('ทั้งหมด')
  
  // Edit, Add, Delete State
  const [editingEmp, setEditingEmp] = useState<EmployeeProfile | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [deletingEmp, setDeletingEmp] = useState<EmployeeProfile | null>(null)

  const openAddModal = () => {
    setEditingEmp({
      id: `BLL0${employees.length + 1}`.slice(0, 6), // Auto generate a simple ID
      name: '',
      department: '',
      startDate: new Date().toISOString().split('T')[0],
      avatarColor: '#3b82f6'
    })
    setIsAdding(true)
  }

  const openEditModal = (emp: EmployeeProfile) => {
    setEditingEmp(emp)
    setIsAdding(false)
  }
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmp) return
    if (isAdding) {
      setEmployees(prev => [...prev, editingEmp])
    } else {
      setEmployees(prev => prev.map(emp => emp.id === editingEmp.id ? editingEmp : emp))
    }
    setEditingEmp(null)
    setIsAdding(false)
  }

  return (
    <main className="dashboard-content">
      {activeView === 'products' ? (
        <ProductsPage isAdmin={isAdmin} onBack={() => setActiveView('menu')} />
      ) : activeView === 'menu' ? (
        <div className="main-menu-container">
          <div className="main-menu-grid">
            <div className="main-menu-card premium-card" onClick={() => setActiveView('directory')}>
              <div className="main-menu-icon">👥</div>
              <h3>พนักงานทั้งหมด</h3>
              <p>ดูโปรไฟล์และข้อมูลพนักงานในระบบ</p>
            </div>
            <div className="main-menu-card premium-card" onClick={() => setActiveView('products')}>
              <div className="main-menu-icon">📦</div>
              <h3>รายการสินค้า</h3>
              <p>ดูข้อมูลสินค้า, สเปค และบรรจุภัณฑ์</p>
            </div>
            <div className="main-menu-card premium-card disabled">
              <div className="main-menu-icon">📊</div>
              <h3>รายงานยอดขาย</h3>
              <p>ฟีเจอร์ในอนาคต</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="directory-container">
          <div className="directory-header">
            <button className="back-btn" onClick={() => setActiveView('menu')}>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
              ย้อนกลับ
            </button>
            <h2>รายชื่อพนักงานทั้งหมด</h2>
            {isAdmin && (
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
            {employees.filter(emp => selectedDept === 'ทั้งหมด' || emp.department.includes(selectedDept)).map(emp => (
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
                  <p className="emp-id">รหัส: <strong>{emp.id}</strong></p>
                  <p className="emp-dept">แผนก: <span>{emp.department}</span></p>
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
                      title="ลบพนักงาน"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit/Add Modal for Admin */}
      {isAdmin && editingEmp && (
        <div className="modal-overlay">
          <div className="modal-content premium-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isAdding ? 'เพิ่มพนักงานใหม่' : 'แก้ไขข้อมูลพนักงาน'}</h3>
              <button className="close-btn" onClick={() => { setEditingEmp(null); setIsAdding(false); }}>×</button>
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
                      setEditingEmp({...editingEmp, avatarUrl: url});
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label>ชื่อ-นามสกุล</label>
                <input 
                  type="text" 
                  value={editingEmp.name} 
                  onChange={e => setEditingEmp({...editingEmp, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>แผนก</label>
                <select 
                  value={editingEmp.department} 
                  onChange={e => setEditingEmp({...editingEmp, department: e.target.value})}
                  required
                >
                  <option value="" disabled>-- เลือกแผนก --</option>
                  {Array.from(new Set([...DEPARTMENTS.slice(1), editingEmp.department]))
                    .filter(Boolean)
                    .map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>วันที่เข้าทำงาน</label>
                <input 
                  type="date" 
                  value={editingEmp.startDate} 
                  onChange={e => setEditingEmp({...editingEmp, startDate: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>รหัสพนักงาน</label>
                <input 
                  type="text" 
                  value={editingEmp.id} 
                  onChange={e => setEditingEmp({...editingEmp, id: e.target.value})}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => { setEditingEmp(null); setIsAdding(false); }}>ยกเลิก</button>
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
              <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#0f172a' }}>ยืนยันการลบข้อมูล</h3>
              <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
                คุณแน่ใจหรือไม่ว่าต้องการลบพนักงาน <strong>{deletingEmp.name}</strong>?<br/>
                การกระทำนี้ไม่สามารถกู้คืนได้
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="cancel-btn" onClick={() => setDeletingEmp(null)}>ยกเลิก</button>
                <button 
                  className="save-btn" 
                  style={{ background: '#ef4444' }} 
                  onClick={() => {
                    setEmployees(prev => prev.filter(item => item.id !== deletingEmp.id))
                    setDeletingEmp(null)
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
