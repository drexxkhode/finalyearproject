import Gallery from '../components/Gallery'
import EnquiriesSection from '../components/EnquiriesSection'

export default function TurfDetail({
  turf, slots, user,
  onBack, onBook, onDirections,
  lockSlot, releaseSlot,
  selectedSlot, setSelectedSlot,
  countdown, fmtCountdown,
  notify, onDateChange,
}) {
  const turfSlots = slots[turf.id] || []

  const handleSlotClick = s => {
    const mine = s.lockedBy === 'you'
    if (!user) { notify('Please sign in to book', 'e'); return }
    if (s.status === 'available') {
      lockSlot(turf.id, s.hour)
      setSelectedSlot(s)
      notify('🔒 Slot locked for 5 mins!')
    } else if (mine) {
      setSelectedSlot(s)
      onBook()
    }
  }

  const slotClass = s => {
    if (s.status === 'booked') return 'tf-slot tf-slot-booked'
    if (s.status === 'locked') return s.lockedBy === 'you' ? 'tf-slot tf-slot-locked-mine' : 'tf-slot tf-slot-locked-other'
    return 'tf-slot tf-slot-available'
  }

  return (
    <div className="tf-animate-in">
      <button className="tf-back-btn" onClick={onBack}>
        <i className="bi bi-arrow-left"></i> Back
      </button>

      <Gallery turfId={turf.id} />

      {/* Info panel */}
      <div className="tf-info-panel">
        <h4 className="font-condensed fw-bolder mb-1">{turf.name}</h4>
        <p className="text-muted small mb-3">
          <i className="bi bi-geo-alt-fill me-1"></i>{turf.location}
        </p>
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="tf-badge tf-badge-blue">{turf.capacity}</span>
          <span className="tf-badge tf-badge-gray">{turf.surface}</span>
          <span className="tf-badge tf-badge-yellow">⭐ {turf.rating}</span>
        </div>
        <div className="d-flex gap-4">
          <div>
            <div className="tf-info-price-big">₵{turf.pricePerHour}</div>
            <div className="tf-info-label">per hour</div>
          </div>
          <div>
            <div className="tf-info-dist-big">{turf.distance}</div>
            <div className="tf-info-label">from you</div>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
        <div className="fw-bold mb-2">🏟️ Amenities</div>
        <div className="d-flex flex-wrap gap-2">
          {turf.amenities.map(a => (
            <span key={a} className="tf-badge tf-badge-green">
              <i className="bi bi-check-circle-fill me-1"></i>{a}
            </span>
          ))}
        </div>
      </div>

      {/* Directions CTA */}
      <button className="btn btn-outline-primary w-100 fw-bold mb-3" onClick={onDirections}>
        <i className="bi bi-compass me-2"></i>Get Directions
      </button>

      {/* Slot picker */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="fw-bold">⏰ Select Time Slot</div>
          <div className="d-flex gap-2" style={{ fontSize: 10 }}>
            <span className="text-primary fw-bold">■ Free</span>
            <span className="text-danger fw-bold">■ Booked</span>
            <span style={{ color: '#856404', fontWeight: 700 }}>■ Locked</span>
          </div>
        </div>

        <input
          type="date"
          className="form-control mb-2"
          onChange={e => onDateChange(e.target.value)}
        />

        {!user && (
          <div className="alert alert-warning py-2 small text-center mb-2">
            🔒 <strong>Sign in required</strong> to book a slot
          </div>
        )}

        <div className="tf-slot-grid">
          {turfSlots.map(s => {
            const mine = s.lockedBy === 'you'
            return (
              <div key={s.hour} className={slotClass(s)} onClick={() => handleSlotClick(s)}>
                {s.label}
                {s.status === 'booked'         && <div className="tf-slot-sub">Taken</div>}
                {mine                          && <div className="tf-slot-sub">🔒 Yours</div>}
                {s.status === 'locked' && !mine && <div className="tf-slot-sub">In use</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Reserved slot CTA */}
      {selectedSlot && (
        <div className="tf-reserved-banner mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <div className="fw-bold">🔒 Slot Reserved</div>
              <small className="text-muted">{selectedSlot.label} — ₵{turf.pricePerHour}</small>
            </div>
            <div className="text-center">
              <div className="fw-bolder fs-5" style={{ color: '#856404' }}>{fmtCountdown(countdown)}</div>
              <div className="text-muted" style={{ fontSize: 10 }}>expires</div>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary fw-bold flex-grow-1" onClick={onBook}>
              Proceed to Book →
            </button>
            <button
              className="btn btn-outline-secondary fw-bold"
              onClick={() => { releaseSlot(turf.id, selectedSlot.hour); setSelectedSlot(null) }}
            >
              Release
            </button>
          </div>
        </div>
      )}

      <EnquiriesSection turfId={turf.id} user={user} />
    </div>
  )
}
