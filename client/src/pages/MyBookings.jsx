export default function MyBookings({ bookings, onBack }) {
  return (
    <div className="tf-animate-in">
      <button className="tf-back-btn" onClick={onBack}>
        <i className="bi bi-arrow-left"></i> Back
      </button>

      <div className="tf-section-title mb-4">
        <i className="bi bi-calendar-check-fill me-2 text-primary"></i>My Bookings
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-5">
          <div className="display-4 mb-3">🏟️</div>
          <h5 className="fw-bold">No bookings yet</h5>
          <p className="text-muted">Book your first turf session!</p>
          <button className="btn btn-primary fw-bold px-4" onClick={onBack}>
            Find a Turf
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {bookings.map(b => (
            <div key={b.id} className="card border-0 shadow-sm rounded-4 p-3">
              <div className="d-flex justify-content-between align-items-start mb-1">
                <span className="fw-bold">{b.turf}</span>
                <span className="tf-badge tf-badge-green">{b.status}</span>
              </div>
              <p className="text-muted small mb-2">
                <i className="bi bi-calendar3 me-1"></i>{b.date}
                <span className="mx-2">·</span>
                <i className="bi bi-clock-fill me-1"></i>{b.slot}
              </p>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-primary fw-bolder fs-5">₵{b.amount}.00</span>
                <span className="text-muted" style={{ fontSize: 11 }}>ID: {b.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
