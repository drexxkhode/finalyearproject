export default function Directions({ turf, onBack, notify }) {
  const openMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${turf?.lat},${turf?.lng}&travelmode=driving`,
      '_blank'
    )
    notify('Opening Google Maps…')
  }
  const openWaze = () => {
    window.open(`https://www.waze.com/ul?ll=${turf?.lat},${turf?.lng}&navigate=yes`, '_blank')
    notify('Opening Waze…')
  }

  const steps = [
    { ic: '⬆️', tx: `Head toward ${turf?.location?.split(',')[0]}`,   d: '0.3 km' },
    { ic: '↪️', tx: 'Turn right onto Liberation Road',               d: '0.8 km' },
    { ic: '↩️', tx: 'Turn left at the roundabout',                   d: '0.4 km' },
    { ic: '⬆️', tx: `Continue — ${turf?.name} on right`,             d: turf?.distance },
    { ic: '🏟️', tx: 'Arrive at destination',                          d: '' },
  ]

  return (
    <div className="tf-animate-in">
      <button className="tf-back-btn" onClick={onBack}>
        <i className="bi bi-arrow-left"></i> Back
      </button>

      <div className="tf-section-title mb-1">🧭 Directions</div>
      <p className="text-muted small mb-3">Navigate to {turf?.name}</p>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-3">
        {/* Map */}
        <div className="tf-dir-map">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="tf-dir-grid-h" style={{ top: `${i * 28}px` }} />
          ))}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <path
              d="M 80 165 Q 160 88 285 68"
              stroke="#0d6efd"
              strokeWidth="2.5"
              strokeDasharray="7,4"
              fill="none"
              opacity=".8"
            />
            <circle cx="80"  cy="165" r="7" fill="#0dcaf0" />
            <circle cx="285" cy="68"  r="9" fill="#0d6efd" />
          </svg>
          <span
            className="position-absolute text-info fw-bold"
            style={{ left: 55, bottom: 32, fontSize: 11 }}
          >
            📍 You
          </span>
          <span
            className="position-absolute text-primary fw-bold"
            style={{ right: 48, top: 34, fontSize: 11 }}
          >
            🏟️ {turf?.name}
          </span>
        </div>

        {/* Stats + buttons */}
        <div className="p-3">
          <div className="row g-2 mb-3">
            <div className="col-6">
              <div className="card border-0 bg-light rounded-3 p-2 text-center">
                <div className="text-primary fw-bolder fs-5">{turf?.distance}</div>
                <small className="text-muted">Distance</small>
              </div>
            </div>
            <div className="col-6">
              <div className="card border-0 bg-light rounded-3 p-2 text-center">
                <div className="text-info fw-bolder fs-5">
                  ~{Math.round(parseFloat(turf?.distance || 0) * 3)} min
                </div>
                <small className="text-muted">Drive Time</small>
              </div>
            </div>
          </div>
          <button className="btn btn-primary w-100 fw-bold mb-2" onClick={openMaps}>
            <i className="bi bi-map-fill me-2"></i>Open in Google Maps
          </button>
          <button className="btn btn-outline-primary w-100 fw-bold" onClick={openWaze}>
            <i className="bi bi-signpost-fill me-2"></i>Open in Waze
          </button>
        </div>
      </div>

      {/* Step by step */}
      <div className="card border-0 shadow-sm rounded-4 p-3">
        <div className="fw-bold mb-3">
          <i className="bi bi-list-ol me-2 text-primary"></i>Step-by-Step
        </div>
        {steps.map((s, i) => (
          <div key={i} className="d-flex gap-3 align-items-start py-2 border-bottom">
            <span>{s.ic}</span>
            <span className="flex-grow-1 small text-secondary">{s.tx}</span>
            {s.d && <span className="text-primary fw-bold small flex-shrink-0">{s.d}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
