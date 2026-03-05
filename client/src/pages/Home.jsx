import { useState } from 'react'
import TurfCard from '../components/TurfCard'
import { TURFS, TURF_PHOTOS } from '../data/turfs'

const TABS = [
  { key: 'turfs',     icon: 'bi-grid-fill',        label: 'Browse Turfs' },
  { key: 'map',       icon: 'bi-map-fill',          label: 'Map View' },
  { key: 'recommend', icon: 'bi-stars',             label: 'For You' },
]

export default function Home({ slots, onOpenTurf, activeTab, onTabChange }) {
  const [search, setSearch] = useState('')
  const [fCap,   setFCap]   = useState('All')
  const [sort,   setSort]   = useState('distance')

  const filtered = TURFS
    .filter(t =>
      (fCap === 'All' || t.capacity.includes(fCap)) &&
      (search === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.location.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) =>
      sort === 'price'  ? a.pricePerHour - b.pricePerHour :
      sort === 'rating' ? b.rating - a.rating :
      parseFloat(a.distance) - parseFloat(b.distance)
    )

  const rec = [...TURFS].sort((a, b) => b.rating - a.rating)

  return (
    <div className="tf-animate-in">

      {/* ── Tab Bar (desktop only — mobile uses bottom nav) ── */}
      <div className="d-none d-md-flex gap-4 border-bottom pb-0 mb-4">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tf-nav-link pb-2${activeTab === t.key ? ' active' : ''}`}
            onClick={() => onTabChange(t.key)}
          >
            <i className={`bi ${t.icon}`}></i>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TURFS TAB ── */}
      {activeTab === 'turfs' && (
        <>
          {/* Filters */}
          <div className="row g-2 mb-3">
            <div className="col-12">
              <input
                className="form-control"
                placeholder="🔍  Search turfs in Accra…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="col-6">
              <select className="form-select" value={fCap} onChange={e => setFCap(e.target.value)}>
                <option value="All">All Sizes</option>
                <option value="5">5-a-side</option>
                <option value="7">7-a-side</option>
                <option value="11">11-a-side</option>
              </select>
            </div>
            <div className="col-6">
              <select className="form-select" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="distance">Nearest</option>
                <option value="rating">Top Rated</option>
                <option value="price">Cheapest</option>
              </select>
            </div>
          </div>

          {/* Live badge */}
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="tf-live-dot"></span>
            <small className="text-muted">Live slot availability · updates every 5 s</small>
          </div>

          {/* Grid */}
          {filtered.length === 0 && (
            <p className="text-center text-muted py-5">No turfs match your search.</p>
          )}
          <div className="row g-3">
            {filtered.map(t => (
              <div key={t.id} className="col-12 col-sm-6 col-xl-4">
                <TurfCard turf={t} slots={slots} onOpen={onOpenTurf} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── MAP TAB ── */}
      {activeTab === 'map' && (
        <>
          <div className="tf-map-bg mb-3" style={{ height: 320 }}>
            {[...Array(8)].map((_,i) => (
              <div key={i} className="tf-map-grid-h" style={{ top: `${i * 42}px` }} />
            ))}
            {[...Array(12)].map((_,i) => (
              <div key={i} className="tf-map-grid-v" style={{ left: `${i * 42}px` }} />
            ))}
            <div className="tf-map-label">ACCRA METROPOLITAN</div>
            {TURFS.map((t, i) => {
              const pos = [
                { left: '36%', top: '40%' },
                { left: '59%', top: '60%' },
                { left: '77%', top: '53%' },
                { left: '25%', top: '67%' },
              ]
              return (
                <div
                  key={t.id}
                  className="tf-map-pin"
                  style={{ left: pos[i].left, top: pos[i].top }}
                  onClick={() => onOpenTurf(t)}
                >
                  <div className="tf-map-pin-inner">
                    <span>⚽</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="d-flex flex-column gap-2">
            {TURFS.map(t => (
              <div
                key={t.id}
                className="card border-0 shadow-sm rounded-3 p-3 d-flex flex-row align-items-center gap-3"
                role="button"
                onClick={() => onOpenTurf(t)}
              >
                <img
                  src={TURF_PHOTOS[t.id][0]}
                  alt={t.name}
                  className="rounded-3 object-fit-cover flex-shrink-0"
                  width={56} height={56}
                  onError={e => { e.target.style.display = 'none' }}
                />
                <div className="flex-grow-1">
                  <div className="fw-bold">{t.name}</div>
                  <small className="text-muted">{t.location} · {t.distance}</small>
                  <div className="text-primary fw-bold small mt-1">₵{t.pricePerHour}/hr</div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── RECOMMEND TAB ── */}
      {activeTab === 'recommend' && (
        <>
          <div className="mb-3">
            <div className="tf-section-title">🎯 Recommended For You</div>
            <small className="text-muted">Based on ratings, proximity &amp; availability</small>
          </div>

          {/* Top pick */}
          <div className="tf-rec-highlight">
            <span className="tf-badge tf-badge-yellow d-inline-block mb-2">⭐ TOP PICK</span>
            <div className="d-flex gap-1 mb-3 rounded-3 overflow-hidden" style={{ height: 64 }}>
              {TURF_PHOTOS[rec[0].id].slice(0, 3).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="object-fit-cover"
                  style={{
                    flex: 1,
                    height: '100%',
                    borderRadius: i === 0 ? '10px 0 0 10px' : i === 2 ? '0 10px 10px 0' : 0,
                  }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              ))}
            </div>
            <div className="font-condensed fw-bolder fs-5">{rec[0].name}</div>
            <small className="text-muted d-block mb-3">
              <i className="bi bi-geo-alt-fill me-1"></i>{rec[0].location}
            </small>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="tf-info-price-big">₵{rec[0].pricePerHour}</span>
                <span className="tf-info-label ms-1">/hr</span>
                <div>
                  <small className="text-muted">
                    {slots[rec[0].id]?.filter(s => s.status === 'available').length} slots open today
                  </small>
                </div>
              </div>
              <button className="btn btn-primary fw-bold" onClick={() => onOpenTurf(rec[0])}>
                Book Now
              </button>
            </div>
          </div>

          {/* Why section */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
            <div className="fw-bold mb-3 text-primary">🤖 Why We Recommend</div>
            {[
              { ic: '⭐', tx: `Highest rated in Accra (${rec[0].rating}/5.0)` },
              { ic: '💰', tx: 'Competitive pricing for premium facilities' },
              { ic: '🏟️', tx: `${rec[0].amenities.length} amenities incl. floodlights` },
              { ic: '⚡', tx: 'High availability — book before it fills up' },
            ].map((r, i) => (
              <div key={i} className="d-flex gap-2 mb-2 small text-secondary">
                <span>{r.ic}</span><span>{r.tx}</span>
              </div>
            ))}
          </div>

          {/* Best times */}
          <div className="card border-0 shadow-sm rounded-4 p-3">
            <div className="fw-bold mb-3">🕐 Best Times to Book</div>
            {[['6–9 AM', 85], ['12–2 PM', 40], ['4–6 PM', 30], ['7–9 PM', 15]].map(([label, pct]) => (
              <div key={label} className="mb-3">
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-muted">{label}</span>
                  <span
                    className="fw-bold"
                    style={{ color: pct < 40 ? '#198754' : pct < 70 ? '#ffc107' : '#dc3545' }}
                  >
                    {pct}% full
                  </span>
                </div>
                <div className="tf-progress-track">
                  <div
                    className={`tf-progress-fill ${pct < 40 ? 'tf-progress-low' : pct < 70 ? 'tf-progress-medium' : 'tf-progress-high'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
