import EnquiriesSection from '../components/EnquiriesSection'

const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
]

export default function TurfDetail({
  turf, slots, loadedTurfs, lockedSlots, user,
  onBack, onBook, onDirections,
  lockSlot, releaseSlot,
  fmtCountdown, notify, onDateChange,
}) {
  const turfSlots   = slots[turf.id] ?? []
  const isLoaded    = loadedTurfs.has(turf.id)   // fetch completed (even if empty)

  // My locked slots for THIS turf only
  const myLockedHere = Object.values(lockedSlots).filter(l => l.turfId === turf.id)
  const totalAmount  = myLockedHere.length * (turf.pricePerHour ?? 0)

  const amenities = Array.isArray(turf.amenities)
    ? turf.amenities
    : turf.amenities ? turf.amenities.split(',').map(a => a.trim()) : []

  const coverImg = FALLBACK_PHOTOS[turf.id % FALLBACK_PHOTOS.length]

  const handleSlotClick = s => {
    if (!user)                                        { notify('Please sign in to book', 'e'); return }
    if (s.status === 'booked')                        return
    if (s.status === 'locked' && s.lockedBy !== 'you') return
    if (s.lockedBy === 'you')                         return  // already mine
    lockSlot(turf.id, s.id, s.label)
    notify('🔒 Slot locked for 5 mins!')
  }

  // Fix #4: class colors match legend exactly
  const slotClass = s => {
    if (s.status === 'booked') return 'tf-slot tf-slot-booked'           // red
    if (s.status === 'locked') return s.lockedBy === 'you'
      ? 'tf-slot tf-slot-locked-mine'   // amber/yellow
      : 'tf-slot tf-slot-locked-other'  // grey
    return 'tf-slot tf-slot-available'  // blue
  }

  return (
    <div className="tf-animate-in">
      <button className="tf-back-btn" onClick={onBack}>
        <i className="bi bi-arrow-left"></i> Back to Turfs
      </button>

      <div className="row g-4">

        {/* LEFT */}
        <div className="col-12 col-lg-6">
          <div className="rounded-4 overflow-hidden mb-3" style={{ height: 260 }}>
            <img
              src={turf.image || coverImg} alt={turf.name}
              className="w-100 h-100 object-fit-cover"
              onError={e => { e.target.src = FALLBACK_PHOTOS[0] }}
            />
          </div>

          <div className="tf-info-panel">
            <h4 className="font-condensed fw-bolder mb-1">{turf.name}</h4>
            {turf.about && <p className="text-muted small mb-3">{turf.about}</p>}
            <p className="text-muted small mb-3">
              <i className="bi bi-geo-alt-fill me-1"></i>
              {turf.address || turf.location}
              {turf.district && turf.address ? `, ${turf.district}` : ''}
            </p>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="tf-badge tf-badge-blue">{turf.capacity ?? 'N/A'}</span>
              <span className="tf-badge tf-badge-gray">{turf.surface ?? 'Turf'}</span>
              <span className="tf-badge tf-badge-yellow">⭐ {turf.rating ?? '4.5'}</span>
            </div>
            <div className="d-flex gap-4 mb-3">
              <div>
                <div className="tf-info-price-big">₵{turf.pricePerHour}</div>
                <div className="tf-info-label">per hour</div>
              </div>
              <div>
                <div className="tf-info-dist-big">{turf.distance ?? '—'} km</div>
                <div className="tf-info-label">from you</div>
              </div>
            </div>
            {amenities.length > 0 && (
              <div className="d-flex flex-wrap gap-2">
                {amenities.map(a => (
                  <span key={a} className="tf-badge tf-badge-green">
                    <i className="bi bi-check-circle-fill me-1"></i>{a}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-primary w-100 fw-bold mt-3" onClick={() => onDirections(turf.id)}>
            <i className="bi bi-compass me-2"></i>Get Directions
          </button>
        </div>

        {/* RIGHT */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">

            {/* Fix #4: legend colors match CSS exactly */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fw-bold">⏰ Select Time Slot</div>
              <div className="d-flex gap-2" style={{ fontSize: 10 }}>
                <span style={{ color: '#0d6efd', fontWeight: 700 }}>■ Free</span>
                <span style={{ color: '#dc3545', fontWeight: 700 }}>■ Taken</span>
                <span style={{ color: '#856404', fontWeight: 700 }}>■ Yours</span>
                <span style={{ color: '#6c757d', fontWeight: 700 }}>■ Others</span>
              </div>
            </div>

            <input type="date" className="form-control mb-2"
              onChange={e => onDateChange(e.target.value)} />

            {!user && (
              <div className="alert alert-warning py-2 small text-center mb-2">
                🔒 <strong>Sign in required</strong> to book a slot
              </div>
            )}

            {/* Fix #3: spinner vs empty message */}
            <div className="tf-slot-grid">
              {!isLoaded ? (
                <div className="text-center text-muted py-3 w-100">
                  <div className="spinner-border spinner-border-sm me-2" role="status" />
                  Loading slots…
                </div>
              ) : turfSlots.length === 0 ? (
                <div className="text-center text-muted py-4 w-100">
                  <i className="bi bi-calendar-x fs-4 d-block mb-2"></i>
                  No time slots available for this turf
                </div>
              ) : (
                turfSlots.map(s => {
                  const mine = s.lockedBy === 'you'
                  return (
                    <div key={s.id} className={slotClass(s)} onClick={() => handleSlotClick(s)}>
                      {s.label}
                      {s.status === 'booked'           && <div className="tf-slot-sub">Taken</div>}
                      {mine                            && <div className="tf-slot-sub">🔒 Yours</div>}
                      {s.status === 'locked' && !mine  && <div className="tf-slot-sub">In use</div>}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Fix #1: multi-slot panel with independent timers */}
          {myLockedHere.length > 0 && (
            <div className="card border-0 shadow-sm rounded-4 p-3 mb-3"
              style={{ borderLeft: '4px solid #856404' }}>
              <div className="fw-bold mb-2">🔒 Selected Slots</div>

              <div className="d-flex flex-column gap-2 mb-3">
                {myLockedHere.map(lock => (
                  <div key={lock.slotId}
                    className="d-flex justify-content-between align-items-center rounded-3 px-3 py-2"
                    style={{ background: 'rgba(255,193,7,.1)', border: '1px solid rgba(255,193,7,.4)' }}
                  >
                    <div>
                      <div className="fw-bold small">{lock.label}</div>
                      <div className="text-muted" style={{ fontSize: 10 }}>₵{turf.pricePerHour}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bolder small" style={{ color: '#856404', minWidth: 36 }}>
                        {fmtCountdown(lock.countdown ?? 300)}
                      </span>
                      <button
                        className="btn btn-outline-danger btn-sm py-0 px-2"
                        style={{ fontSize: 11 }}
                        onClick={() => releaseSlot(turf.id, lock.slotId)}
                      >✕</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold">
                  Total ({myLockedHere.length} slot{myLockedHere.length > 1 ? 's' : ''})
                </span>
                <span className="fw-bolder text-primary fs-5">₵{totalAmount}</span>
              </div>

              <button className="btn btn-primary fw-bold w-100 py-2" onClick={onBook}>
                Proceed to Book{myLockedHere.length > 1 ? ` (${myLockedHere.length} slots)` : ''} →
              </button>
            </div>
          )}

          <EnquiriesSection turfId={turf.id} user={user} />
        </div>
      </div>
    </div>
  )
}