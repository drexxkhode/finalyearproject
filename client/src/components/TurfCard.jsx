import { TURF_PHOTOS } from '../data/turfs'

export default function TurfCard({ turf, slots, onOpen }) {
  const avail = slots[turf.id]?.filter(s => s.status === 'available').length ?? 0

  return (
    <div className="tf-card h-100" onClick={() => onOpen(turf)}>
      <div className="tf-card-cover">
        <img
          src={TURF_PHOTOS[turf.id][0]}
          alt={turf.name}
          onError={e => { e.target.style.background = '#c8d6e5' }}
        />
        <div className="tf-card-cover-overlay" />
        <div className="tf-card-cover-badges">
          <span className="tf-badge tf-badge-blue">{turf.capacity}</span>
          <span className="tf-badge tf-badge-yellow">⭐ {turf.rating}</span>
        </div>
        <div className="tf-card-avail-tag">{avail} open</div>
      </div>
      <div className="tf-card-body">
        <div className="tf-card-name">{turf.name}</div>
        <div className="tf-card-meta">
          <i className="bi bi-geo-alt-fill me-1"></i>{turf.location} · {turf.distance}
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <span className="tf-card-price">₵{turf.pricePerHour}</span>
            <span className="tf-card-price-unit">/hr</span>
          </div>
          <button
            className="btn btn-primary btn-sm fw-bold"
            onClick={e => { e.stopPropagation(); onOpen(turf) }}
          >
            Book →
          </button>
        </div>
      </div>
    </div>
  )
}
