import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ref, remove, set, onValue } from 'firebase/database'
import { database } from '../lib/firebase'
import { recordAdminActivity, type ActivityType } from '../lib/activityLog'

export interface Product {
  id: string
  sku: string
  name: string
  category: string
  cordLength: string
  wattage: number
  acOutlets: number
  usbPorts: string
  switches: number
  material: string
  warranty: number
  productSize: string
  packageSize: string
  barcode: string
  packageWeight: number
  cartonQty: number
  cartonSize: string
  cartonWeight: number
  imageEmoji: string
  imageColor: string
  imageUrl?: string
}



const CATEGORIES = ['ทั้งหมด', 'ปลั๊กราง', 'สายต่อพ่วง', 'หัวแปลง', 'หัวชาร์จ']
const CORD_LENGTHS = ['ทั้งหมด', '1.5 เมตร', '2 เมตร', '3 เมตร', '5 เมตร', '10 เมตร', '-']
const IMAGE_ZOOM_MIN = 1
const IMAGE_ZOOM_MAX = 4
const IMAGE_ZOOM_STEP = 0.25
const IMAGE_ZOOM_WHEEL_STEP = 0.1
const IMAGE_ZOOM_WHEEL_DELAY = 80
const MAX_PRODUCT_IMAGE_BYTES = 1.5 * 1024 * 1024

const isBlobUrl = (url?: string) => Boolean(url && url.startsWith('blob:'))
const getSafeImageUrl = (url?: string) => (url && !isBlobUrl(url) ? url : '')

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(reader.error || new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'))
  reader.readAsDataURL(file)
})

interface ProductsPageProps {
  isAdmin?: boolean
  currentEmployeeId?: string
  onBack: () => void
}

