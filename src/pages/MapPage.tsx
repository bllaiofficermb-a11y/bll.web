import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { THAILAND_PATHS } from '../thailand-paths'
import { PROVINCE_CENTERS } from '../province-centers'
import '../App.css'

interface ProvinceDetails {
  nameTh: string
  region: string
  saleName: string
  color: string
  salesTarget: string
  activeShops: number
  shops?: string[]
}

interface SaleRep {
  name: string
  region: string
  color: string
  phone: string
  imageUrl?: string
  shops?: string[]
}

const DEFAULT_PROVINCES: Record<string, ProvinceDetails> = {
  bkk: { nameTh: 'กรุงเทพมหานคร', region: 'ภาคกลาง', saleName: 'หรั่ง', color: '#FB923C', salesTarget: '1,500,000 บาท', activeShops: 124 },
  spk: { nameTh: 'สมุทรปราการ', region: 'ภาคกลาง', saleName: 'หรั่ง', color: '#FB923C', salesTarget: '650,000 บาท', activeShops: 58 },
  nbi: { nameTh: 'นนทบุรี', region: 'ภาคกลาง', saleName: 'หรั่ง', color: '#FB923C', salesTarget: '520,000 บาท', activeShops: 42 },
  pte: { nameTh: 'ปทุมธานี', region: 'ภาคกลาง', saleName: 'หรั่ง', color: '#FB923C', salesTarget: '580,000 บาท', activeShops: 49 },
  aya: { nameTh: 'พระนครศรีอยุธยา', region: 'ภาคกลาง', saleName: 'นุ', color: '#94A3B8', salesTarget: '400,000 บาท', activeShops: 36 },
  atg: { nameTh: 'อ่างทอง', region: 'ภาคกลาง', saleName: 'นุ', color: '#94A3B8', salesTarget: '150,000 บาท', activeShops: 12 },
  lri: { nameTh: 'ลพบุรี', region: 'ภาคกลาง', saleName: 'นุ', color: '#94A3B8', salesTarget: '280,000 บาท', activeShops: 24 },
  sbr: { nameTh: 'สิงห์บุรี', region: 'ภาคกลาง', saleName: 'นุ', color: '#94A3B8', salesTarget: '120,000 บาท', activeShops: 10 },
  cnt: { nameTh: 'ชัยนาท', region: 'ภาคกลาง', saleName: 'นุ', color: '#94A3B8', salesTarget: '180,000 บาท', activeShops: 15 },
  sri: { nameTh: 'สระบุรี', region: 'ภาคกลาง', saleName: 'เมฆ', color: '#86EFAC', salesTarget: '320,000 บาท', activeShops: 28 },
  cbi: { nameTh: 'ชลบุรี', region: 'ภาคตะวันออก', saleName: 'เมฆ', color: '#86EFAC', salesTarget: '950,000 บาท', activeShops: 84 },
  ryg: { nameTh: 'ระยอง', region: 'ภาคตะวันออก', saleName: 'เมฆ', color: '#86EFAC', salesTarget: '780,000 บาท', activeShops: 62 },
  cti: { nameTh: 'จันทบุรี', region: 'ภาคตะวันออก', saleName: 'เมฆ', color: '#86EFAC', salesTarget: '310,000 บาท', activeShops: 29 },
  trt: { nameTh: 'ตราด', region: 'ภาคตะวันออก', saleName: 'เมฆ', color: '#86EFAC', salesTarget: '140,000 บาท', activeShops: 11 },
  cco: { nameTh: 'ฉะเชิงเทรา', region: 'ภาคตะวันออก', saleName: 'เมฆ', color: '#86EFAC', salesTarget: '350,000 บาท', activeShops: 31 },
  pri: { nameTh: 'ปราจีนบุรี', region: 'ภาคตะวันออก', saleName: 'เมฆ', color: '#86EFAC', salesTarget: '260,000 บาท', activeShops: 22 },
  nyk: { nameTh: 'นครนายก', region: 'ภาคตะวันออก', saleName: 'เมฆ', color: '#86EFAC', salesTarget: '180,000 บาท', activeShops: 14 },
  skw: { nameTh: 'สระแก้ว', region: 'ภาคตะวันออก', saleName: 'เมฆ', color: '#86EFAC', salesTarget: '220,000 บาท', activeShops: 18 },
  nma: { nameTh: 'นครราชสีมา', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'ต้อ', color: '#7DD3FC', salesTarget: '900,000 บาท', activeShops: 95 },
  brm: { nameTh: 'บุรีรัมย์', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'ต้อ', color: '#7DD3FC', salesTarget: '340,000 บาท', activeShops: 42 },
  srn: { nameTh: 'สุรินทร์', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'ต้อ', color: '#7DD3FC', salesTarget: '310,000 บาท', activeShops: 38 },
  ssk: { nameTh: 'ศรีสะเกษ', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'ต้อ', color: '#7DD3FC', salesTarget: '280,000 บาท', activeShops: 35 },
  ubn: { nameTh: 'อุบลราชธานี', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'ต้อ', color: '#7DD3FC', salesTarget: '450,000 บาท', activeShops: 52 },
  yst: { nameTh: 'ยโสธร', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'ต้อ', color: '#7DD3FC', salesTarget: '190,000 บาท', activeShops: 20 },
  cpm: { nameTh: 'ชัยภูมิ', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'ต้อ', color: '#7DD3FC', salesTarget: '250,000 บาท', activeShops: 27 },
  acr: { nameTh: 'อำนาจเจริญ', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'ต้อ', color: '#7DD3FC', salesTarget: '110,000 บาท', activeShops: 11 },
  bkn: { nameTh: 'บึงกาฬ', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'โย', color: '#D8B4FE', salesTarget: '130,000 บาท', activeShops: 13 },
  nbp: { nameTh: 'หนองบัวลำภู', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'โย', color: '#D8B4FE', salesTarget: '140,000 บาท', activeShops: 14 },
  kkn: { nameTh: 'ขอนแก่น', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'โย', color: '#D8B4FE', salesTarget: '560,000 บาท', activeShops: 62 },
  udn: { nameTh: 'อุดรธานี', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'โย', color: '#D8B4FE', salesTarget: '480,000 บาท', activeShops: 48 },
  lei: { nameTh: 'เลย', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'โย', color: '#D8B4FE', salesTarget: '210,000 บาท', activeShops: 21 },
  nki: { nameTh: 'หนองคาย', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'โย', color: '#D8B4FE', salesTarget: '220,000 บาท', activeShops: 23 },
  mkm: { nameTh: 'มหาสารคาม', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'โย', color: '#D8B4FE', salesTarget: '260,000 บาท', activeShops: 28 },
  ret: { nameTh: 'ร้อยเอ็ด', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'ต้อ', color: '#7DD3FC', salesTarget: '290,000 บาท', activeShops: 32 },
  ksn: { nameTh: 'กาฬสินธุ์', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'โย', color: '#D8B4FE', salesTarget: '240,000 บาท', activeShops: 25 },
  snk: { nameTh: 'สกลนคร', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'โย', color: '#D8B4FE', salesTarget: '280,000 บาท', activeShops: 29 },
  npm: { nameTh: 'นครพนม', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'โย', color: '#D8B4FE', salesTarget: '190,000 บาท', activeShops: 18 },
  mdh: { nameTh: 'มุกดาหาร', region: 'ภาคตะวันออกเฉียงเหนือ', saleName: 'โย', color: '#D8B4FE', salesTarget: '150,000 บาท', activeShops: 13 },
  cmi: { nameTh: 'เชียงใหม่', region: 'ภาคเหนือ', saleName: 'นิตย์', color: '#FACC15', salesTarget: '800,000 บาท', activeShops: 75 },
  lpn: { nameTh: 'ลำพูน', region: 'ภาคเหนือ', saleName: 'นิตย์', color: '#FACC15', salesTarget: '220,000 บาท', activeShops: 22 },
  lpg: { nameTh: 'ลำปาง', region: 'ภาคเหนือ', saleName: 'นิตย์', color: '#FACC15', salesTarget: '310,000 บาท', activeShops: 30 },
  utd: { nameTh: 'อุตรดิตถ์', region: 'ภาคเหนือ', saleName: 'ดั๊ม', color: '#FBCFE8', salesTarget: '180,000 บาท', activeShops: 16 },
  pre: { nameTh: 'แพร่', region: 'ภาคเหนือ', saleName: 'นิตย์', color: '#FACC15', salesTarget: '190,000 บาท', activeShops: 17 },
  nan: { nameTh: 'น่าน', region: 'ภาคเหนือ', saleName: 'ดั๊ม', color: '#FBCFE8', salesTarget: '150,000 บาท', activeShops: 14 },
  pyo: { nameTh: 'พะเยา', region: 'ภาคเหนือ', saleName: 'ดั๊ม', color: '#FBCFE8', salesTarget: '160,000 บาท', activeShops: 15 },
  cri: { nameTh: 'เชียงราย', region: 'ภาคเหนือ', saleName: 'ดั๊ม', color: '#FBCFE8', salesTarget: '420,000 บาท', activeShops: 38 },
  msn: { nameTh: 'แม่ฮ่องสอน', region: 'ภาคเหนือ', saleName: 'นิตย์', color: '#FACC15', salesTarget: '90,000 บาท', activeShops: 8 },
  nsn: { nameTh: 'นครสวรรค์', region: 'ภาคกลาง', saleName: 'ดั๊ม', color: '#FBCFE8', salesTarget: '480,000 บาท', activeShops: 45 },
  uti: { nameTh: 'อุทัยธานี', region: 'ภาคกลาง', saleName: 'นุ', color: '#94A3B8', salesTarget: '120,000 บาท', activeShops: 11 },
  kpt: { nameTh: 'กำแพงเพชร', region: 'ภาคกลาง', saleName: 'นิตย์', color: '#FACC15', salesTarget: '280,000 บาท', activeShops: 26 },
  tak: { nameTh: 'ตาก', region: 'ภาคตะวันตก', saleName: 'นิตย์', color: '#FACC15', salesTarget: '230,000 บาท', activeShops: 19 },
  sti: { nameTh: 'สุโขทัย', region: 'ภาคกลาง', saleName: 'นิตย์', color: '#FACC15', salesTarget: '190,000 บาท', activeShops: 18 },
  plk: { nameTh: 'พิษณุโลก', region: 'ภาคกลาง', saleName: 'ดั๊ม', color: '#FBCFE8', salesTarget: '350,000 บาท', activeShops: 33 },
  pct: { nameTh: 'พิจิตร', region: 'ภาคกลาง', saleName: 'ดั๊ม', color: '#FBCFE8', salesTarget: '180,000 บาท', activeShops: 16 },
  pnb: { nameTh: 'เพชรบูรณ์', region: 'ภาคกลาง', saleName: 'ต้อ', color: '#7DD3FC', salesTarget: '310,000 บาท', activeShops: 29 },
  rbr: { nameTh: 'ราชบุรี', region: 'ภาคตะวันตก', saleName: 'บังเซ็ง', color: '#FF3333', salesTarget: '410,000 บาท', activeShops: 38 },
  kri: { nameTh: 'กาญจนบุรี', region: 'ภาคตะวันตก', saleName: 'เมฆ', color: '#86EFAC', salesTarget: '440,000 บาท', activeShops: 41 },
  spb: { nameTh: 'สุพรรณบุรี', region: 'ภาคกลาง', saleName: 'นุ', color: '#94A3B8', salesTarget: '360,000 บาท', activeShops: 34 },
  npt: { nameTh: 'นครปฐม', region: 'ภาคกลาง', saleName: 'บังเซ็ง', color: '#FF3333', salesTarget: '450,000 บาท', activeShops: 43 },
  skn: { nameTh: 'สมุทรสาคร', region: 'ภาคกลาง', saleName: 'เมฆ', color: '#86EFAC', salesTarget: '390,000 บาท', activeShops: 37 },
  skm: { nameTh: 'สมุทรสงคราม', region: 'ภาคกลาง', saleName: 'เมฆ', color: '#86EFAC', salesTarget: '90,000 บาท', activeShops: 8 },
  pbi: { nameTh: 'เพชรบุรี', region: 'ภาคตะวันตก', saleName: 'บังเซ็ง', color: '#FF3333', salesTarget: '290,000 บาท', activeShops: 25 },
  pkn: { nameTh: 'ประจวบคีรีขันธ์', region: 'ภาคตะวันตก', saleName: 'บังเซ็ง', color: '#FF3333', salesTarget: '380,000 บาท', activeShops: 32 },
  nrt: { nameTh: 'นครศรีธรรมราช', region: 'ภาคใต้', saleName: 'ใหญ่', color: '#2DD4BF', salesTarget: '520,000 บาท', activeShops: 50 },
  kbi: { nameTh: 'กระบี่', region: 'ภาคใต้', saleName: 'ใหญ่', color: '#2DD4BF', salesTarget: '290,000 บาท', activeShops: 27 },
  pna: { nameTh: 'พังงา', region: 'ภาคใต้', saleName: 'ใหญ่', color: '#2DD4BF', salesTarget: '180,000 บาท', activeShops: 16 },
  pkt: { nameTh: 'ภูเก็ต', region: 'ภาคใต้', saleName: 'ใหญ่', color: '#2DD4BF', salesTarget: '680,000 บาท', activeShops: 64 },
  sni: { nameTh: 'สุราษฎร์ธานี', region: 'ภาคใต้', saleName: 'ใหญ่', color: '#2DD4BF', salesTarget: '490,000 บาท', activeShops: 45 },
  rng: { nameTh: 'ระนอง', region: 'ภาคใต้', saleName: 'ใหญ่', color: '#2DD4BF', salesTarget: '110,000 บาท', activeShops: 9 },
  cpn: { nameTh: 'ชุมพร', region: 'ภาคใต้', saleName: 'บังเซ็ง', color: '#FF3333', salesTarget: '260,000 บาท', activeShops: 24 },
  ska: { nameTh: 'สงขลา', region: 'ภาคใต้', saleName: 'บังเซ็ง', color: '#FF3333', salesTarget: '610,000 บาท', activeShops: 58 },
  stn: { nameTh: 'สตูล', region: 'ภาคใต้', saleName: 'ใหญ่', color: '#2DD4BF', salesTarget: '120,000 บาท', activeShops: 11 },
  trg: { nameTh: 'ตรัง', region: 'ภาคใต้', saleName: 'ใหญ่', color: '#2DD4BF', salesTarget: '280,000 บาท', activeShops: 26 },
  plg: { nameTh: 'พัทลุง', region: 'ภาคใต้', saleName: 'ใหญ่', color: '#2DD4BF', salesTarget: '190,000 บาท', activeShops: 18 },
  ptn: { nameTh: 'ปัตตานี', region: 'ภาคใต้', saleName: 'บังเซ็ง', color: '#FF3333', salesTarget: '150,000 บาท', activeShops: 14 },
  yla: { nameTh: 'ยะลา', region: 'ภาคใต้', saleName: 'บังเซ็ง', color: '#FF3333', salesTarget: '140,000 บาท', activeShops: 12 },
  nwt: { nameTh: 'นราธิวาส', region: 'ภาคใต้', saleName: 'บังเซ็ง', color: '#FF3333', salesTarget: '130,000 บาท', activeShops: 11 },
  lksg: { nameTh: 'ทะเลสาบสงขลา', region: 'แหล่งน้ำ', saleName: 'ไม่มีผู้รับผิดชอบ', color: '#a5f3fc', salesTarget: '0 บาท', activeShops: 0 }
}

