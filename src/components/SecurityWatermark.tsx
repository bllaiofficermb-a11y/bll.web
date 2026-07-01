import type { CurrentUserAccess } from '../lib/accessControl'

export default function SecurityWatermark({
  currentUser,
  label = 'ข้อมูลภายใน',
}: {
  currentUser?: CurrentUserAccess | null
  label?: string
}) {
  if (!currentUser) return null

  const timestamp = new Date().toLocaleString('th-TH')
  const text = `${currentUser.employeeId} · ${currentUser.name || 'ไม่ระบุชื่อ'} · ${label} · ${timestamp}`

  return (
    <div
      aria-hidden="true"
      style={{
        pointerEvents: 'none',
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        overflow: 'hidden',
        opacity: 0.11,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '-12%',
          top: '-8%',
          width: '130%',
          height: '130%',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))',
          gap: '72px 48px',
          transform: 'rotate(-24deg)',
          alignContent: 'center',
        }}
      >
        {Array.from({ length: 24 }).map((_, index) => (
          <span
            key={index}
            style={{
              color: '#0f172a',
              fontSize: '14px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
            }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