export default function ProductsPage({ isAdmin, currentEmployeeId, onBack }: ProductsPageProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด')
  const [selectedCordLength, setSelectedCordLength] = useState('ทั้งหมด')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [zoomingProduct, setZoomingProduct] = useState<Product | null>(null)
  const [imageZoomScale, setImageZoomScale] = useState(1)
  const wheelZoomLockRef = useRef(false)

  const recordProductActivity = async (type: ActivityType, subject: string, details: string) => {
    if (!isAdmin) return

    try {
      await recordAdminActivity({
        actor: currentEmployeeId || 'ADMIN',
        type,
        subject,
        details,
      })
    } catch (error) {
      console.error('Unable to record product admin activity', error)
    }
  }

  const zoomImageIn = () => {
    setImageZoomScale(prev => Math.min(IMAGE_ZOOM_MAX, Number((prev + IMAGE_ZOOM_STEP).toFixed(2))))
  }

  const zoomImageOut = () => {
    setImageZoomScale(prev => Math.max(IMAGE_ZOOM_MIN, Number((prev - IMAGE_ZOOM_STEP).toFixed(2))))
  }

  const resetImageZoom = () => {
    setImageZoomScale(1)
  }


  const handleImageWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()

    // Mouse wheel / trackpad can fire many events in one swipe.
    // Lock briefly so one wheel tick changes only one small step, not 100% -> 400%.
    if (wheelZoomLockRef.current) return

    wheelZoomLockRef.current = true
    const direction = e.deltaY < 0 ? 1 : -1

    setImageZoomScale(prev => {
      const next = prev + (direction * IMAGE_ZOOM_WHEEL_STEP)
      return Math.max(IMAGE_ZOOM_MIN, Math.min(IMAGE_ZOOM_MAX, Number(next.toFixed(2))))
    })

    window.setTimeout(() => {
      wheelZoomLockRef.current = false
    }, IMAGE_ZOOM_WHEEL_DELAY)
  }

  const openImageZoom = (product: Product) => {
    setZoomingProduct(product)
    setImageZoomScale(1)
  }

  const closeImageZoom = () => {
    setZoomingProduct(null)
    setImageZoomScale(1)
  }

  useEffect(() => {
    if (!zoomingProduct) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      if (key === 'escape') {
        closeImageZoom()
        return
      }

      if (key === '+' || key === '=') {
        e.preventDefault()
        setImageZoomScale(prev => Math.min(IMAGE_ZOOM_MAX, Number((prev + IMAGE_ZOOM_STEP).toFixed(2))))
        return
      }

      if (key === '-' || key === '_') {
        e.preventDefault()
        setImageZoomScale(prev => Math.max(IMAGE_ZOOM_MIN, Number((prev - IMAGE_ZOOM_STEP).toFixed(2))))
        return
      }

      if (key === '0') {
        e.preventDefault()
        setImageZoomScale(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [zoomingProduct])

  useEffect(() => {
    let mounted = true
    const productsRef = ref(database, 'products')
    
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (!mounted) return
      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, Product>
        setProducts(Object.values(data).map(product => ({ ...product, imageUrl: getSafeImageUrl(product.imageUrl) })))
      } else {
        setProducts([])
      }
      setIsLoading(false)
    }, (error) => {
      if (!mounted) return
      console.error("Error fetching products:", error)
      setIsLoading(false)
    })
    
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search)
      const matchCat = selectedCategory === 'ทั้งหมด' || p.category === selectedCategory
      const matchLen = selectedCordLength === 'ทั้งหมด' || p.cordLength === selectedCordLength
      return matchSearch && matchCat && matchLen
    })
  }, [products, search, selectedCategory, selectedCordLength])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedCategory, selectedCordLength])

  const ITEMS_PER_PAGE = 25
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedProducts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const createBlankProduct = (): Product => ({
    id: `product-${Date.now()}`,
    sku: '',
    name: '',
    category: CATEGORIES[1],
    cordLength: '',
    wattage: 0,
    acOutlets: 0,
    usbPorts: '-',
    switches: 0,
    material: '-',
    warranty: 0,
    productSize: '-',
    packageSize: '-',
    barcode: '',
    packageWeight: 0,
    cartonQty: 0,
    cartonSize: '-',
    cartonWeight: 0,
    imageEmoji: '📦',
    imageColor: '#f8fafc',
    imageUrl: ''
  })

  const openAddProduct = () => {
    setEditingProduct(createBlankProduct())
    setIsAddingProduct(true)
  }

  const openEditProduct = (product: Product) => {
    setEditingProduct({ ...product })
    setIsAddingProduct(false)
  }

  const closeProductModal = () => {
    setEditingProduct(null)
    setIsAddingProduct(false)
  }

  const handleProductImageUpload = async (file: File | null) => {
    if (!file || !editingProduct) return

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      return
    }

    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      alert('รูปภาพใหญ่เกินไป กรุณาย่อรูปให้ไม่เกิน 1.5MB ก่อนอัปโหลด')
      return
    }

    try {
      const imageUrl = await readFileAsDataUrl(file)
      setEditingProduct(prev => prev ? { ...prev, imageUrl } : prev)
    } catch (error) {
      console.error('Error reading product image:', error)
      alert('ไม่สามารถอ่านไฟล์รูปภาพได้')
    }
  }

  const normalizeProduct = (product: Product): Product => ({
    ...product,
    id: product.id || `product-${Date.now()}`,
    sku: product.sku.trim(),
    name: product.name.trim(),
    category: product.category || CATEGORIES[1],
    cordLength: product.cordLength.trim() || '-',
    usbPorts: product.usbPorts.trim() || '-',
    material: product.material.trim() || '-',
    productSize: product.productSize.trim() || '-',
    packageSize: product.packageSize.trim() || '-',
    barcode: product.barcode.trim(),
    cartonSize: product.cartonSize.trim() || '-',
    imageEmoji: product.imageEmoji.trim() || '📦',
    imageColor: product.imageColor.trim() || '#f8fafc',
    imageUrl: getSafeImageUrl(product.imageUrl)
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    const finalProduct = normalizeProduct(editingProduct)

    try {
      await set(ref(database, `products/${finalProduct.id}`), finalProduct)
      if (isAddingProduct) {
        setProducts(prev => [finalProduct, ...prev])
      } else {
        setProducts(prev => prev.map(p => p.id === finalProduct.id ? finalProduct : p))
      }
      await recordProductActivity(
        isAddingProduct ? 'product_created' : 'product_updated',
        `${finalProduct.sku} - ${finalProduct.name}`,
        `${isAddingProduct ? 'เพิ่ม' : 'แก้ไข'}ข้อมูลสินค้า | หมวด: ${finalProduct.category} | กำลังไฟ: ${finalProduct.wattage}W`
      )
      closeProductModal()
    } catch (error) {
      console.error("Error saving product:", error)
      alert("ไม่สามารถบันทึกข้อมูลได้")
    }
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    try {
      await remove(ref(database, `products/${deletingProduct.id}`))
      setProducts(prev => prev.filter(p => p.id !== deletingProduct.id))
      await recordProductActivity(
        'product_deleted',
        `${deletingProduct.sku} - ${deletingProduct.name}`,
        `ลบสินค้าออกจากระบบ | หมวด: ${deletingProduct.category}`
      )
      setDeletingProduct(null)
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("ไม่สามารถลบข้อมูลได้")
    }
  }

  return (
    <div className="products-page">
      {/* Header */}
      <div className="products-header">
        <div className="products-header-top">
          <button className="back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
            ย้อนกลับ
          </button>
          <h2>รายการสินค้าทั้งหมด</h2>
          {isAdmin && (
            <button type="button" className="products-add-btn products-add-header-btn" onClick={openAddProduct}>
              + เพิ่มสินค้า
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="products-search-bar">
          <div className="products-search-input-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="ค้นหาอิสระ (SKU / ชื่อสินค้า / บาร์โค้ด)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="products-search-input"
            />
          </div>
          <div className="products-filter-group">
            <label>หมวดหมู่</label>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="products-filter-select">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="products-filter-group">
            <label>ความยาวสายไฟ</label>
            <select value={selectedCordLength} onChange={e => setSelectedCordLength(e.target.value)} className="products-filter-select">
              {CORD_LENGTHS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="products-count-badge">
            พบข้อมูลทั้งหมด <span>{filtered.length}</span> รายการ
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="products-list">
        {filtered.length === 0 ? (
          <div className="products-empty">
            <div style={{ fontSize: 48 }}>🔍</div>
            <p>ไม่พบสินค้าที่ค้นหา</p>
          </div>
        ) : isLoading ? (
          <div className="products-empty">
            <span className="spinner" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent', width: '30px', height: '30px', marginBottom: '16px' }}></span>
            <p>กำลังโหลดสินค้า...</p>
          </div>
        ) : (
          paginatedProducts.map(product => (
            <div key={product.id} className="product-card">
              {/* Admin action buttons - top right */}
              {isAdmin && (
                <div className="product-admin-actions">
                  <button
                    className="prod-edit-btn"
                    title="แก้ไขสินค้า"
                    onClick={() => openEditProduct(product)}
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    แก้ไข
                  </button>
                  <button
                    className="prod-delete-btn"
                    title="ลบสินค้า"
                    onClick={() => setDeletingProduct(product)}
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                    ลบ
                  </button>
                </div>
              )}

              <div className="product-card-main">
                {/* Image Area */}
                <button
                  type="button"
                  className="product-image-box product-image-zoom-trigger"
                  style={{ background: product.imageColor }}
                  onClick={() => openImageZoom(product)}
                  title="คลิกเพื่อดูรูปสินค้าแบบขยาย"
                >
                  {getSafeImageUrl(product.imageUrl) ? (
                    <img src={getSafeImageUrl(product.imageUrl)} alt={product.name} className="product-image-preview" />
                  ) : (
                    <span className="product-emoji">{product.imageEmoji}</span>
                  )}
                  <span className="product-zoom-hint">ขยายรูป</span>
                </button>

                {/* All Info */}
                <div className="product-core-info">
                  <div className="product-sku-row">
                    <span className="product-sku-badge">SKU: {product.sku}</span>
                    <span className="product-category-badge">{product.category}</span>
                  </div>
                  <h3 className="product-name">{product.name}</h3>

                  <div className="product-specs-section-label">≡ สเปคเชิงเทคนิค</div>
                  <div className="product-specs-grid">
                    <div className="spec-item">
                      <span className="spec-label">ความยาวสาย:</span>
                      <span className="spec-value">{product.cordLength}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">กำลังไฟ:</span>
                      <span className="spec-value">{product.wattage} วัตต์</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">ช่องเสียบ AC:</span>
                      <span className="spec-value">{product.acOutlets > 0 ? `${product.acOutlets} ช่อง` : '-'}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">สวิตซ์:</span>
                      <span className="spec-value">{product.switches > 0 ? product.switches : '-'}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">ช่อง USB:</span>
                      <span className="spec-value spec-usb">{product.usbPorts}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">วัสดุ:</span>
                      <span className="spec-value">{product.material || '-'}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">คุณสมบัติพิเศษ:</span>
                      <span className="spec-value">-</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">การรับประกัน:</span>
                      <span className="spec-value">{product.warranty > 0 ? `${product.warranty} ปี` : '-'}</span>
                    </div>
                  </div>

                  {/* Meta Boxes */}
                  <div className="product-meta-boxes">
                    <div className="meta-box">
                      <div className="meta-box-label">ขนาดสินค้า</div>
                      <div className="meta-box-value">{product.productSize}</div>
                    </div>
                    <div className="meta-box">
                      <div className="meta-box-label">ขนาดแพ็กเกจ</div>
                      <div className="meta-box-value">{product.packageSize}</div>
                    </div>
                    <div className="meta-box barcode-box">
                      <div className="meta-box-label">บาร์แพ็ค</div>
                      <div className="meta-box-value barcode-value">{product.barcode}</div>
                    </div>
                    <div className="meta-box">
                      <div className="meta-box-label">น้ำหนักแพ็ค</div>
                      <div className="meta-box-value">{product.packageWeight} kg</div>
                    </div>
                  </div>

                  {/* Carton Row */}
                  <div className="product-carton-row">
                    <div className="carton-col">
                      <span className="carton-label">บรรจุ</span>
                      <span className="carton-value">{product.cartonQty > 0 ? `ลัง ${product.cartonQty}` : '-'}</span>
                    </div>
                    <div className="carton-col">
                      <span className="carton-label">บาร์ลัง</span>
                      <span className="carton-value barcode-value">~</span>
                    </div>
                    <div className="carton-col">
                      <span className="carton-label">ขนาดลัง</span>
                      <span className="carton-value">{product.cartonSize}</span>
                    </div>
                    <div className="carton-col">
                      <span className="carton-label">น้ำหนักลัง</span>
                      <span className="carton-value">{product.cartonWeight}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="products-pagination">
          <button 
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            ก่อนหน้า
          </button>
          
          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
          </div>

          <button 
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            ถัดไป
          </button>
        </div>
      )}

      {/* Add/Edit Product Modal - rendered at body level via portal */}
      {editingProduct && createPortal(
        <div className="modal-overlay">
          <div className="modal-content premium-modal product-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isAddingProduct ? 'เพิ่มสินค้าใหม่' : 'แก้ไขข้อมูลสินค้า'}</h3>
              <button className="close-btn" onClick={closeProductModal}>×</button>
            </div>
            <form onSubmit={handleSave} className="modal-body product-edit-body">
              <div className="product-modal-image-section">
                <div className="product-form-image-preview" style={{ background: editingProduct.imageColor }}>
                  {getSafeImageUrl(editingProduct.imageUrl) ? (
                    <img src={getSafeImageUrl(editingProduct.imageUrl)} alt={editingProduct.name || 'รูปสินค้า'} />
                  ) : (
                    <span>{editingProduct.imageEmoji || '📦'}</span>
                  )}
                </div>

                <div className="product-image-upload-card">
                  <div className="form-group">
                    <label>รูปสินค้า</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleProductImageUpload(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="product-image-upload-actions">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => setEditingProduct({ ...editingProduct, imageUrl: '' })}
                    >
                      ลบรูป
                    </button>
                    <span>ถ้าไม่ใส่รูป ระบบจะแสดงไอคอนสำรองแทน</span>
                  </div>
                </div>
              </div>

              <div className="prod-edit-grid">
                <div className="form-group">
                  <label>SKU</label>
                  <input type="text" value={editingProduct.sku} onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>หมวดหมู่</label>
                  <select value={editingProduct.category} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}>
                    {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group product-name-field">
                  <label>ชื่อสินค้า</label>
                  <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>ความยาวสาย</label>
                  <input
                    type="text"
                    value={editingProduct.cordLength}
                    onChange={e => setEditingProduct({ ...editingProduct, cordLength: e.target.value })}
                    placeholder="เช่น 1.5 เมตร, 3 เมตร หรือ -"
                  />
                </div>
                <div className="form-group">
                  <label>กำลังไฟ (วัตต์)</label>
                  <input type="number" value={editingProduct.wattage} onChange={e => setEditingProduct({ ...editingProduct, wattage: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>ช่องเสียบ AC</label>
                  <input type="number" value={editingProduct.acOutlets} onChange={e => setEditingProduct({ ...editingProduct, acOutlets: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>สวิตซ์</label>
                  <input type="number" value={editingProduct.switches} onChange={e => setEditingProduct({ ...editingProduct, switches: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>ช่อง USB</label>
                  <input type="text" value={editingProduct.usbPorts} onChange={e => setEditingProduct({ ...editingProduct, usbPorts: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>วัสดุ</label>
                  <input type="text" value={editingProduct.material} onChange={e => setEditingProduct({ ...editingProduct, material: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>การรับประกัน (ปี)</label>
                  <input type="number" value={editingProduct.warranty} onChange={e => setEditingProduct({ ...editingProduct, warranty: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>ขนาดสินค้า</label>
                  <input type="text" value={editingProduct.productSize} onChange={e => setEditingProduct({ ...editingProduct, productSize: e.target.value })} placeholder="เช่น 7x22x3" />
                </div>
                <div className="form-group">
                  <label>ขนาดแพ็กเกจ</label>
                  <input type="text" value={editingProduct.packageSize} onChange={e => setEditingProduct({ ...editingProduct, packageSize: e.target.value })} placeholder="เช่น 17.5x35.2x3.1" />
                </div>
                <div className="form-group">
                  <label>บาร์โค้ด</label>
                  <input type="text" value={editingProduct.barcode} onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>น้ำหนักแพ็ค (kg)</label>
                  <input type="number" step="0.001" value={editingProduct.packageWeight} onChange={e => setEditingProduct({ ...editingProduct, packageWeight: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>จำนวนต่อลัง</label>
                  <input type="number" value={editingProduct.cartonQty} onChange={e => setEditingProduct({ ...editingProduct, cartonQty: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>ขนาดลัง</label>
                  <input type="text" value={editingProduct.cartonSize} onChange={e => setEditingProduct({ ...editingProduct, cartonSize: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>น้ำหนักลัง</label>
                  <input type="number" step="0.001" value={editingProduct.cartonWeight} onChange={e => setEditingProduct({ ...editingProduct, cartonWeight: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>ไอคอนสำรอง</label>
                  <input type="text" value={editingProduct.imageEmoji} onChange={e => setEditingProduct({ ...editingProduct, imageEmoji: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>สีพื้นหลังรูป</label>
                  <input type="text" value={editingProduct.imageColor} onChange={e => setEditingProduct({ ...editingProduct, imageColor: e.target.value })} placeholder="#f8fafc" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={closeProductModal}>ยกเลิก</button>
                <button type="submit" className="save-btn">{isAddingProduct ? 'เพิ่มสินค้า' : 'บันทึก'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Product Image Zoom Modal - rendered at body level via portal */}
      {zoomingProduct && createPortal(
        <div className="product-image-zoom-overlay" onClick={closeImageZoom}>
          <div className="product-image-zoom-modal product-image-zoom-modal-advanced" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="product-image-zoom-close"
              onClick={closeImageZoom}
              aria-label="ปิดรูปสินค้า"
            >
              ×
            </button>

            <div className="product-image-zoom-main">
              <div
                className="product-image-zoom-frame"
                style={{ background: zoomingProduct.imageColor }}
                onWheel={handleImageWheelZoom}
                onDoubleClick={resetImageZoom}
                title="หมุนล้อเมาส์เพื่อซูม / ดับเบิลคลิกเพื่อรีเซ็ต"
              >
                <div
                  className="product-image-zoom-media"
                  style={{ transform: `scale(${imageZoomScale})` }}
                >
                  {getSafeImageUrl(zoomingProduct.imageUrl) ? (
                    <img src={getSafeImageUrl(zoomingProduct.imageUrl)} alt={zoomingProduct.name} />
                  ) : (
                    <span>{zoomingProduct.imageEmoji}</span>
                  )}
                </div>
              </div>

              <aside className="product-image-zoom-side" aria-label="ตัวควบคุมการซูมรูปสินค้า">
                <div className="zoom-side-title">ซูมรูปสินค้า</div>
                <div className="zoom-percent">{Math.round(imageZoomScale * 100)}%</div>

                <div className="zoom-side-actions">
                  <button type="button" onClick={zoomImageIn} disabled={imageZoomScale >= IMAGE_ZOOM_MAX}>
                    <span>+</span> ซูมเข้า
                  </button>
                  <button type="button" onClick={zoomImageOut} disabled={imageZoomScale <= IMAGE_ZOOM_MIN}>
                    <span>−</span> ซูมออก
                  </button>
                  <button type="button" onClick={resetImageZoom}>
                    <span>0</span> รีเซ็ต
                  </button>
                </div>

                <div className="zoom-shortcuts">
                  <strong>คีย์ลัด</strong>
                  <p><kbd>+</kbd> / <kbd>=</kbd> ซูมเข้า</p>
                  <p><kbd>-</kbd> ซูมออก</p>
                  <p><kbd>0</kbd> รีเซ็ต</p>
                  <p><kbd>Esc</kbd> ปิดรูป</p>
                </div>
              </aside>
            </div>

            <div className="product-image-zoom-info">
              <span>SKU: {zoomingProduct.sku || '-'}</span>
              <strong>{zoomingProduct.name || 'ยังไม่ได้ระบุชื่อสินค้า'}</strong>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirm Modal - rendered at body level via portal */}
      {deletingProduct && createPortal(
        <div className="modal-overlay">
          <div className="modal-content premium-modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ padding: '40px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#0f172a' }}>ยืนยันการลบสินค้า</h3>
              <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
                คุณแน่ใจหรือไม่ว่าต้องการลบ <strong>{deletingProduct.name}</strong>?<br />
                การกระทำนี้ไม่สามารถกู้คืนได้
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="cancel-btn" onClick={() => setDeletingProduct(null)}>ยกเลิก</button>
                <button className="save-btn" style={{ background: '#ef4444' }} onClick={handleDelete}>ลบสินค้า</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