const PRESET_COLORS = [
  '#FACC15', // Yellow (นิตย์)
  '#FBCFE8', // Light Pink (ดั๊ม)
  '#D8B4FE', // Light Purple (โย)
  '#7DD3FC', // Sky Blue (ต้อ)
  '#86EFAC', // Light Green (เมฆ)
  '#94A3B8', // Grey (นุ)
  '#FB923C', // Orange (หรั่ง)
  '#FF3333', // Red (บังเซ็ง)
  '#2DD4BF', // Mint (ใหญ่)
  '#ec4899', // Pink-red
  '#3b82f6', // Blue
  '#10b981'  // Emerald
]

const DEFAULT_SALES_REPS: SaleRep[] = [
  { name: 'นิตย์', region: '', color: '#FACC15', phone: '065-950-2129' },
  { name: 'ดั๊ม', region: '', color: '#FBCFE8', phone: '081-142-6843' },
  { name: 'โย', region: '', color: '#D8B4FE', phone: '065-509-4909' },
  { name: 'ต้อ', region: '', color: '#7DD3FC', phone: '065-504-1818' },
  { name: 'เมฆ', region: '', color: '#86EFAC', phone: '061-394-78xx' },
  { name: 'นุ', region: '', color: '#94A3B8', phone: '061-178-7865' },
  { name: 'หรั่ง', region: '', color: '#FB923C', phone: '065-509-4887' },
  { name: 'บังเซ็ง', region: '', color: '#FF3333', phone: '081-804-8965' },
  { name: 'ใหญ่', region: '', color: '#2DD4BF', phone: '081-142-6833' }
]

interface MapPointer {
  repName: string
  provinceId: string
  anchorX: number
  anchorY: number
  labelX: number
  labelY: number
}

interface ShopPoint {
  id: string
  x: number
  y: number
  saleName: string
  color: string
}

const DEFAULT_POINTERS: MapPointer[] = [
  { repName: 'นิตย์', provinceId: 'cmi', anchorX: 110, anchorY: 210, labelX: -50, labelY: 205.6 },
  { repName: 'ดั๊ม', provinceId: 'nan', anchorX: 200, anchorY: 160, labelX: 398, labelY: 92.7 },
  { repName: 'โย', provinceId: 'mdh', anchorX: 470, anchorY: 260, labelX: 603.2, labelY: 224.4 },
  { repName: 'ต้อ', provinceId: 'brm', anchorX: 365, anchorY: 470, labelX: 600, labelY: 420 },
  { repName: 'นุ', provinceId: 'lri', anchorX: 250, anchorY: 370, labelX: -26, labelY: 340 },
  { repName: 'เมฆ', provinceId: 'cbi', anchorX: 265, anchorY: 510, labelX: 490.1, labelY: 510.4 },
  { repName: 'หรั่ง', provinceId: 'bkk', anchorX: 220, anchorY: 465, labelX: 289.5, labelY: 630 },
  { repName: 'บังเซ็ง', provinceId: 'pkn', anchorX: 151, anchorY: 603, labelX: 17.1, labelY: 588 },
  { repName: 'ใหญ่', provinceId: 'nrt', anchorX: 200, anchorY: 780, labelX: -27.6, labelY: 741.6 }
]



const INITIAL_SHOP_POINTS: ShopPoint[] = [
  // Chiang Rai / Top area
  { id: '1', x: 202, y: 34, saleName: 'นิตย์', color: '#FACC15' },
  { id: '2', x: 159, y: 35, saleName: 'นิตย์', color: '#FACC15' },
  { id: '3', x: 184, y: 52, saleName: 'นิตย์', color: '#FACC15' },
  { id: '4', x: 174, y: 25, saleName: 'นิตย์', color: '#FACC15' },
  { id: '5', x: 143, y: 63, saleName: 'นิตย์', color: '#FACC15' },
  { id: '6', x: 160, y: 64, saleName: 'นิตย์', color: '#FACC15' },
  { id: '7', x: 142, y: 81, saleName: 'นิตย์', color: '#FACC15' },

  // Phayao
  { id: '8', x: 197, y: 72, saleName: 'นิตย์', color: '#FACC15' },

  // Phitsanulok area
  { id: '9', x: 242, y: 242, saleName: 'นิตย์', color: '#FACC15' },
  { id: '10', x: 190, y: 242, saleName: 'นิตย์', color: '#FACC15' },
  { id: '11', x: 230, y: 265, saleName: 'นิตย์', color: '#FACC15' },
  { id: '12', x: 215, y: 225, saleName: 'นิตย์', color: '#FACC15' },
  { id: '13', x: 195, y: 265, saleName: 'นิตย์', color: '#FACC15' },

  // Nakhon Sawan area
  { id: '14', x: 218, y: 347, saleName: 'นิตย์', color: '#FACC15' },
  { id: '15', x: 146, y: 333, saleName: 'นิตย์', color: '#FACC15' },
  { id: '16', x: 191, y: 355, saleName: 'นิตย์', color: '#FACC15' },
  { id: '17', x: 207, y: 363, saleName: 'นิตย์', color: '#FACC15' },
  { id: '18', x: 203, y: 328, saleName: 'นิตย์', color: '#FACC15' },
  { id: '19', x: 176, y: 323, saleName: 'นิตย์', color: '#FACC15' },

  // Points for ต้อ
  { id: '20', x: 246, y: 418, saleName: 'ต้อ', color: '#7DD3FC' },
  { id: '21', x: 267, y: 428, saleName: 'ต้อ', color: '#7DD3FC' },
  { id: '22', x: 268, y: 443, saleName: 'ต้อ', color: '#7DD3FC' },
  { id: '23', x: 249, y: 447, saleName: 'ต้อ', color: '#7DD3FC' },
  { id: '24', x: 288, y: 436, saleName: 'ต้อ', color: '#7DD3FC' },
  { id: '25', x: 304, y: 444, saleName: 'ต้อ', color: '#7DD3FC' },
  { id: '26', x: 282, y: 444, saleName: 'ต้อ', color: '#7DD3FC' },
  { id: '27', x: 266, y: 457, saleName: 'ต้อ', color: '#7DD3FC' },
  { id: '28', x: 287, y: 462, saleName: 'ต้อ', color: '#7DD3FC' },
  { id: '29', x: 303, y: 464, saleName: 'ต้อ', color: '#7DD3FC' },
  { id: '30', x: 342, y: 454, saleName: 'ต้อ', color: '#7DD3FC' },
  { id: '31', x: 325, y: 479, saleName: 'ต้อ', color: '#7DD3FC' },

  // Points for ใหญ่
  { id: '32', x: 160, y: 587, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '33', x: 123, y: 672, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '34', x: 118, y: 692, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '35', x: 116, y: 714, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '36', x: 112, y: 724, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '37', x: 111, y: 738, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '38', x: 98, y: 740, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '39', x: 273, y: 956, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '40', x: 288, y: 973, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '41', x: 301, y: 977, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '42', x: 287, y: 998, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '43', x: 298, y: 1000, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '44', x: 191, y: 927, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '45', x: 199, y: 924, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '46', x: 195, y: 932, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '47', x: 201, y: 937, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '48', x: 227, y: 940, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '49', x: 222, y: 947, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '50', x: 207, y: 937, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '51', x: 198, y: 945, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '52', x: 209, y: 947, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '53', x: 210, y: 955, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '54', x: 219, y: 958, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '55', x: 217, y: 938, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '56', x: 237, y: 943, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '57', x: 243, y: 954, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '58', x: 237, y: 963, saleName: 'ใหญ่', color: '#2DD4BF' },
  { id: '59', x: 230, y: 954, saleName: 'ใหญ่', color: '#2DD4BF' },
]

