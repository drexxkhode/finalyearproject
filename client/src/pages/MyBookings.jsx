import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
]

const STATUS_META = {
  confirmed:      { bg: 'rgba(25,135,84,.1)',   color: '#198754', border: 'rgba(25,135,84,.25)',  icon: 'bi-check-circle-fill',  label: 'Confirmed'      },
  completed:      { bg: 'rgba(13,110,253,.1)',  color: '#0d6efd', border: 'rgba(13,110,253,.25)', icon: 'bi-flag-fill',           label: 'Completed'      },
  cancelled:      { bg: 'rgba(220,53,69,.1)',   color: '#dc3545', border: 'rgba(220,53,69,.25)',  icon: 'bi-x-circle-fill',       label: 'Cancelled'      },
}

// Separate map for payment_status display — shown as a secondary badge
const PAYMENT_META = {
  paid:           { color: '#198754', icon: 'bi-check-circle',      label: null              },  // no badge needed
  pending:        { color: '#fd7e14', icon: 'bi-hourglass-split',   label: 'Pending'         },
  refund:         { color: '#0d6efd', icon: 'bi-arrow-return-left', label: 'Refund'          },  // legacy
  refund_pending: { color: '#fd7e14', icon: 'bi-hourglass-split',   label: 'Refund Pending'  },
  refunded:       { color: '#0d6efd', icon: 'bi-arrow-return-left', label: 'Refunded'        },
  no_refund:      { color: '#6c757d', icon: 'bi-slash-circle',      label: 'No Refund'       },
  partial_refund: { color: '#0d6efd', icon: 'bi-arrow-return-left', label: 'Partial Refund'  },
}

// Penalty preview — mirrors server logic
function penaltyInfo(booking) {
  if (!booking.booking_date || !booking.slot_label) return null
  // Strip any time/timezone component from booking_date — DB may return full ISO string
  const dateOnly  = String(booking.booking_date).slice(0, 10)
  // slot_label is "08:00 – 09:00" — take first 5 chars for start time
  const timeOnly  = booking.slot_label.slice(0, 5)
  const slotDateTime = new Date(`${dateOnly}T${timeOnly}:00`)
  if (isNaN(slotDateTime)) return null   // guard against malformed data
  const hrs = (slotDateTime - Date.now()) / (1000 * 60 * 60)
  if (hrs < 0)       return { pct: 100, refund: 0,   label: 'Slot already passed — no refund' }
  if (hrs < 6)       return { pct: 100, refund: 0,   label: 'Less than 6 hrs — no refund' }
  if (hrs < 24)      return { pct: 50,  refund: 0.5, label: '50% penalty applies' }
  return               { pct: 0,   refund: 1,   label: 'Full refund eligible' }
}

function StatusBadge({ status }) {
  const s = STATUS_META[status?.toLowerCase()] ?? STATUS_META.confirmed
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 20, fontSize: 11, fontWeight: 700,
      padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 4,
      whiteSpace: 'nowrap',
    }}>
      <i className={`bi ${s.icon}`}></i> {s.label}
    </span>
  )
}

