import { useState, useEffect } from 'react';
import TurfCard from '../components/TurfCard';
import MapView from './Mapview';
import axios from 'axios';

const PAGE_SIZE = 12

export default function Home({ slots = {}, onOpenTurf, activeTab }) {
  const [search,  setSearch]  = useState('')
  const [fCap,    setFCap]    = useState('All')
  const [sort,    setSort]    = useState('distance')
  const [page,    setPage]    = useState(1)
  const [turfs,   setTurfs]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
    axios.get(`${API}/turf/turf-data`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      setTurfs(res.data.data.map(t => ({
        ...t,
        pricePerHour: t.price_per_hour,
        location:     t.district || t.location,
        address:      t.location,
        cover_image:  t.cover_image ?? null,
        images:       t.images       ?? [],
        distance:     t.distance ?? 0,
        rating:       t.rating   ?? 4.5,
        capacity:     t.capacity ?? '5',
        surface:      t.surface  ?? 'Astro Turf',
        amenities:    t.amenities ? t.amenities.split(',').map(a => a.trim()) : [],
        about:        t.about    ?? '',
      })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = turfs
    .filter(t =>
      (fCap === 'All' || t.capacity?.includes(fCap)) &&
      (!search ||
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.location?.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) =>
      sort === 'price'  ? a.pricePerHour - b.pricePerHour :
      sort === 'rating' ? b.rating - a.rating :
      parseFloat(a.distance ?? 0) - parseFloat(b.distance ?? 0)
    )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  useEffect(() => { setPage(1) }, [search, fCap, sort])

  const rec = [...turfs].sort((a, b) => b.rating - a.rating)

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary"></div>
      <p className="mt-3 text-muted">Loading turfs...</p>
    </div>
  )

  if (!turfs.length) return <p className="text-center py-5 text-muted">No turfs available</p>

  return (
    <div className="tf-animate-in">

      {/* ── TURFS TAB ── */}
      {activeTab === 'turfs' && (
        <>
          <div className="tf-filter-bar">
            <div className="tf-filter-search">
              <input className="form-control" placeholder="🔍 Search turfs in Accra…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select tf-filter-select" value={fCap} onChange={e => setFCap(e.target.value)}>
              <option value="All">All Sizes</option>
              <option value="5">5-a-side</option>
              <option value="7">7-a-side</option>
              <option value="11">11-a-side</option>
            </select>
            <select className="form-select tf-filter-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="distance">Nearest</option>
              <option value="rating">Top Rated</option>
              <option value="price">Cheapest</option>
            </select>
            <div className="d-flex align-items-center gap-2 ms-auto">
              <span className="tf-live-dot"></span>
              <small className="text-muted">Live updates</small>
            </div>
          </div>

          {filtered.length === 0 && <p className="text-center text-muted py-5">No turfs match your search.</p>}

          <div className="row g-4">
            {paginated.map(t => (
              <div key={t.id} className="col-12 col-sm-6 col-xl-4 col-xxl-3">
                <TurfCard turf={t} slots={slots} onOpen={onOpenTurf} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center gap-3 mt-5">
              <button className="btn btn-outline-primary px-3" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                <i className="bi bi-chevron-left"></i> Prev
              </button>
              <div className="d-flex align-items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                    acc.push(p); return acc
                  }, [])
                  .map((p, idx) =>
                    p === '...'
                      ? <span key={`e${idx}`} className="text-muted px-1">…</span>
                      : <button key={p}
                          className={`btn btn-sm px-3 ${page === p ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => setPage(p)}>{p}</button>
                  )}
              </div>
              <button className="btn btn-outline-primary px-3" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
          <div className="text-center mt-2 text-muted small">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} turfs
          </div>
        </>
      )}

      {/* ── MAP TAB — real Leaflet with clustering ── */}
      {activeTab === 'map' && (
        <MapView turfs={turfs} onOpenTurf={onOpenTurf} />
      )}

      {/* ── RECOMMEND TAB ── */}
      {activeTab === 'recommend' && rec.length > 0 && (
        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="tf-rec-highlight">
              <span className="tf-badge tf-badge-yellow">⭐ TOP PICK</span>
              <img src={rec[0].cover_image || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80'} alt={rec[0].name} className="img-fluid rounded mb-3"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80' }} />
              <div className="fw-bold fs-4">{rec[0].name}</div>
              <small className="text-muted">{rec[0].location}</small>
              <div className="mt-3">
                <span className="tf-info-price-big">₵{rec[0].pricePerHour}</span>
                <span className="tf-info-label"> /hr</span>
              </div>
              <button className="btn btn-primary mt-3" onClick={() => onOpenTurf(rec[0])}>Book Now</button>
            </div>
          </div>
          <div className="col-12 col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-3">
              <div className="fw-bold mb-3">🏆 All Turfs Ranked</div>
              {rec.map((t, i) => (
                <div key={t.id} className="d-flex align-items-center gap-3 py-2 border-bottom" style={{ cursor: 'pointer' }}
                  onClick={() => onOpenTurf(t)}>
                  <div className="fw-bold">{i + 1}</div>
                  <img src={t.cover_image || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80'} alt={t.name} width={44} height={44} className="rounded"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80' }} />
                  <div className="flex-grow-1">
                    <div className="fw-bold small">{t.name}</div>
                    <small className="text-muted">⭐ {t.rating}</small>
                  </div>
                  <div className="text-primary fw-bold">₵{t.pricePerHour}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}