const getArrowPoints = (x1: number, y1: number, x2: number, y2: number, zoomLevel: number) => {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const length = 7 / zoomLevel
  const width = Math.PI / 6

  const arrowX1 = x2 - length * Math.cos(angle - width)
  const arrowY1 = y2 - length * Math.sin(angle - width)

  const arrowX2 = x2 - length * Math.cos(angle + width)
  const arrowY2 = y2 - length * Math.sin(angle + width)

  return `${x2},${y2} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`
}

const getOffsetEndpoint = (x1: number, y1: number, x2: number, y2: number, offset: number) => {
  const dx = x2 - x1
  const dy = y2 - y1
  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance === 0) return { x: x2, y: y2 }
  const ratio = (distance - offset) / distance
  return {
    x: x1 + dx * ratio,
    y: y1 + dy * ratio
  }
}

const getAvatarSvg = (name: string, color: string) => {
  const bgStyle = { backgroundColor: 'transparent' }
  switch (name) {
    case 'นิตย์':
      return (
        <svg viewBox="0 0 100 100" className="avatar-svg" style={bgStyle}>
          <circle cx="50" cy="50" r="50" fill={color} opacity="0.15" />
          <circle cx="50" cy="48" r="22" fill="#FDBA74" />
          <path d="M28 40c0-15 10-22 22-22s22 7 22 22v15h-6V42c0-8-5-12-16-12s-16 4-16 12v13h-6z" fill="#1E293B" />
          <circle cx="43" cy="46" r="3" fill="#1E293B" />
          <circle cx="57" cy="46" r="3" fill="#1E293B" />
          <path d="M45 56q5 4 10 0" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M25 85c0-10 10-18 25-18s25 8 25 18z" fill="#0D9488" />
        </svg>
      )
    case 'ดั๊ม':
      return (
        <svg viewBox="0 0 100 100" className="avatar-svg" style={bgStyle}>
          <circle cx="50" cy="50" r="50" fill={color} opacity="0.15" />
          <circle cx="50" cy="46" r="20" fill="#FDBA74" />
          <path d="M30 40c2-10 10-15 20-15s18 5 20 15c-3-5-10-8-20-8s-17 3-20 8z" fill="#334155" />
          <path d="M38 25l4-8 6 6 8-6 4 8" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
          <circle cx="44" cy="44" r="2.5" fill="#1E293B" />
          <circle cx="56" cy="44" r="2.5" fill="#1E293B" />
          <path d="M46 54q4 3 8 0" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M28 85c0-8 10-15 22-15s22 7 22 15z" fill="#4F46E5" />
        </svg>
      )
    case 'โย':
      return (
        <svg viewBox="0 0 100 100" className="avatar-svg" style={bgStyle}>
          <circle cx="50" cy="50" r="50" fill={color} opacity="0.15" />
          <circle cx="50" cy="46" r="20" fill="#FDE047" />
          <path d="M30 38c0-10 8-15 20-15s20 5 20 15v5H30z" fill="#78350F" />
          <path d="M32 50v8c0 10 8 18 18 18s18-8 18-18v-8z" fill="#78350F" opacity="0.9" />
          <circle cx="50" cy="48" r="17" fill="#FDBA74" />
          <circle cx="44" cy="46" r="2.5" fill="#1E293B" />
          <circle cx="56" cy="46" r="2.5" fill="#1E293B" />
          <path d="M46 56q4 2 8 0" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M28 85c0-8 10-15 22-15s22 7 22 15z" fill="#D97706" />
        </svg>
      )
    case 'ต้อ':
      return (
        <svg viewBox="0 0 100 100" className="avatar-svg" style={bgStyle}>
          <circle cx="50" cy="50" r="50" fill={color} opacity="0.15" />
          <circle cx="50" cy="47" r="20" fill="#FDBA74" />
          <path d="M30 38c5-10 12-12 20-12s15 2 20 12v5h-40z" fill="#1E293B" />
          <rect x="36" y="42" width="10" height="8" rx="2" stroke="#475569" strokeWidth="2" fill="none" />
          <rect x="54" y="42" width="10" height="8" rx="2" stroke="#475569" strokeWidth="2" fill="none" />
          <line x1="46" y1="46" x2="54" y2="46" stroke="#475569" strokeWidth="2" />
          <circle cx="41" cy="46" r="1.5" fill="#1E293B" />
          <circle cx="59" cy="46" r="1.5" fill="#1E293B" />
          <path d="M46 56q4 2 8 0" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M28 85c0-8 10-15 22-15s22 7 22 15z" fill="#2563EB" />
        </svg>
      )
    case 'เมฆ':
      return (
        <svg viewBox="0 0 100 100" className="avatar-svg" style={bgStyle}>
          <circle cx="50" cy="50" r="50" fill={color} opacity="0.15" />
          <circle cx="50" cy="48" r="20" fill="#FDBA74" />
          <path d="M32 38c2-8 10-12 18-12s16 4 18 12v6H32z" fill="#0284c7" />
          <circle cx="43" cy="46" r="2.5" fill="#1E293B" />
          <circle cx="57" cy="46" r="2.5" fill="#1E293B" />
          <path d="M45 55q5 3 10 0" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M28 85c0-8 10-15 22-15s22 7 22 15z" fill="#059669" />
        </svg>
      )
    case 'นุ':
      return (
        <svg viewBox="0 0 100 100" className="avatar-svg" style={bgStyle}>
          <circle cx="50" cy="50" r="50" fill={color} opacity="0.15" />
          <circle cx="50" cy="49" r="21" fill="#FDE047" />
          <path d="M28 42c0-12 10-18 22-18s22 6 22 18v16h-5V42c0-8-5-12-17-12s-17 4-17 12v16h-5z" fill="#B45309" />
          <circle cx="42" cy="47" r="5" stroke="#1E293B" strokeWidth="1.5" fill="none" />
          <circle cx="58" cy="47" r="5" stroke="#1E293B" strokeWidth="1.5" fill="none" />
          <line x1="47" y1="47" x2="53" y2="47" stroke="#1E293B" strokeWidth="1.5" />
          <circle cx="42" cy="47" r="1.5" fill="#1E293B" />
          <circle cx="58" cy="47" r="1.5" fill="#1E293B" />
          <path d="M46 57q4 2 8 0" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M26 85c0-8 10-15 24-15s24 7 24 15z" fill="#DB2777" />
        </svg>
      )
    case 'หรั่ง':
      return (
        <svg viewBox="0 0 100 100" className="avatar-svg" style={bgStyle}>
          <circle cx="50" cy="50" r="50" fill={color} opacity="0.15" />
          <circle cx="50" cy="47" r="20" fill="#FDBA74" />
          <path d="M30 40c0-12 10-17 20-17s20 5 20 17z" fill="#451A03" />
          <path d="M33 30l5-12 5 8 5-10 6 12" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
          <circle cx="44" cy="45" r="2.5" fill="#1E293B" />
          <circle cx="56" cy="45" r="2.5" fill="#1E293B" />
          <path d="M46 55q4 2 8 0" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M28 85c0-8 10-15 22-15s22 7 22 15z" fill="#EA580C" />
        </svg>
      )
    case 'บังเซ็ง':
      return (
        <svg viewBox="0 0 100 100" className="avatar-svg" style={bgStyle}>
          <circle cx="50" cy="50" r="50" fill={color} opacity="0.15" />
          <circle cx="50" cy="47" r="20" fill="#FDBA74" />
          <path d="M30 38c0-10 8-15 20-15s20 5 20 15v5H30z" fill="#b91c1c" />
          <circle cx="44" cy="45" r="2.5" fill="#1E293B" />
          <circle cx="56" cy="45" r="2.5" fill="#1E293B" />
          <path d="M46 55q4 2 8 0" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M28 85c0-8 10-15 22-15s22 7 22 15z" fill="#b91c1c" />
        </svg>
      )
    case 'ใหญ่':
      return (
        <svg viewBox="0 0 100 100" className="avatar-svg" style={bgStyle}>
          <circle cx="50" cy="50" r="50" fill={color} opacity="0.15" />
          <circle cx="50" cy="48" r="20" fill="#FDBA74" />
          <path d="M28 42c0-8 10-15 22-15s22 7 22 15z" fill="#1E293B" />
          <path d="M24 42h52l6 4H18z" fill="#0F172A" />
          <circle cx="44" cy="48" r="2.5" fill="#1E293B" />
          <circle cx="56" cy="48" r="2.5" fill="#1E293B" />
          <path d="M46 58q4 2 8 0" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M28 85c0-8 10-15 22-15s22 7 22 15z" fill="#059669" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 100 100" className="avatar-svg" style={bgStyle}>
          <circle cx="50" cy="50" r="50" fill={color} opacity="0.15" />
          <circle cx="50" cy="47" r="21" fill="#E2E8F0" />
          <circle cx="50" cy="45" r="14" fill="#94A3B8" />
          <path d="M26 80c0-10 10-16 24-16s24 6 24 16z" fill="#64748B" />
        </svg>
      )
  }
}

