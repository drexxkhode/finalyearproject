import { useState, useEffect, useRef } from 'react';
import TurfCard from '../components/TurfCard';
import MapView from './Mapview';
import axios from 'axios';

const PAGE_SIZE = 12

// turfs + setTurfs are lifted to Inner.jsx so data persists across navigation
export default function Home({ slots = {}, onOpenTurf, activeTab, turfs, setTurfs }) {
  const [search,   setSearch]  = useState('')
  const [fCap,     setFCap]    = useState('All')
  const [sort,     setSort]    = useState('distance')
  const [page,     setPage]    = useState(1)
  const [recPage,  setRecPage] = useState(1)
  const [loading,  setLoading] = useState(!turfs.length)

  // Only animate on first mount — not on every re-render (pagination, filter etc.)
  const mountedRef = useRef(false)
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      setAnimated(true)
    }
  }, [])

  const REC_PAGE_SIZE = 6

  useEffect(() => {
    // Skip fetch if data already loaded from a previous navigation
    if (turfs.length > 0) { setLoading(false); return }
    const token = localStorage.getItem('token')
    const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    axios.get(`${API}/turf/turf-data`, { headers }).then(res => {
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
        amenities:    Array.isArray(t.amenities) ? t.amenities : [],
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

  // Reset to page 1 when filters change, and scroll to top on mobile
  useEffect(() => {
    setPage(1)
  }, [search, fCap, sort])

  // Scroll to top on page change — prevents mobile green blank from content being off-screen
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const rec          = [...turfs].sort((a, b) => b.rating - a.rating)
  const recTotal     = Math.ceil(rec.length / REC_PAGE_SIZE)
  const recPaginated = rec.slice((recPage - 1) * REC_PAGE_SIZE, recPage * REC_PAGE_SIZE)
  const featured     = rec[(recPage - 1) * REC_PAGE_SIZE] ?? rec[0]

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary"></div>
      <p className="mt-3 text-muted">Loading turfs...</p>
    </div>
  )

  if (!turfs.length) return <p className="text-center py-5 text-muted">No turfs available</p>

  return (
    // animate-in only fires on initial mount, not on pagination/filter re-renders
    <div className={animated ? 'tf-animate-in' : ''}>

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
              <button className="btn btn-sm btn-outline-primary px-1" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
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
              <button className="btn btn-sm btn-outline-primary px-1" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
          <div className="text-center mt-2 text-muted small">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} turfs
          </div>
        </>
      )}

      {/* ── MAP TAB ── */}
      {activeTab === 'map' && (
        <MapView turfs={turfs} onOpenTurf={onOpenTurf} />
      )}

      {/* ── RECOMMEND TAB ── */}
      {activeTab === 'recommend' && rec.length > 0 && (
        <div className="row g-4">

          {/* ── LEFT — Featured turf highlight ── */}
          <div className="col-12 col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
              <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
                <img
                  src={featured.cover_image ?? 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80'}
                  alt={featured.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.65))' }} />
                <div style={{ position: 'absolute', top: 12, left: 14 }}>
                  <span className="tf-badge tf-badge-yellow">⭐ TOP PICK</span>
                </div>
                <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{featured.name}</div>
                    <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, marginTop: 2 }}>
                      <i className="bi bi-geo-alt-fill me-1"></i>
                      {featured.location}{featured.distance ? ` · ${featured.distance} km` : ''}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(6px)', borderRadius: 8, padding: '4px 10px', textAlign: 'center' }}>
                    <div style={{ color: '#ffc107', fontWeight: 800, fontSize: 15 }}>⭐ {featured.rating}</div>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {featured.surface && <span className="tf-badge tf-badge-gray">{featured.surface}</span>}
                  {featured.capacity && <span className="tf-badge tf-badge-blue">{featured.capacity}</span>}
                  {(Array.isArray(featured.amenities) ? featured.amenities : []).slice(0, 3).map(a => (
                    <span key={a} className="tf-badge tf-badge-green"><i className="bi bi-check-circle-fill me-1"></i>{a}</span>
                  ))}
                </div>
                {featured.about && (
                  <p className="text-muted small mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {featured.about}
                  </p>
                )}
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="tf-info-price-big">₵{featured.pricePerHour}</span>
                    <span className="tf-info-label"> /hr</span>
                  </div>
                  <button className="btn btn-primary fw-bold px-4" onClick={() => onOpenTurf(featured)}>Book Now →</button>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT — Ranked list ── */}
          <div className="col-12 col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="fw-bold">🏆 All Turfs Ranked</div>
                {recTotal > 1 && (
                  <small className="text-muted">
                    {(recPage - 1) * REC_PAGE_SIZE + 1}–{Math.min(recPage * REC_PAGE_SIZE, rec.length)} of {rec.length}
                  </small>
                )}
              </div>
              <div className="flex-grow-1">
                {recPaginated.map((t, i) => {
                  const globalRank = (recPage - 1) * REC_PAGE_SIZE + i + 1
                  const isTop3     = globalRank <= 3
                  const rankColors = ['#ffc107', '#adb5bd', '#cd7f32']
                  return (
                    <div key={t.id} className="d-flex align-items-center gap-3 py-2 border-bottom" style={{ cursor: 'pointer' }} onClick={() => onOpenTurf(t)}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isTop3 ? rankColors[globalRank - 1] : '#f0f0f0', color: isTop3 ? (globalRank === 1 ? '#000' : '#fff') : '#6c757d', fontWeight: 800, fontSize: 12 }}>
                        {globalRank}
                      </div>
                      <img src={t.cover_image ?? 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80'} alt={t.name} width={44} height={44}
                        style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80' }} />
                      <div className="flex-grow-1" style={{ overflow: 'hidden' }}>
                        <div className="fw-bold small text-truncate">{t.name}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>
                          ⭐ {t.rating}{t.surface ? ` · ${t.surface}` : ''}{t.capacity ? ` · ${t.capacity}` : ''}{t.distance ? ` · ${t.distance} km` : ''}
                        </div>
                      </div>
                      <div className="text-primary fw-bold" style={{ fontSize: 13, flexShrink: 0 }}>₵{t.pricePerHour}/hr</div>
                    </div>
                  )
                })}
              </div>
              {recTotal > 1 && (
                <div className="d-flex justify-content-between align-items-center pt-3 mt-2" style={{ borderTop: '1px solid #f0f0f0' }}>
                  <button className="btn btn-sm btn-outline-primary px-3" onClick={() => setRecPage(p => Math.max(1, p - 1))} disabled={recPage === 1}>
                    <i className="bi bi-chevron-left"></i> Prev
                  </button>
                  <div className="d-flex align-items-center gap-1">
                    {Array.from({ length: recTotal }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === recTotal || Math.abs(p - recPage) <= 1)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                        acc.push(p); return acc
                      }, [])
                      .map((p, idx) =>
                        p === '...'
                          ? <span key={`e${idx}`} className="text-muted px-1" style={{ fontSize: 12 }}>…</span>
                          : <button key={p} className={`btn btn-sm px-2 ${recPage === p ? 'btn-primary' : 'btn-outline-secondary'}`} style={{ minWidth: 30 }} onClick={() => setRecPage(p)}>{p}</button>
                      )
                    }
                  </div>
                  <button className="btn btn-sm btn-outline-primary px-3" onClick={() => setRecPage(p => Math.min(recTotal, p + 1))} disabled={recPage === recTotal}>
                    Next <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}