function CancelModal({ booking, onConfirm, onClose, loading }) {
  const info       = penaltyInfo(booking)
  const refundAmt  = info ? (parseFloat(booking.amount) * info.refund).toFixed(2) : '0.00'
  const penaltyAmt = info ? (parseFloat(booking.amount) * (info.pct / 100)).toFixed(2) : booking.amount

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return createPortal(
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className="tf-modal-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(10,10,20,.75)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', alignItems: 'stretch',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="tf-modal-sheet"
        style={{
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 32px rgba(0,0,0,.22)',
          maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          animation: 'tfSlideUp .28s cubic-bezier(.32,1,.32,1)',
        }}
      >
        <div style={{ overflowY: 'auto', padding: '12px 20px 8px', flex: 1 }}>
          <div className="tf-modal-handle" style={{ width: 36, height: 4, borderRadius: 2, background: '#dee2e6', margin: '0 auto 18px' }} />
          <div style={{ fontSize: 34, textAlign: 'center', marginBottom: 8 }}>⚠️</div>
          <h5 className="fw-bolder text-center mb-1">Cancel Booking?</h5>
          <p className="text-muted small text-center mb-3">{booking.turf} · {booking.slot_label}</p>

          <div className="rounded-3 p-3 mb-3" style={{
            background: info?.pct === 0 ? 'rgba(25,135,84,.07)' : 'rgba(220,53,69,.07)',
            border: `1px solid ${info?.pct === 0 ? 'rgba(25,135,84,.2)' : 'rgba(220,53,69,.2)'}`,
          }}>
            <div className="fw-bold small mb-2" style={{ color: info?.pct === 0 ? '#198754' : '#dc3545' }}>
              {info?.label ?? 'Cancellation policy applies'}
            </div>
            {[
              ['Amount Paid',   `₵${parseFloat(booking.amount).toFixed(2)}`],
              ['Penalty',       `₵${penaltyAmt} (${info?.pct ?? 0}%)`],
              ['Refund Amount', `₵${refundAmt}`],
            ].map(([k, v]) => (
              <div key={k} className="d-flex justify-content-between small py-1 border-bottom">
                <span className="text-muted">{k}</span>
                <span className="fw-bold">{v}</span>
              </div>
            ))}
          </div>

          {parseFloat(refundAmt) > 0 && (
            <p className="text-muted small text-center mb-2">
              <i className="bi bi-info-circle me-1"></i>
              Refund of <strong>₵{refundAmt}</strong> processed within 5–10 business days.
            </p>
          )}
        </div>

        <div className="d-flex gap-2" style={{ padding: '12px 20px 28px', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
          <button className="btn btn-outline-secondary fw-bold flex-grow-1" onClick={onClose} disabled={loading}>
            Keep Booking
          </button>
          <button className="btn btn-danger fw-bold flex-grow-1" onClick={onConfirm} disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2" />Cancelling…</> : 'Yes, Cancel'}
          </button>
        </div>
      </div>
      <style>{`@keyframes tfSlideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>
    </div>,
    document.body
  )
}

function DeleteModal({ booking, onConfirm, onClose, loading }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return createPortal(
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className="tf-modal-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(10,10,20,.75)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', alignItems: 'stretch',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="tf-modal-sheet"
        style={{
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 32px rgba(0,0,0,.22)',
          animation: 'tfSlideUp .28s cubic-bezier(.32,1,.32,1)',
        }}
      >
        <div style={{ padding: '12px 20px 4px' }}>
          <div className="tf-modal-handle" style={{ width: 36, height: 4, borderRadius: 2, background: '#dee2e6', margin: '0 auto 18px' }} />
          <div style={{ fontSize: 34, textAlign: 'center', marginBottom: 8 }}>🗑️</div>
          <h5 className="fw-bolder text-center mb-1">Delete Booking?</h5>
          <p className="text-muted small text-center mb-3">
            {booking.turf} · {booking.slot_label}<br />
            This removes the record from your history and cannot be undone.
          </p>
        </div>
        <div className="d-flex gap-2" style={{ padding: '12px 20px 28px', borderTop: '1px solid #f0f0f0' }}>
          <button className="btn btn-outline-secondary fw-bold flex-grow-1" onClick={onClose} disabled={loading}>
            Keep
          </button>
          <button className="btn btn-danger fw-bold flex-grow-1" onClick={onConfirm} disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2" />Deleting…</> : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function BookingCard({ b, index, onCancel, onDelete }) {
  const photo  = FALLBACK_PHOTOS[index % FALLBACK_PHOTOS.length]
  const status = (b.status ?? 'confirmed').toLowerCase()
  // Don't show cancel button once the slot time has already passed —
  // the server would still process it but the user gets 0 refund (100% penalty).
  // Better to hide it and avoid confusion.
  const info = penaltyInfo(b)
  const slotPast  = info !== null && info.pct === 100 && info.label.includes('passed')
  const canCancel = status === 'confirmed' && b.payment_status === 'paid' && !slotPast
  // Can delete if booking is no longer active (cancelled or completed)
  // and not mid-refund
  const canDelete = (status === 'cancelled' || status === 'completed')
    && b.payment_status !== 'refund_pending'

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
      {/* Cover */}
      <div style={{ height: 100, overflow: 'hidden', position: 'relative' }}>
        <img src={photo} alt={b.turf}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = FALLBACK_PHOTOS[0] }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 20%,rgba(0,0,0,.6))' }} />
        <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{
            color: '#fff', fontWeight: 800, fontSize: 13,
            fontFamily: "'Barlow Condensed',sans-serif",
            maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{b.turf}</span>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bi bi-calendar3 text-primary" style={{ width: 16, fontSize: 12 }}></i>
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {b.date
              ? new Date(String(b.date).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
              : '—'
            }
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bi bi-clock-fill text-primary" style={{ width: 16, fontSize: 12 }}></i>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{b.slot_label ?? b.slot ?? '—'}</span>
        </div>

        {/* Payment status badge — only shown when it conveys extra info */}
        {(() => {
          const pm = PAYMENT_META[b.payment_status]
          if (!pm || !pm.label) return null
          return (
            <div style={{ fontSize: 11, color: pm.color,
              background: `${pm.color}18`, borderRadius: 6,
              padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className={`bi ${pm.icon}`}></i>
              {pm.label}
              {['refund','refund_pending','refunded','partial_refund'].includes(b.payment_status)
                && parseFloat(b.refund_amount) > 0
                && ` — ₵${parseFloat(b.refund_amount).toFixed(2)}`}
            </div>
          )
        })()}

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 8, borderTop: '1px solid #f0f0f0', marginTop: 2,
        }}>
          <span style={{ color: '#0d6efd', fontWeight: 900, fontSize: 17 }}>
            ₵{parseFloat(b.amount).toFixed(2)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#adb5bd', fontSize: 10 }}>{b.id}</span>
            {canDelete && (
              <button
                onClick={() => onDelete(b)}
                title="Delete booking"
                style={{
                  border: 'none', background: 'none', padding: '2px 4px',
                  cursor: 'pointer', color: '#dc3545', fontSize: 15,
                  lineHeight: 1, borderRadius: 4,
                  transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,53,69,.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <i className="bi bi-trash3"></i>
              </button>
            )}
          </div>
        </div>

        {canCancel && (
          <button
            className="btn btn-outline-danger btn-sm fw-bold w-100 mt-1"
            onClick={() => onCancel(b)}
            style={{ fontSize: 12 }}
          >
            <i className="bi bi-x-circle me-1"></i>Cancel Booking
          </button>
        )}
      </div>
    </div>
  )
}

export default function MyBookings({ onBack, notify }) {
  const [bookings,     setBookings]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [activeTab,    setActiveTab]    = useState('all')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling,   setCancelling]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API}/bookings/mybookings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setBookings(res.data.bookings ?? [])
    } catch {
      setError('Could not load bookings.')
      notify?.('Could not load bookings. Please try again.', 'e')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API}/bookings/${cancelTarget.raw_id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setCancelTarget(null)
      await fetchBookings()
      notify?.('Booking cancelled. Refund is being processed.', 's')

      // In test mode Paystack fires the refund webhook within a few seconds.
      // Re-fetch twice after short delays so the UI reflects 'refunded'
      // without the user needing to manually refresh.
      setTimeout(async () => { await fetchBookings() }, 30000)
      setTimeout(async () => { await fetchBookings() }, 90000)
    } catch (e) {
      const msg = e.response?.data?.message || 'Cancellation failed. Please try again.'
      setError(msg)
      notify?.(msg, 'e')
      setCancelTarget(null)
      await fetchBookings()
    } finally {
      setCancelling(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(
        `${API}/bookings/${deleteTarget.raw_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setDeleteTarget(null)
      await fetchBookings()
      notify?.('Booking removed from your history.', 's')
    } catch (e) {
      const msg = e.response?.data?.message || 'Could not delete booking.'
      setError(msg)
      notify?.(msg, 'e')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const tabs = [
    { key: 'all',       label: 'All'       },
    { key: 'confirmed', label: 'Upcoming'  },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  const filtered = activeTab === 'all'
    ? bookings
    : bookings.filter(b => (b.status ?? '').toLowerCase() === activeTab)

  return (
    <div className="tf-animate-in">
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
          loading={cancelling}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          booking={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <button className="tf-back-btn" onClick={onBack}>
        <i className="bi bi-arrow-left"></i> Back
      </button>

      <div className="d-flex align-items-center justify-content-between mb-1 flex-wrap gap-2">
        <div className="tf-section-title mb-0">
          <i className="bi bi-calendar-check-fill me-2 text-primary"></i>My Bookings
        </div>
        {!loading && (
          <span className="text-muted small">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap" style={{ borderBottom: '1px solid #dee2e6' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            border: 'none', background: 'none', cursor: 'pointer',
            padding: '8px 4px', fontWeight: 700, fontSize: 13,
            color: activeTab === t.key ? '#0d6efd' : '#6c757d',
            borderBottom: activeTab === t.key ? '2.5px solid #0d6efd' : '2.5px solid transparent',
            transition: 'all .15s',
          }}>
            {t.label}
            {t.key === 'all' && bookings.length > 0 && (
              <span style={{
                marginLeft: 6, background: '#0d6efd', color: '#fff',
                borderRadius: 10, fontSize: 10, padding: '1px 7px',
              }}>{bookings.length}</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="alert alert-warning py-2 small mb-3">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3"></div>
          <p className="text-muted">Loading your bookings…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5">
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏟️</div>
          <h5 className="fw-bold">{activeTab === 'all' ? 'No bookings yet' : `No ${activeTab} bookings`}</h5>
          <p className="text-muted">{activeTab === 'all' ? 'Book your first turf session!' : 'Nothing here yet.'}</p>
          {activeTab === 'all' && (
            <button className="btn btn-primary fw-bold px-4" onClick={onBack}>Find a Turf</button>
          )}
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map((b, i) => (
            <div key={b.id} className="col-12 col-sm-6 col-xl-4">
              <BookingCard b={b} index={i} onCancel={setCancelTarget} onDelete={setDeleteTarget} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}