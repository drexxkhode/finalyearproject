import { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
]

const STATUS_STYLES = {
  confirmed:  { bg: 'rgba(25,135,84,.1)',   color: '#198754', border: 'rgba(25,135,84,.25)',  label: 'Confirmed',  icon: 'bi-check-circle-fill'  },
  completed:  { bg: 'rgba(13,110,253,.1)',  color: '#0d6efd', border: 'rgba(13,110,253,.25)', label: 'Completed',  icon: 'bi-flag-fill'           },
  cancelled:  { bg: 'rgba(220,53,69,.1)',   color: '#dc3545', border: 'rgba(220,53,69,.25)',  label: 'Cancelled',  icon: 'bi-x-circle-fill'       },
  Confirmed:  { bg: 'rgba(25,135,84,.1)',   color: '#198754', border: 'rgba(25,135,84,.25)',  label: 'Confirmed',  icon: 'bi-check-circle-fill'   },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.confirmed
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 20, fontSize: 11, fontWeight: 700,
      padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <i className={`bi ${s.icon}`}></i> {s.label}
    </span>
  )
}

function BookingCard({ b, index }) {
  const photo = FALLBACK_PHOTOS[index % FALLBACK_PHOTOS.length]

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100"
      style={{ transition: 'transform .2s, box-shadow .2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(13,110,253,.13)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      {/* Cover image */}
      <div style={{ height: 110, overflow: 'hidden', position: 'relative' }}>
        <img
          src={photo} alt={b.turf}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = FALLBACK_PHOTOS[0] }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,.55))',
        }} />
        <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{
            color: '#fff', fontWeight: 800, fontSize: 14,
            fontFamily: "'Barlow Condensed',sans-serif",
            textShadow: '0 1px 4px rgba(0,0,0,.5)',
            maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{b.turf}</span>
          <StatusBadge status={b.status} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-calendar3 text-primary" style={{ width: 16 }}></i>
            <span style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 600 }}>
              {b.date && b.date !== 'Today'
                ? new Date(b.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                : b.date}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-clock-fill text-primary" style={{ width: 16 }}></i>
            <span style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 600 }}>
              {b.slot ?? b.slot_label}
            </span>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginTop: 4,
            paddingTop: 10, borderTop: '1px solid #f0f0f0',
          }}>
            <span style={{ color: '#0d6efd', fontWeight: 900, fontSize: 18 }}>
              ₵{b.amount}.00
            </span>
            <span style={{ color: '#adb5bd', fontSize: 11 }}>
              {b.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyBookings({ onBack }) {
  const [dbBookings, setDbBookings] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [activeTab,  setActiveTab]  = useState('all')

  // Fetch real bookings from DB on mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get(`${API}/bookings/mybookings`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setDbBookings(res.data.bookings ?? [])
      } catch (e) {
        // If endpoint not yet deployed, fall back to session bookings silently
        if (e.response?.status !== 404) {
          setError('Could not load bookings from server.')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const allBookings = dbBookings

  const tabs = [
    { key: 'all',       label: 'All'       },
    { key: 'confirmed', label: 'Upcoming'  },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  const filtered = activeTab === 'all'
    ? allBookings
    : allBookings.filter(b => (b.status ?? '').toLowerCase() === activeTab)

  return (
    <div className="tf-animate-in">
      <button className="tf-back-btn" onClick={onBack}>
        <i className="bi bi-arrow-left"></i> Back
      </button>

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-1 flex-wrap gap-2">
        <div className="tf-section-title mb-0">
          <i className="bi bi-calendar-check-fill me-2 text-primary"></i>My Bookings
        </div>
        {!loading && (
          <span className="text-muted small">
            {allBookings.length} booking{allBookings.length !== 1 ? 's' : ''} total
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap" style={{ borderBottom: '1px solid #dee2e6', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              padding: '8px 4px', fontWeight: 700, fontSize: 13,
              color: activeTab === t.key ? '#0d6efd' : '#6c757d',
              borderBottom: activeTab === t.key ? '2.5px solid #0d6efd' : '2.5px solid transparent',
              transition: 'all .15s',
            }}>
            {t.label}
            {t.key === 'all' && allBookings.length > 0 && (
              <span style={{
                marginLeft: 6, background: '#0d6efd', color: '#fff',
                borderRadius: 10, fontSize: 10, fontWeight: 700,
                padding: '1px 7px',
              }}>{allBookings.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-warning py-2 small mb-3">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3"></div>
          <p className="text-muted">Loading your bookings…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5">
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏟️</div>
          <h5 className="fw-bold">
            {activeTab === 'all' ? 'No bookings yet' : `No ${activeTab} bookings`}
          </h5>
          <p className="text-muted">
            {activeTab === 'all' ? 'Book your first turf session!' : 'Nothing here yet.'}
          </p>
          {activeTab === 'all' && (
            <button className="btn btn-primary fw-bold px-4" onClick={onBack}>
              Find a Turf
            </button>
          )}
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map((b, i) => (
            <div key={b.id} className="col-12 col-sm-6 col-xl-4">
              <BookingCard b={b} index={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}