export default function MapPage({ isAdmin = false }: { isAdmin?: boolean }) {

  // Dynamic States for Assignments & Reps
  const [provinces, setProvinces] = useState<Record<string, ProvinceDetails>>(DEFAULT_PROVINCES)
  const [salesReps, setSalesReps] = useState<SaleRep[]>(DEFAULT_SALES_REPS)

  // Map States

  const [openSection, setOpenSection] = useState<'sales' | 'shop' | 'shop_list' | null>('sales')
  
  // User Read-Only Mode States


  // Selected States
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null)
  const [selectedSale, setSelectedSale] = useState<string | null>(null)
  const [hoveredProvince, setHoveredProvince] = useState<ProvinceDetails | null>(null)

  // Territory Summary Mode State

  // Sales Rep Editing Inline States
  const [editingRepIndex, setEditingRepIndex] = useState<number | null>(null)
  const [editingNameValue, setEditingNameValue] = useState('')
  const [editingPhoneValue, setEditingPhoneValue] = useState('')
  const [editingImageUrl, setEditingImageUrl] = useState('')
  const [newShopInput, setNewShopInput] = useState('')
  const [manageShopSearch, setManageShopSearch] = useState('')
  const [manageShopListRep, setManageShopListRep] = useState(DEFAULT_SALES_REPS[0]?.name || '')
  const [manageShopListProvince, setManageShopListProvince] = useState('')

  // Sales Rep Add Form States
  const [newRepName, setNewRepName] = useState('')
  const [newRepPhone, setNewRepPhone] = useState('')

  // Pointer position state & dragging logic
  const [pointers, setPointers] = useState<MapPointer[]>(DEFAULT_POINTERS)
  const [isPanning, setIsPanning] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [shopPoints, setShopPoints] = useState<ShopPoint[]>(INITIAL_SHOP_POINTS)
  const [activePointMode, setActivePointMode] = useState(false)
  const [editingPointId, setEditingPointId] = useState<string | null>(null)
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null)
  const [editingPointSale, setEditingPointSale] = useState(DEFAULT_SALES_REPS[0]?.name ?? '')
  const [newPointSale, setNewPointSale] = useState(DEFAULT_SALES_REPS[0]?.name ?? '')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isAddRepOpen, setIsAddRepOpen] = useState(false)

  const toggleSection = (section: 'sales' | 'shop' | 'shop_list') => {
    setOpenSection(prev => prev === section ? null : section)
  }

  const panStartRef = useRef({ x: 0, y: 0 })
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const MIN_ZOOM = 0.75
  const MAX_ZOOM = 10
  const ZOOM_STEP = 0.12

  const clampZoom = (value: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value))

  const clampPanOffset = (x: number, y: number, zoomLevel: number) => {
    if (!wrapperRef.current) return { x, y }
    const wrapperRect = wrapperRef.current.getBoundingClientRect()
    const maxPanX = wrapperRect.width * (zoomLevel - 0.2)
    const maxPanY = wrapperRect.height * (zoomLevel - 0.2)
    return {
      x: Math.max(-maxPanX, Math.min(x, maxPanX)),
      y: Math.max(-maxPanY, Math.min(y, maxPanY))
    }
  }

  const updateZoom = (nextZoom: number, focusPoint?: { x: number; y: number }) => {
    const clampedZoom = clampZoom(nextZoom)

    if (!containerRef.current) {
      setZoom(clampedZoom)
      return
    }

    const point = focusPoint || {
      x: containerRef.current.clientWidth / 2,
      y: containerRef.current.clientHeight / 2
    }

    setPanOffset((prev) => {
      const scale = clampedZoom / zoom
      const nextX = point.x - (point.x - prev.x) * scale
      const nextY = point.y - (point.y - prev.y) * scale
      return clampPanOffset(nextX, nextY, clampedZoom)
    })

    setZoom(clampedZoom)
  }

  // Shop Handlers
  const handleAddShop = (provinceId: string, shopName: string) => {
    if (!shopName.trim() || !provinceId) return
    setProvinces(prev => ({
      ...prev,
      [provinceId]: {
        ...prev[provinceId],
        shops: [...(prev[provinceId].shops || []), shopName.trim()]
      }
    }))
  }

  const handleRemoveShop = (provinceId: string, shopIndex: number) => {
    setProvinces(prev => {
      const p = prev[provinceId]
      if (!p || !p.shops) return prev
      return {
        ...prev,
        [provinceId]: {
          ...p,
          shops: p.shops.filter((_, i) => i !== shopIndex)
        }
      }
    })
  }

  // Dynamically calculate the center of the representative's assigned provinces
  const getRepCentroid = (repName: string) => {
    if (repName === 'ต้อ') {
      const center = PROVINCE_CENTERS['brm']
      if (center) return center
    }

    if (repName === 'บังเซ็ง') {
      const center = PROVINCE_CENTERS['pkn']
      if (center) return center
    }

    const assigned = Object.keys(provinces).filter(
      (key) => provinces[key].saleName === repName && key !== 'lksg'
    )

    if (assigned.length > 0) {
      let sumX = 0
      let sumY = 0
      let validCount = 0
      assigned.forEach((provId) => {
        const center = PROVINCE_CENTERS[provId]
        if (center) {
          sumX += center.x
          sumY += center.y
          validCount++
        }
      })
      if (validCount > 0) {
        return {
          x: sumX / validCount,
          y: sumY / validCount
        }
      }
    }

    // Fallback to default coordinates if no provinces are assigned
    const pointer = pointers.find((p) => p.repName === repName)
    return {
      x: pointer?.anchorX ?? 280,
      y: pointer?.anchorY ?? 512
    }
  }

  useEffect(() => {
    if (!isPanning && !draggingPointId) return

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!wrapperRef.current || !containerRef.current) return

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      if (draggingPointId) {
        const svgElement = containerRef.current.querySelector('svg')
        if (svgElement) {
          const point = svgElement.createSVGPoint()
          point.x = clientX
          point.y = clientY
          const svgCoords = point.matrixTransform(svgElement.getScreenCTM()!.inverse())
          setShopPoints(prev => prev.map(p =>
            p.id === draggingPointId ? { ...p, x: svgCoords.x, y: svgCoords.y } : p
          ))
        }
      } else if (isPanning) {
        const newPanX = clientX - panStartRef.current.x
        const newPanY = clientY - panStartRef.current.y

        // Constrain panning to reasonable bounds so map doesn't float away
        const wrapperRect = wrapperRef.current.getBoundingClientRect()
        const maxPanX = wrapperRect.width * (zoom - 0.2)
        const maxPanY = wrapperRect.height * (zoom - 0.2)

        setPanOffset({
          x: Math.max(-maxPanX, Math.min(newPanX, maxPanX)),
          y: Math.max(-maxPanY, Math.min(newPanY, maxPanY))
        })
      }

      if (e.cancelable && (isPanning || draggingPointId)) {
        e.preventDefault()
      }
    }

    const handleEnd = () => {
      setIsPanning(false)
      setDraggingPointId(null)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isPanning, zoom, draggingPointId])

  // Keyboard and Scroll Wheel Zoom shortcuts (for Mac and Win)
  useEffect(() => {
    // 1. Keyboard shortcuts: '+' (or '=') to zoom in, '-' to zoom out, '0' or 'r' to reset
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (activeTag === 'input' || activeTag === 'select' || activeTag === 'textarea') {
        return
      }

      if (e.key === '=' || e.key === '+') {
        updateZoom(zoom + ZOOM_STEP, lastPointerRef.current ?? undefined)
        e.preventDefault()
      } else if (e.key === '-') {
        updateZoom(zoom - ZOOM_STEP, lastPointerRef.current ?? undefined)
        e.preventDefault()
      } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
        setZoom(1)
        setPanOffset({ x: 0, y: 0 })
        e.preventDefault()
      }
    }

    // 2. Mouse Wheel zoom: hold Ctrl (Windows/Linux) or Cmd (Mac) and scroll
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        if (!containerRef.current) {
          return
        }

        const rect = containerRef.current.getBoundingClientRect()
        const focusPoint = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }
        const zoomFactor = e.deltaY < 0 ? 1 + ZOOM_STEP : 1 - ZOOM_STEP
        updateZoom(zoom * zoomFactor, focusPoint)
      }
    }

    const wrapper = wrapperRef.current
    window.addEventListener('keydown', handleKeyDown)
    if (wrapper) {
      wrapper.addEventListener('wheel', handleWheel, { passive: false })
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (wrapper) {
        wrapper.removeEventListener('wheel', handleWheel)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom])

  // Zoom to selected sales rep
  useEffect(() => {
    if (!selectedSale || !containerRef.current) return;

    const assignedProvinces = Object.keys(provinces).filter(
      (key) => provinces[key].saleName === selectedSale && key !== 'lksg'
    );

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    assignedProvinces.forEach((provId) => {
      const center = PROVINCE_CENTERS[provId];
      if (center) {
        minX = Math.min(minX, center.x);
        maxX = Math.max(maxX, center.x);
        minY = Math.min(minY, center.y);
        maxY = Math.max(maxY, center.y);
      }
    });

    const pointer = pointers.find((p) => p.repName === selectedSale);
    if (pointer) {
      minX = Math.min(minX, pointer.anchorX);
      maxX = Math.max(maxX, pointer.anchorX);
      minY = Math.min(minY, pointer.anchorY);
      maxY = Math.max(maxY, pointer.anchorY);
    }

    if (minX === Infinity) return;

    const padding = 60; // pixel padding

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // SVG coordinate system is 560x1025, but it's rendered with height: 100%
    const scaleSVG = containerHeight / 1025;

    const width_px = (maxX - minX) * scaleSVG;
    const height_px = (maxY - minY) * scaleSVG;

    const zoomX = containerWidth / (width_px + padding * 2);
    const zoomY = containerHeight / (height_px + padding * 2);
    let targetZoom = Math.min(zoomX, zoomY, MAX_ZOOM) * 1.2; // User requested more zoom

    if (targetZoom > MAX_ZOOM) targetZoom = MAX_ZOOM;
    if (targetZoom < 1.5) targetZoom = 1.5;

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const px = cx * scaleSVG;
    const py = cy * scaleSVG;

    const targetPanX = containerWidth / 2 - px * targetZoom;
    const targetPanY = containerHeight / 2 - py * targetZoom;

    setZoom(targetZoom);
    setPanOffset(clampPanOffset(targetPanX, targetPanY, targetZoom));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSale]);


  // Handle Sales Rep Update
  const handleUpdateRep = (index: number) => {
    const oldRep = salesReps[index]
    const newName = editingNameValue.trim()
    const newPhone = editingPhoneValue.trim()
    const newImageUrl = editingImageUrl.trim()
    if (!newName) return

    // 1. Update sales rep list
    const updatedReps = [...salesReps]
    updatedReps[index] = { ...oldRep, name: newName, phone: newPhone, imageUrl: newImageUrl }
    setSalesReps(updatedReps)

    // 2. Update assignments inside provinces map
    const updatedProvinces = { ...provinces }
    Object.keys(updatedProvinces).forEach((key) => {
      if (updatedProvinces[key].saleName === oldRep.name) {
        updatedProvinces[key].saleName = newName
      }
    })
    setProvinces(updatedProvinces)

    // 3. Update filter state if it was selected
    if (selectedSale === oldRep.name) {
      setSelectedSale(newName)
    }

    // 4. Update shop points
    setShopPoints(prev => prev.map(p => {
      if (p.saleName === oldRep.name) {
        return { ...p, saleName: newName }
      }
      return p
    }))

    // 5. Update name in pointers
    setPointers(prev => prev.map(p => {
      if (p.repName === oldRep.name) {
        return { ...p, repName: newName }
      }
      return p
    }))

    setEditingRepIndex(null)
  }

  // Handle Delete Sales Representative
  const handleDeleteRep = (index: number) => {
    const repToDelete = salesReps[index]
    if (!repToDelete) return

    if (selectedSale === repToDelete.name) {
      setSelectedSale(null)
    }

    setPointers(prev => prev.filter(p => p.repName !== repToDelete.name))
    setSalesReps((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Handle Add Sales Representative
  const handleAddRep = (e: FormEvent) => {
    e.preventDefault()
    const nameInput = newRepName.trim()
    const phoneInput = newRepPhone.trim()
    if (!nameInput) return

    // Check for duplicate names
    const isDuplicate = salesReps.some(r => r.name.toLowerCase() === nameInput.toLowerCase())
    if (isDuplicate) {
      alert('มีชื่อเซลล์นี้ในระบบแล้ว')
      return
    }

    // Pick preset color
    const color = PRESET_COLORS[salesReps.length % PRESET_COLORS.length]

    const newRep: SaleRep = {
      name: nameInput,
      region: '', // No region specified
      color,
      phone: phoneInput || 'ไม่มีเบอร์โทร'
    }

    // Spawn the pointer bubble at the center of the map initially
    const newPointer: MapPointer = {
      repName: nameInput,
      provinceId: '', // initially not pointing to a specific default province
      anchorX: 280,
      anchorY: 512,
      labelX: 280,
      labelY: 480
    }

    setSalesReps([...salesReps, newRep])
    setPointers([...pointers, newPointer])
    setNewRepName('')
    setNewRepPhone('')
    setIsAddRepOpen(false)
  }



  const handleAddPoint = (svgX: number, svgY: number) => {
    const sale = salesReps.find((rep) => rep.name === newPointSale)
    const color = sale?.color ?? '#64748b'
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    setShopPoints((prev) => [
      ...prev,
      {
        id,
        x: svgX,
        y: svgY,
        saleName: newPointSale,
        color
      }
    ])

    setActivePointMode(false)
  }

  const handleUpdatePoint = (id: string, saleName: string) => {
    const sale = salesReps.find((rep) => rep.name === saleName)
    const color = sale?.color ?? '#64748b'

    setShopPoints((prev) => prev.map((point) => {
      if (point.id !== id) return point
      return {
        ...point,
        saleName,
        color
      }
    }))
    setEditingPointId(null)
  }

  const handleDeletePoint = (id: string) => {
    setShopPoints((prev) => prev.filter((point) => point.id !== id))
    if (editingPointId === id) {
      setEditingPointId(null)
    }
  }

  // Get color for a province based on filters
  const getProvinceColor = (provId: string) => {
    if (provId === 'lksg') {
      return '#ffffff' // Songkhla Lake is white
    }

    const details = provinces[provId]
    if (!details) {
      return '#e2e8f0' // default grey
    }

    if (selectedSale) {
      return details.saleName === selectedSale ? details.color : '#f1f5f9'
    }
    return details.color
  }

  return (
          <main className="map-dashboard-container">
            <aside className={`map-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
              <div className="sidebar-header">
                {isSidebarOpen ? (
                  <>
                    <h3 className="sidebar-header-title">{!isAdmin ? 'ข้อมูลเซลล์' : 'เมนูข้อมูลแผนที่'}</h3>
                    <button
                      type="button"
                      className="sidebar-toggle-btn-circle"
                      onClick={() => setIsSidebarOpen(false)}
                      title="ปิดเมนู"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="sidebar-toggle-btn-circle centered"
                    onClick={() => setIsSidebarOpen(true)}
                    title="เปิดเมนู"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="3" y1="12" x2="21" y2="12"></line>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
              <div className="sidebar-scroll">
                {!isAdmin ? (
                  isSidebarOpen ? (
                    <div className="shop-list-panel sl-panel-shell sl-manage-shop-panel user-sidebar-content" style={{ padding: '0', color: '#1e293b', overflowY: 'scroll', maxHeight: '100%', background: '#fff' }}>
                      {(() => {
                        const currentManageRep = salesReps.find((rep) => rep.name === manageShopListRep)
                        const repProvinces = Object.entries(provinces).filter(([_, p]) => p.saleName === manageShopListRep)

                        if (!currentManageRep) {
                          return (
                            <div className="sl-empty-state premium-empty">
                              <span>🗂️</span>
                              <strong>ไม่พบข้อมูลเซลล์</strong>
                              <p>เลือกเซลล์ใหม่อีกครั้ง</p>
                            </div>
                          )
                        }

                        const selectedProvId = manageShopListProvince && repProvinces.some(([id]) => id === manageShopListProvince)
                          ? manageShopListProvince
                          : repProvinces[0]?.[0] || ''
                        const selectedProv = selectedProvId ? provinces[selectedProvId] : undefined
                        const shopRows = (selectedProv?.shops || [])
                          .map((shop, originalIdx) => ({ shop, originalIdx }))
                          .filter(({ shop }) => shop.toLowerCase().includes(manageShopSearch.toLowerCase()))

                        return (
                          <>
                            <div className="sl-section sl-rep-picker-section" style={{ padding: '20px 20px 10px', borderBottom: '1px solid #e2e8f0' }}>
                              <div className="sl-card-title-row compact-title">
                                <div>
                                  <span className="sl-eyebrow">เลือกเซลล์</span>
                                  <h5>เซลล์ที่ดูแลพื้นที่</h5>
                                </div>
                              </div>
                              <div className="sl-rep-chips premium">
                                {salesReps.map((rep) => (
                                  <button
                                    key={rep.name}
                                    type="button"
                                    className={`sl-rep-chip premium ${manageShopListRep === rep.name ? 'active' : ''}`}
                                    style={{ ['--chip-color' as any]: rep.color }}
                                    onClick={() => {
                                      setManageShopListRep(rep.name)
                                      setManageShopListProvince('')
                                      setManageShopSearch('')
                                    }}
                                  >
                                    <span className="sl-chip-dot" style={{ background: rep.color }} />
                                    {rep.name}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {repProvinces.length === 0 ? (
                              <div className="sl-empty-state premium-empty" style={{ margin: '20px' }}>
                                <span>🗂️</span>
                                <strong>ยังไม่มีจังหวัดที่รับผิดชอบ</strong>
                              </div>
                            ) : (
                              <>
                                <div className="sl-section sl-province-picker-section" style={{ padding: '10px 20px', borderBottom: '1px solid #e2e8f0' }}>
                                  <div className="sl-card-title-row compact-title">
                                    <div>
                                      <span className="sl-eyebrow">เลือกจังหวัด</span>
                                      <h5>จังหวัดที่รับผิดชอบ</h5>
                                    </div>
                                    <span className="sl-shop-count" style={{ background: currentManageRep.color }}>
                                      {repProvinces.length} จังหวัด
                                    </span>
                                  </div>
                                  <div className="sl-province-chips premium">
                                    {repProvinces.map(([id, p]) => (
                                      <button
                                        key={id}
                                        type="button"
                                        className={`sl-province-chip premium ${selectedProvId === id ? 'active' : ''}`}
                                        style={{ ['--chip-color' as any]: currentManageRep.color }}
                                        onClick={() => {
                                          setManageShopListProvince(id)
                                          setManageShopSearch('')
                                        }}
                                      >
                                        {p.nameTh}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="sl-section sl-list-section sl-managed-shop-list-section" style={{ padding: '10px 20px 20px' }}>
                                  <div className="sl-rep-list-header">
                                    <div>
                                      <p className="sl-section-label">ร้านค้าใน{selectedProv?.nameTh}</p>
                                      <strong>{selectedProv?.shops?.length || 0} ร้าน</strong>
                                    </div>
                                    {manageShopSearch && (
                                      <button type="button" className="sl-clear-filter-btn compact" onClick={() => setManageShopSearch('')}>
                                        ล้างค้นหา
                                      </button>
                                    )}
                                  </div>

                                  <div className="sl-search-wrapper premium-search" style={{ marginBottom: '16px' }}>
                                    <span className="sl-search-icon">⌕</span>
                                    <input
                                      type="text"
                                      placeholder="ค้นหาร้านค้า..."
                                      value={manageShopSearch}
                                      onChange={(e) => setManageShopSearch(e.target.value)}
                                      className="sl-search-input"
                                    />
                                  </div>

                                  {shopRows.length === 0 ? (
                                    <div className="sl-empty-state premium-empty manage-empty">
                                      <span>🏪</span>
                                      <strong>{manageShopSearch ? 'ไม่พบร้านค้าที่ค้นหา' : 'ยังไม่มีร้านค้าในจังหวัดนี้'}</strong>
                                    </div>
                                  ) : (
                                    <div className="sl-managed-shop-list">
                                      {shopRows.map(({ shop, originalIdx }) => (
                                        <div key={`${shop}-${originalIdx}`} className="sl-managed-shop-card" style={{ ['--point-color' as any]: currentManageRep.color, padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                          <div className="sl-point-number" style={{ background: currentManageRep.color, color: 'white', width: '28px', height: '28px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}>{originalIdx + 1}</div>
                                          <div className="sl-point-main as-static" style={{ flexGrow: 1 }}>
                                            <span style={{ display: 'block', fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{shop}</span>
                                            <small style={{ color: '#64748b', fontSize: '12px' }}>{selectedProv?.nameTh} · {currentManageRep.name}</small>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  ) : null
                ) : (
                  isSidebarOpen ? (
                    <>
                      <div className="sidebar-tab-container">
                        <div className="sidebar-tabs-header">
                          <button
                            className={`sidebar-tab-btn ${openSection === 'sales' ? 'active' : ''}`}
                            onClick={() => setOpenSection('sales')}
                          >
                            รายชื่อเซลล์
                          </button>
                          <button
                            className={`sidebar-tab-btn ${openSection === 'shop' ? 'active' : ''}`}
                            onClick={() => setOpenSection('shop')}
                          >
                            จุดร้านค้า
                          </button>
                          <button
                            className={`sidebar-tab-btn ${openSection === 'shop_list' ? 'active' : ''}`}
                            onClick={() => setOpenSection('shop_list')}
                          >
                            จัดการร้านค้า
                          </button>
                        </div>
                        <div className="sidebar-tab-content">
                          {openSection === 'sales' && (
                            <div className="shop-list-panel sl-panel-shell sl-sales-panel">
                              <div className={`sl-premium-card sl-add-rep-card ${isAddRepOpen ? 'open' : 'collapsed'}`}>
                                <button
                                  type="button"
                                  className="sl-accordion-head"
                                  onClick={() => setIsAddRepOpen((prev) => !prev)}
                                >
                                  <div>
                                    <span className="sl-eyebrow">เพิ่มข้อมูล</span>
                                    <h5>เพิ่มเซลล์ใหม่</h5>
                                  </div>
                                  <span className={`sl-soft-icon ${isAddRepOpen ? 'open' : ''}`}>{isAddRepOpen ? '−' : '+'}</span>
                                </button>
                                {isAddRepOpen && (
                                  <form onSubmit={handleAddRep} className="sl-add-rep-form">
                                    <div className="sl-add-rep-grid">
                                      <label className="sl-form-field">
                                        <span>ชื่อเซลล์</span>
                                        <input
                                          type="text"
                                          placeholder="เช่น สมชาย"
                                          value={newRepName}
                                          onChange={(e) => setNewRepName(e.target.value)}
                                          className="sl-add-input"
                                          required
                                        />
                                      </label>
                                      <label className="sl-form-field">
                                        <span>เบอร์โทร</span>
                                        <input
                                          type="text"
                                          placeholder="เช่น 081-xxx-xxxx"
                                          value={newRepPhone}
                                          onChange={(e) => setNewRepPhone(e.target.value)}
                                          className="sl-add-input"
                                          required
                                        />
                                      </label>
                                    </div>
                                    <button type="submit" className="sl-add-rep-btn">
                                      <span>เพิ่มเซลล์</span>
                                      <strong>+</strong>
                                    </button>
                                  </form>
                                )}
                              </div>

                              <div className="sl-section sl-list-section">
                                <div className="sl-rep-list-header">
                                  <div>
                                    <p className="sl-section-label">รายชื่อในระบบ</p>
                                    <strong>{salesReps.length} คน</strong>
                                  </div>
                                  {selectedSale && (
                                    <button type="button" onClick={() => setSelectedSale(null)} className="sl-clear-filter-btn compact">
                                      ล้างตัวกรอง
                                    </button>
                                  )}
                                </div>

                                <div className="sl-reps-list premium">
                                  {salesReps.map((rep, idx) => {
                                    const isSelected = selectedSale === rep.name
                                    const assignedProvinces = Object.values(provinces).filter((p) => p.saleName === rep.name)
                                    const assignedProvincesCount = assignedProvinces.length
                                    const assignedProvinceNames = assignedProvinces.slice(0, 3).map((p) => p.nameTh).join(', ')
                                    const isEditing = editingRepIndex === idx

                                    return (
                                      <div
                                        key={rep.name}
                                        className={`sl-rep-card premium ${isSelected ? 'selected' : ''}`}
                                        style={{ ['--rep-color' as any]: rep.color }}
                                      >
                                        {isEditing ? (
                                          <div className="sl-rep-edit premium-edit">
                                            <div className="sl-edit-heading">
                                              <span className="sl-edit-dot" style={{ background: rep.color }} />
                                              <strong>แก้ไขข้อมูลเซลล์</strong>
                                            </div>
                                            <label className="sl-form-field">
                                              <span>ชื่อเซลล์</span>
                                              <input
                                                type="text"
                                                value={editingNameValue}
                                                onChange={(e) => setEditingNameValue(e.target.value)}
                                                className="sl-add-input"
                                                placeholder="ชื่อเซลล์"
                                                autoFocus
                                              />
                                            </label>
                                            <label className="sl-form-field">
                                              <span>เบอร์โทร</span>
                                              <input
                                                type="text"
                                                value={editingPhoneValue}
                                                onChange={(e) => setEditingPhoneValue(e.target.value)}
                                                className="sl-add-input"
                                                placeholder="เบอร์โทร"
                                              />
                                            </label>
                                            <label className="sl-form-field">
                                              <span>รูปโปรไฟล์</span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0]
                                                  if (file) {
                                                    const reader = new FileReader()
                                                    reader.onload = (event) => {
                                                      if (event.target?.result) {
                                                        setEditingImageUrl(event.target.result as string)
                                                      }
                                                    }
                                                    reader.readAsDataURL(file)
                                                  }
                                                }}
                                                className="sl-add-input file-input"
                                              />
                                            </label>
                                            {editingImageUrl && (
                                              <div className="sl-image-preview-row">
                                                <img src={editingImageUrl} alt="preview" />
                                                <button type="button" onClick={() => setEditingImageUrl('')}>ลบรูป</button>
                                              </div>
                                            )}
                                            <div className="sl-edit-actions">
                                              <button type="button" onClick={() => handleUpdateRep(idx)} className="sl-action-primary">บันทึก</button>
                                              <button type="button" onClick={() => setEditingRepIndex(null)} className="sl-action-muted">ยกเลิก</button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="sl-rep-card-inner premium">
                                            <button
                                              type="button"
                                              className="sl-rep-card-left premium"
                                              onClick={() => setSelectedSale(isSelected ? null : rep.name)}
                                            >
                                              <div className="sl-rep-avatar premium" style={{ background: rep.color, overflow: 'hidden' }}>
                                                {rep.imageUrl
                                                  ? <img src={rep.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={rep.name} />
                                                  : <span>{rep.name.charAt(0)}</span>
                                                }
                                              </div>
                                              <div className="sl-rep-card-info premium">
                                                <span className="sl-rep-card-name">{rep.name}</span>
                                                <span className="sl-rep-card-sub">{rep.phone}</span>
                                                <span className="sl-rep-provinces">
                                                  {assignedProvinceNames || 'ยังไม่มีจังหวัด'}{assignedProvincesCount > 3 ? ` +${assignedProvincesCount - 3}` : ''}
                                                </span>
                                              </div>
                                            </button>
                                            <div className="sl-rep-card-meta">
                                              <span className="sl-province-count-pill">{assignedProvincesCount} จังหวัด</span>
                                              {isSelected && <span className="sl-active-pill">กำลังดู</span>}
                                            </div>
                                            <div className="sl-rep-card-actions premium">
                                              <button
                                                type="button"
                                                className="sl-icon-btn"
                                                title="แก้ไข"
                                                onClick={() => {
                                                  setEditingRepIndex(idx)
                                                  setEditingNameValue(rep.name)
                                                  setEditingPhoneValue(rep.phone || '')
                                                  setEditingImageUrl(rep.imageUrl || '')
                                                }}
                                              >
                                                ✎
                                              </button>
                                              <button
                                                type="button"
                                                className="sl-icon-btn delete"
                                                title="ลบ"
                                                onClick={() => handleDeleteRep(idx)}
                                              >
                                                ×
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {openSection === 'shop' && (
                            <div className="shop-list-panel sl-panel-shell sl-points-panel">
                              {(() => {
                                const filteredPoints = shopPoints.filter((p) => p.saleName === newPointSale)
                                return (
                                  <>
                                    <div className="sl-section sl-rep-picker-section">
                                      <div className="sl-card-title-row compact-title">
                                        <div>
                                          <span className="sl-eyebrow">ผู้ดูแล</span>
                                          <h5>เลือกเซลล์ผู้ดูแล</h5>
                                        </div>
                                        <button
                                          className={`sl-inline-add-point-btn ${activePointMode ? 'active' : ''}`}
                                          onClick={() => {
                                            setActivePointMode((prev) => {
                                              const next = !prev;
                                              if (next) setSelectedProvinceId(null);
                                              return next;
                                            })
                                          }}
                                          type="button"
                                        >
                                          <span>{activePointMode ? '⌖' : '+'}</span>
                                          {activePointMode ? 'กำลังวางจุด' : 'เพิ่มจุด'}
                                        </button>
                                      </div>
                                      <div className="sl-rep-chips premium">
                                        {salesReps.map((rep) => (
                                          <button
                                            key={rep.name}
                                            type="button"
                                            className={`sl-rep-chip premium ${newPointSale === rep.name ? 'active' : ''}`}
                                            style={{ ['--chip-color' as any]: rep.color }}
                                            onClick={() => setNewPointSale(rep.name)}
                                          >
                                            <span className="sl-chip-dot" style={{ background: rep.color }} />
                                            {rep.name}
                                          </button>
                                        ))}
                                      </div>
                                    </div>


                                    <div className="sl-section sl-list-section">
                                      <div className="sl-rep-list-header">
                                        <div>
                                          <p className="sl-section-label">รายการจุดของ {newPointSale}</p>
                                          <strong>{filteredPoints.length} จุด</strong>
                                        </div>
                                      </div>

                                      {filteredPoints.length === 0 ? (
                                        <div className="sl-empty-state premium-empty">
                                          <span>📍</span>
                                          <strong>ยังไม่มีจุดร้านค้า</strong>
                                          <p>กดปุ่มเพิ่มจุด แล้วคลิกตำแหน่งบนแผนที่</p>
                                        </div>
                                      ) : (
                                        <div className="sl-point-list">
                                          {filteredPoints.map((point, idx) => {
                                            const isActive = editingPointId === point.id
                                            return (
                                              <div key={point.id} className={`sl-point-card ${isActive ? 'editing' : ''}`} style={{ ['--point-color' as any]: point.color }}>
                                                <div className="sl-point-number">{idx + 1}</div>
                                                {isActive ? (
                                                  <div className="sl-point-edit-box">
                                                    <label className="sl-form-field">
                                                      <span>เปลี่ยนผู้ดูแลจุดนี้</span>
                                                      <select
                                                        className="sl-add-input"
                                                        value={editingPointSale}
                                                        onChange={(e) => setEditingPointSale(e.target.value)}
                                                      >
                                                        {salesReps.map((rep) => (
                                                          <option key={rep.name} value={rep.name}>{rep.name}</option>
                                                        ))}
                                                      </select>
                                                    </label>
                                                    <div className="sl-edit-actions">
                                                      <button type="button" className="sl-action-primary" onClick={() => handleUpdatePoint(point.id, editingPointSale)}>บันทึก</button>
                                                      <button type="button" className="sl-action-muted" onClick={() => setEditingPointId(null)}>ยกเลิก</button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <>
                                                    <button
                                                      type="button"
                                                      className="sl-point-main"
                                                      onClick={() => { setEditingPointId(point.id); setEditingPointSale(point.saleName) }}
                                                    >
                                                      <span className="sl-point-dot" />
                                                      <span>
                                                        <strong>จุดร้านค้า #{idx + 1}</strong>
                                                        <small>X {Math.round(point.x)} · Y {Math.round(point.y)}</small>
                                                      </span>
                                                    </button>
                                                    <div className="sl-point-actions">
                                                      <button
                                                        type="button"
                                                        className="sl-icon-btn"
                                                        title="แก้ไข"
                                                        onClick={() => { setEditingPointId(point.id); setEditingPointSale(point.saleName) }}
                                                      >
                                                        ✎
                                                      </button>
                                                      <button
                                                        type="button"
                                                        className="sl-icon-btn delete"
                                                        title="ลบ"
                                                        onClick={() => handleDeletePoint(point.id)}
                                                      >
                                                        ×
                                                      </button>
                                                    </div>
                                                  </>
                                                )}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )
                              })()}
                            </div>
                          )}

                          {openSection === 'shop_list' && (
                            <div className="shop-list-panel sl-panel-shell sl-manage-shop-panel">
                              {(() => {
                                const currentManageRep = salesReps.find((rep) => rep.name === manageShopListRep)
                                const repProvinces = Object.entries(provinces).filter(([_, p]) => p.saleName === manageShopListRep)

                                if (!currentManageRep) {
                                  return (
                                    <div className="sl-empty-state premium-empty">
                                      <span>🗂️</span>
                                      <strong>ไม่พบข้อมูลเซลล์</strong>
                                      <p>เลือกเซลล์ใหม่อีกครั้ง</p>
                                    </div>
                                  )
                                }

                                const selectedProvId = manageShopListProvince && repProvinces.some(([id]) => id === manageShopListProvince)
                                  ? manageShopListProvince
                                  : repProvinces[0]?.[0] || ''
                                const selectedProv = selectedProvId ? provinces[selectedProvId] : undefined
                                const shopRows = (selectedProv?.shops || [])
                                  .map((shop, originalIdx) => ({ shop, originalIdx }))
                                  .filter(({ shop }) => shop.toLowerCase().includes(manageShopSearch.toLowerCase()))

                                return (
                                  <>
                                    <div className="sl-section sl-rep-picker-section">
                                      <div className="sl-card-title-row compact-title">
                                        <div>
                                          <span className="sl-eyebrow">เลือกเซลล์</span>
                                          <h5>เลือกเซลล์</h5>
                                        </div>
                                      </div>
                                      <div className="sl-rep-chips premium">
                                        {salesReps.map((rep) => (
                                          <button
                                            key={rep.name}
                                            type="button"
                                            className={`sl-rep-chip premium ${manageShopListRep === rep.name ? 'active' : ''}`}
                                            style={{ ['--chip-color' as any]: rep.color }}
                                            onClick={() => {
                                              setManageShopListRep(rep.name)
                                              setManageShopListProvince('')
                                              setManageShopSearch('')
                                            }}
                                          >
                                            <span className="sl-chip-dot" style={{ background: rep.color }} />
                                            {rep.name}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {repProvinces.length === 0 ? (
                                      <div className="sl-empty-state premium-empty">
                                        <span>🗂️</span>
                                        <strong>ยังไม่มีจังหวัดที่รับผิดชอบ</strong>
                                        <p>เลือกพื้นที่ให้เซลล์ก่อน แล้วค่อยเพิ่มร้านค้า</p>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="sl-section sl-province-picker-section">
                                          <div className="sl-card-title-row compact-title">
                                            <div>
                                              <span className="sl-eyebrow">เลือกจังหวัด</span>
                                              <h5>จังหวัดที่รับผิดชอบ</h5>
                                            </div>
                                            <span className="sl-shop-count" style={{ background: currentManageRep.color }}>
                                              {repProvinces.length} จังหวัด
                                            </span>
                                          </div>
                                          <div className="sl-province-chips premium">
                                            {repProvinces.map(([id, p]) => (
                                              <button
                                                key={id}
                                                type="button"
                                                className={`sl-province-chip premium ${selectedProvId === id ? 'active' : ''}`}
                                                style={{ ['--chip-color' as any]: currentManageRep.color }}
                                                onClick={() => {
                                                  setManageShopListProvince(id)
                                                  setManageShopSearch('')
                                                }}
                                              >
                                                {p.nameTh}
                                              </button>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="sl-section sl-list-section sl-managed-shop-list-section">
                                          <div className="sl-rep-list-header">
                                            <div>
                                              <p className="sl-section-label">ร้านค้าใน{selectedProv?.nameTh}</p>
                                              <strong>{selectedProv?.shops?.length || 0} ร้าน</strong>
                                            </div>
                                            {manageShopSearch && (
                                              <button type="button" className="sl-clear-filter-btn compact" onClick={() => setManageShopSearch('')}>
                                                ล้างค้นหา
                                              </button>
                                            )}
                                          </div>

                                          <div className="sl-add-shop premium-add-shop">
                                            <input
                                              type="text"
                                              placeholder="ชื่อร้านค้าใหม่..."
                                              value={newShopInput}
                                              onChange={(e) => setNewShopInput(e.target.value)}
                                              className="sl-add-input"
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newShopInput.trim()) {
                                                  handleAddShop(selectedProvId, newShopInput)
                                                  setNewShopInput('')
                                                }
                                              }}
                                            />
                                            <button
                                              type="button"
                                              className="sl-add-btn premium"
                                              style={{ background: currentManageRep.color }}
                                              onClick={() => {
                                                handleAddShop(selectedProvId, newShopInput)
                                                setNewShopInput('')
                                              }}
                                              disabled={!newShopInput.trim() || !selectedProvId}
                                            >
                                              + เพิ่ม
                                            </button>
                                          </div>

                                          <div className="sl-search-wrapper premium-search">
                                            <span className="sl-search-icon">⌕</span>
                                            <input
                                              type="text"
                                              placeholder="ค้นหาร้านค้า..."
                                              value={manageShopSearch}
                                              onChange={(e) => setManageShopSearch(e.target.value)}
                                              className="sl-search-input"
                                            />
                                          </div>

                                          {shopRows.length === 0 ? (
                                            <div className="sl-empty-state premium-empty manage-empty">
                                              <span>🏪</span>
                                              <strong>{manageShopSearch ? 'ไม่พบร้านค้าที่ค้นหา' : 'ยังไม่มีร้านค้าในจังหวัดนี้'}</strong>
                                              <p>{manageShopSearch ? 'ลองใช้คำค้นที่สั้นลง' : 'เพิ่มร้านค้าใหม่จากช่องด้านบน'}</p>
                                            </div>
                                          ) : (
                                            <div className="sl-managed-shop-list">
                                              {shopRows.map(({ shop, originalIdx }) => (
                                                <div key={`${shop}-${originalIdx}`} className="sl-managed-shop-card" style={{ ['--point-color' as any]: currentManageRep.color }}>
                                                  <div className="sl-point-number">{originalIdx + 1}</div>
                                                  <div className="sl-point-main as-static">
                                                    <span className="sl-point-dot" />
                                                    <span>
                                                      <strong>{shop}</strong>
                                                      <small>{selectedProv?.nameTh} · {currentManageRep.name}</small>
                                                    </span>
                                                  </div>
                                                  <div className="sl-point-actions">
                                                    <button
                                                      type="button"
                                                      className="sl-icon-btn delete"
                                                      title="ลบร้านค้า"
                                                      onClick={() => handleRemoveShop(selectedProvId, originalIdx)}
                                                    >
                                                      ×
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                        </div>
                                      </>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          )}

                        </div>
                      </div>
                  </>
                ) : (
                  <div className="sidebar-closed-icons">
                      <>
                        <button
                          type="button"
                          className={`sidebar-icon-btn ${openSection === 'sales' ? 'active' : ''}`}
                          onClick={() => {
                            setIsSidebarOpen(true)
                            if (openSection !== 'sales') toggleSection('sales')
                          }}
                          title="รายชื่อเซลล์ผู้รับผิดชอบเขตพื้นที่"
                        >
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        </button>

                        <button
                          type="button"
                          className={`sidebar-icon-btn ${openSection === 'shop' ? 'active' : ''}`}
                          onClick={() => {
                            setIsSidebarOpen(true)
                            if (openSection !== 'shop') toggleSection('shop')
                          }}
                          title="จุดร้านค้าในแผนที่"
                        >
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                          </svg>
                        </button>

                        <button
                          type="button"
                          className={`sidebar-icon-btn ${openSection === 'shop_list' ? 'active' : ''}`}
                          onClick={() => {
                            setIsSidebarOpen(true)
                            if (openSection !== 'shop_list') toggleSection('shop_list')
                          }}
                          title="จัดการร้านค้าที่รับผิดชอบ"
                        >
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                            <line x1="8" y1="11" x2="16" y2="11"></line>
                            <line x1="8" y1="15" x2="16" y2="15"></line>
                          </svg>
                        </button>
                      </>
                  </div>
                  )
                )}
              </div>
            </aside>

            <div className="map-visual-section">

              <div
                className="svg-thailand-wrapper"
                ref={wrapperRef}
                style={{ cursor: activePointMode ? 'crosshair' : zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
                onMouseDown={(e) => {
                  if (e.button !== 0) return
                  if ((e.target as HTMLElement).closest('.rep-map-bubble')) return
                  if (activePointMode) return
                  setIsPanning(true)
                  panStartRef.current = {
                    x: e.clientX - panOffset.x,
                    y: e.clientY - panOffset.y
                  }
                }}
                onClick={(e) => {
                  if (!activePointMode) {
                    setSelectedProvinceId(null)
                    return
                  }
                  if (!containerRef.current) return
                  const svgElement = containerRef.current.querySelector('svg')
                  if (!svgElement) return
                  const point = svgElement.createSVGPoint()
                  point.x = e.clientX
                  point.y = e.clientY
                  const svgCoords = point.matrixTransform(svgElement.getScreenCTM()!.inverse())
                  handleAddPoint(svgCoords.x, svgCoords.y)
                }}
                onMouseMove={(e) => {
                  if (!containerRef.current) return
                  const rect = containerRef.current.getBoundingClientRect()
                  lastPointerRef.current = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                  }
                }}
                onTouchStart={(e) => {
                  if ((e.target as HTMLElement).closest('.rep-map-bubble')) return
                  if (activePointMode) return
                  const touch = e.touches[0]
                  setIsPanning(true)
                  panStartRef.current = {
                    x: touch.clientX - panOffset.x,
                    y: touch.clientY - panOffset.y
                  }
                }}
                onTouchMove={(e) => {
                  if (!containerRef.current) return
                  const touch = e.touches[0]
                  const rect = containerRef.current.getBoundingClientRect()
                  lastPointerRef.current = {
                    x: touch.clientX - rect.left,
                    y: touch.clientY - rect.top
                  }
                }}
              >
                <div
                  className="map-svg-relative-container"
                  ref={containerRef}
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                    transformOrigin: 'top left',
                    transition: isPanning ? 'none' : 'transform 0.15s ease-out'
                  }}
                >
                  <svg viewBox="0 0 560 1025" className="thailand-detailed-svg">
                    {THAILAND_PATHS.map((prov: any) => {
                      const details = provinces[prov.id]
                      return (
                        <path
                          key={prov.id}
                          d={prov.d}
                          id={prov.id}
                          fill={getProvinceColor(prov.id)}
                          className={`province-detailed-path ${selectedProvinceId === prov.id ? 'selected' : ''}`}
                          onClick={(e) => {
                            if (!isAdmin) return;
                            if (activePointMode) return; // Allow bubbling to add point
                            e.stopPropagation()
                            if (prov.id !== 'lksg') {
                              setSelectedProvinceId(prov.id)
                            }
                          }}
                          onMouseEnter={() => {
                            if (details && prov.id !== 'lksg') {
                              setHoveredProvince(details)
                            }
                          }}
                          onMouseLeave={() => setHoveredProvince(null)}
                        />
                      )
                    })}



                    {salesReps.map((rep) => {
                      const pointer = pointers.find(p => p.repName === rep.name)
                      if (!pointer) return null
                      const anchor = getRepCentroid(rep.name)
                      const dx = pointer.labelX - anchor.x
                      const dy = pointer.labelY - anchor.y
                      const angle = Math.atan2(dy, dx)
                      // Approximate bubble as an ellipse (width ~120px, height ~40px)
                      const a = 60
                      const b = 22
                      const offset = (a * b) / Math.sqrt(Math.pow(b * Math.cos(angle), 2) + Math.pow(a * Math.sin(angle), 2))
                      const endpoint = getOffsetEndpoint(anchor.x, anchor.y, pointer.labelX, pointer.labelY, offset)
                      const opacity = selectedSale ? (selectedSale === rep.name ? 1 : 0.15) : 1

                      return (
                        <g key={`pointer-svg-${rep.name}`} style={{ opacity, transition: 'opacity 0.3s ease' }}>
                          <line
                            x1={endpoint.x}
                            y1={endpoint.y}
                            x2={anchor.x}
                            y2={anchor.y}
                            stroke="#000000"
                            strokeWidth={2.5 / zoom}
                            strokeDasharray="3,3"
                          />
                          <polygon
                            points={getArrowPoints(endpoint.x, endpoint.y, anchor.x, anchor.y, zoom)}
                            fill="#000000"
                          />
                          <circle
                            cx={anchor.x}
                            cy={anchor.y}
                            r={4 / zoom}
                            fill="#000000"
                          />
                        </g>
                      )
                    })}

                    {shopPoints.map((point) => {
                      const isHighlighted = selectedSale ? selectedSale === point.saleName : true

                      const visible = zoom >= 1.4

                      const opacity = isHighlighted ? 1 : 0.25

                      return (
                        <g
                          key={`shop-point-${point.id}`}
                          className={`shop-point ${!visible ? 'hidden-by-zoom' : ''}`}
                          style={{ opacity, cursor: editingPointId === point.id ? 'move' : 'pointer', transition: 'opacity 0.25s ease' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!isAdmin) return;
                            if (editingPointId !== point.id) {
                              setEditingPointId(point.id)
                              setEditingPointSale(point.saleName)
                            }
                          }}
                          onMouseDown={(e) => {
                            if (editingPointId === point.id && e.button === 0) {
                              e.stopPropagation()
                              setDraggingPointId(point.id)
                            }
                          }}
                          onTouchStart={(e) => {
                            if (editingPointId === point.id) {
                              e.stopPropagation()
                              setDraggingPointId(point.id)
                            }
                          }}
                        >
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={6 / zoom}
                            fill={point.color}
                            stroke="#ffffff"
                            strokeWidth={1.5 / zoom}
                          />
                        </g>
                      )
                    })}
                    {THAILAND_PATHS.map((prov: any) => {
                      const center = PROVINCE_CENTERS[prov.id as keyof typeof PROVINCE_CENTERS]
                      if (!center || prov.id === 'lksg') return null
                      const details = provinces[prov.id]

                      const isHighlighted = selectedSale ? details?.saleName === selectedSale : true
                      // If a specific rep is selected, fade out the other provinces' text slightly
                      const opacity = isHighlighted ? 1 : 0.3
                      const fontWeight = isHighlighted ? '700' : '500'

                      return (
                        <text
                          key={`label-${prov.id}`}
                          className="province-label"
                          x={center.x}
                          y={center.y}
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          fontSize={Math.max(8, 14 / zoom)}
                          fill="#1e293b"
                          stroke="#ffffff"
                          strokeWidth="2px"
                          paintOrder="stroke fill"
                          strokeLinejoin="round"
                          style={{
                            pointerEvents: 'none',
                            opacity,
                            fontWeight,
                            transition: 'opacity 0.3s ease'
                          }}
                        >
                          {(() => {
                            if (details?.saleName === 'หรั่ง') {
                              if (prov.id === 'bkk') return '1';
                              if (prov.id === 'pte') return '2';
                              if (prov.id === 'spk') return '3';
                              if (prov.id === 'nbi') return '4';
                            }
                            if (details?.saleName === 'เมฆ') {
                              if (prov.id === 'skm') return '1';
                              if (prov.id === 'skn') return '2';
                            }
                            return details?.nameTh.replace('จ.', '').trim()
                          })()}
                        </text>
                      )
                    })}
                  </svg>

                  {salesReps.map((rep) => {
                    const pointer = pointers.find(p => p.repName === rep.name)
                    if (!pointer) return null
                    const opacity = selectedSale ? (selectedSale === rep.name ? 1 : 0.15) : 1
                    const leftPercent = `${(pointer.labelX / 560) * 100}%`
                    const topPercent = `${(pointer.labelY / 1025) * 100}%`

                    return (
                      <div
                        key={`pointer-wrapper-${rep.name}`}
                        className="rep-map-bubble-wrapper"
                        style={{
                          position: 'absolute',
                          left: leftPercent,
                          top: topPercent,
                          opacity,
                          transition: 'opacity 0.3s ease',
                          transform: `scale(${1 / zoom})`,
                          zIndex: 10,
                          pointerEvents: 'none'
                        }}
                      >
                        <div
                          className="rep-map-bubble"
                          style={{
                            position: 'absolute',
                            left: '0',
                            top: '0',
                            transform: 'translate(-50%, -50%)',
                            cursor: 'default',
                            ['--rep-color' as any]: rep.color,
                            pointerEvents: 'auto'
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          <div className="rep-map-avatar-container" style={{ ['--rep-color' as any]: rep.color }}>
                            {rep.imageUrl ? (
                              <img src={rep.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={rep.name} />
                            ) : (
                              getAvatarSvg(rep.name, rep.color)
                            )}
                          </div>
                          <div className="rep-map-info">
                            <span className="rep-map-name">{rep.name}</span>
                            <span className="rep-map-phone">{rep.phone}</span>
                          </div>
                        </div>
                        {rep.name === 'หรั่ง' && (
                          <div className="rep-custom-table rang-table" style={{ position: 'absolute', left: '0', top: '28px', transform: 'translateX(-50%)', fontSize: '10px', padding: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', pointerEvents: 'auto', width: 'max-content' }}>
                            <div className="rep-custom-row"><span className="rep-custom-num" style={{ width: '14px', height: '14px', fontSize: '9px' }}>1</span> กรุงเทพมหานคร</div>
                            <div className="rep-custom-row"><span className="rep-custom-num" style={{ width: '14px', height: '14px', fontSize: '9px' }}>2</span> ปทุมธานี</div>
                            <div className="rep-custom-row"><span className="rep-custom-num" style={{ width: '14px', height: '14px', fontSize: '9px' }}>3</span> สมุทรปราการ</div>
                            <div className="rep-custom-row"><span className="rep-custom-num" style={{ width: '14px', height: '14px', fontSize: '9px' }}>4</span> นนทบุรี</div>
                          </div>
                        )}
                        {rep.name === 'เมฆ' && (
                          <div className="rep-custom-table mek-table" style={{ position: 'absolute', left: '0', top: '28px', transform: 'translateX(-50%)', fontSize: '10px', padding: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', pointerEvents: 'auto', width: 'max-content' }}>
                            <div className="rep-custom-row"><span className="rep-custom-num" style={{ width: '14px', height: '14px', fontSize: '9px' }}>1</span> สมุทรสงคราม</div>
                            <div className="rep-custom-row"><span className="rep-custom-num" style={{ width: '14px', height: '14px', fontSize: '9px' }}>2</span> สมุทรสาคร</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {hoveredProvince && (
                  <div className="map-tooltip">
                    <strong>{hoveredProvince.nameTh}</strong>
                    <span>ผู้รับผิดชอบ: {hoveredProvince.saleName}</span>
                  </div>
                )}

                {isAdmin && selectedProvinceId && (
                  <div className="province-edit-card" onClick={(e) => e.stopPropagation()}>
                    <h4>จัดการจังหวัด: {provinces[selectedProvinceId].nameTh}</h4>
                    <label>เซลล์ผู้ดูแล:</label>
                    <select
                      value={provinces[selectedProvinceId].saleName}
                      onChange={(e) => {
                        const newSale = e.target.value;
                        setProvinces(prev => ({
                          ...prev,
                          [selectedProvinceId]: {
                            ...prev[selectedProvinceId],
                            saleName: newSale,
                            color: salesReps.find(r => r.name === newSale)?.color || '#e2e8f0'
                          }
                        }))
                      }}
                      className="prov-select"
                      style={{ marginTop: '0.5rem', marginBottom: '1rem' }}
                    >
                      <option value="ไม่มีผู้รับผิดชอบ">ไม่มีผู้รับผิดชอบ</option>
                      {salesReps.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                    </select>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setSelectedProvinceId(null)}
                        className="sale-rep-action-btn cancel-btn"
                        style={{ padding: '0.4rem 1rem' }}
                      >
                        ปิด
                      </button>
                    </div>
                  </div>
                )}

                <div className="map-zoom-controls" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setZoom(prev => Math.min(prev + 0.25, MAX_ZOOM))}
                    className="zoom-control-btn"
                    title="ซูมเข้า"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                  <button
                    onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.75))}
                    className="zoom-control-btn"
                    title="ซูมออก"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setZoom(1)
                      setPanOffset({ x: 0, y: 0 })
                    }}
                    className="zoom-control-btn reset-btn"
                    title="รีเซ็ตการซูมและตำแหน่ง"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <polyline points="3 3 3 8 8 8" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setZoom(1)
                      setPanOffset({ x: 0, y: 0 })
                      setTimeout(() => {
                        window.print()
                      }, 150)
                    }}
                    className="zoom-control-btn print-btn"
                    title="ปริ้นแผนที่"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 6 2 18 2 18 9"></polyline>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                      <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </main>
  )
}
