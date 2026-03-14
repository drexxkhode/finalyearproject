/**
 * MapView.jsx
 * Uses react-leaflet for the map base + injects leaflet.markercluster
 * from CDN (since it's not in package.json). Leaflet itself comes from
 * the installed npm package so window.L is guaranteed before cluster loads.
 */
import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon paths broken by Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
]

// ── Load markercluster CSS + JS from CDN (once) ───────────────────────────
// By the time this runs, window.L is already set by the npm Leaflet import above
let clusterLoaded = false
let clusterPromise = null

function loadCluster() {
  if (clusterLoaded) return Promise.resolve()
  if (clusterPromise) return clusterPromise

  clusterPromise = new Promise(resolve => {
    // CSS files
    ;['MarkerCluster.Default', 'MarkerCluster'].forEach(name => {
      if (!document.getElementById(`mc-${name}`)) {
        const link = document.createElement('link')
        link.id   = `mc-${name}`
        link.rel  = 'stylesheet'
        link.href = `https://unpkg.com/leaflet.markercluster@1.5.3/dist/${name}.css`
        document.head.appendChild(link)
      }
    })

    // JS — leaflet already imported so window.L exists when this runs
    if (!document.getElementById('mc-js')) {
      // Expose L globally so markercluster plugin can attach to it
      window.L = L
      const script = document.createElement('script')
      script.id  = 'mc-js'
      script.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster-src.js'
      script.onload = () => { clusterLoaded = true; resolve() }
      script.onerror = () => { console.warn('MarkerCluster CDN failed'); resolve() }
      document.head.appendChild(script)
    } else {
      clusterLoaded = true
      resolve()
    }
  })
  return clusterPromise
}

// ── Inner component that has map access ───────────────────────────────────
function ClusteredMarkers({ turfs, onOpenTurf, clusterReady }) {
  const map        = useMap()
  const mcgRef     = useRef(null)
  const prevTurfs  = useRef([])

  useEffect(() => {
    if (!clusterReady || !L.markerClusterGroup) return

    // Remove previous cluster layer
    if (mcgRef.current) {
      map.removeLayer(mcgRef.current)
      mcgRef.current = null
    }

    const validTurfs = turfs.filter(t => {
      const lat = parseFloat(t.latitude  ?? t.lat)
      const lng = parseFloat(t.longitude ?? t.lng)
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0
    })

    if (validTurfs.length === 0) return

    // Custom cluster bubble
    const mcg = L.markerClusterGroup({
      maxClusterRadius: 60,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      animate: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        const size  = count > 20 ? 54 : count > 10 ? 46 : 38
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;
            background:linear-gradient(135deg,#0d6efd,#0a58ca);
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-weight:900;font-size:${count > 9 ? 13 : 15}px;
            box-shadow:0 4px 16px rgba(13,110,253,.5);
            border:3px solid #fff;
          ">${count}</div>`,
          className: '',
          iconSize:   [size, size],
          iconAnchor: [size / 2, size / 2],
        })
      },
    })

    // Turf pin
    const turfIcon = L.divIcon({
      className: '',
      html: `<div style="
        width:36px;height:36px;
        background:#0d6efd;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 3px 12px rgba(13,110,253,.5);
        display:flex;align-items:center;justify-content:center;
        border:2.5px solid #fff;
      ">
        <span style="transform:rotate(45deg);font-size:16px;line-height:36px;">⚽</span>
      </div>`,
      iconSize:   [36, 36],
      iconAnchor: [18, 36],
      popupAnchor:[0, -40],
    })

    validTurfs.forEach(turf => {
      const lat = parseFloat(turf.latitude  ?? turf.lat)
      const lng = parseFloat(turf.longitude ?? turf.lng)

      const marker = L.marker([lat, lng], { icon: turfIcon })

      marker.bindPopup(`
        <div style="font-family:sans-serif;min-width:170px;padding:4px 0;">
          <div style="font-weight:800;font-size:14px;color:#1a1a2e;margin-bottom:6px;line-height:1.3;">
            ${turf.name}
          </div>
          <div style="color:#6c757d;font-size:12px;margin-bottom:10px;line-height:1.6;">
            📍 ${turf.location ?? turf.district ?? ''}<br/>
            ⭐ ${turf.rating ?? '4.5'} &nbsp;·&nbsp; ₵${turf.pricePerHour}/hr
          </div>
          <button
            onclick="window.__mapOpenTurf(${turf.id})"
            style="
              width:100%;padding:8px;border:none;border-radius:8px;
              background:#0d6efd;color:#fff;font-weight:700;
              font-size:13px;cursor:pointer;
            "
          >View & Book</button>
        </div>
      `, { maxWidth: 220 })

      mcg.addLayer(marker)
    })

    map.addLayer(mcg)
    mcgRef.current = mcg

    // Fit map to markers
    try {
      map.fitBounds(mcg.getBounds(), { padding: [40, 40], maxZoom: 14 })
    } catch {}

    prevTurfs.current = turfs

    return () => {
      if (mcgRef.current) {
        map.removeLayer(mcgRef.current)
        mcgRef.current = null
      }
    }
  }, [turfs, clusterReady, map])

  return null
}

// ── Main export ───────────────────────────────────────────────────────────
export default function MapView({ turfs, onOpenTurf }) {
  const [search,       setSearch]       = useState('')
  const [selected,     setSelected]     = useState(null)
  const [clusterReady, setClusterReady] = useState(false)
  const [page,         setPage]         = useState(1)

  const PAGE_SIZE = 5

  // Filter turfs by search
  const filtered = turfs.filter(t =>
    !search ||
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.location?.toLowerCase().includes(search.toLowerCase())
  )

  // Pagination — derived from filtered list
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset to page 1 whenever the search changes
  const prevSearch = useRef(search)
  if (prevSearch.current !== search) {
    prevSearch.current = search
    if (page !== 1) setPage(1)
  }

  // Load markercluster plugin
  useEffect(() => {
    loadCluster().then(() => setClusterReady(true))
  }, [])

  // Global handler for popup "View & Book" button
  useEffect(() => {
    window.__mapOpenTurf = (id) => {
      const t = turfs.find(x => x.id === id)
      if (t) { setSelected(t); onOpenTurf(t) }
    }
    return () => { delete window.__mapOpenTurf }
  }, [turfs, onOpenTurf])

  // Debug: log what turfs look like
  useEffect(() => {
    if (turfs.length > 0) {
      console.log('[MapView] sample turf:', turfs[0])
      const withCoords = turfs.filter(t => t.latitude && t.longitude)
      console.log(`[MapView] ${withCoords.length}/${turfs.length} turfs have coordinates`)
    }
  }, [turfs])

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 160px)', minHeight: 500 }}>

      {/* ── Map container ── */}
      <div style={{
        flex: 1, position: 'relative', borderRadius: 16,
        overflow: 'hidden', boxShadow: '0 4px 24px rgba(13,110,253,.12)',
      }}>
        <MapContainer
          center={[5.6037, -0.187]}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          <ClusteredMarkers
            turfs={filtered}
            onOpenTurf={onOpenTurf}
            clusterReady={clusterReady}
          />
        </MapContainer>

        {/* Search overlay */}
        <div style={{
          position: 'absolute', top: 12, left: '50%',
          transform: 'translateX(-50%)', zIndex: 1000,
          width: 'min(340px, 88vw)',
        }}>
          <div style={{
            background: 'rgba(255,255,255,.97)', borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,.15)',
            display: 'flex', alignItems: 'center', padding: '8px 14px', gap: 8,
          }}>
            <span>🔍</span>
            <input
              placeholder="Filter turfs on map…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontSize: 14, background: 'transparent',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#888', fontSize: 16 }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Turf count badge */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
          background: 'rgba(13,110,253,.92)', color: '#fff',
          borderRadius: 10, padding: '5px 12px',
          fontSize: 12, fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,.2)',
        }}>
          {filtered.length} turfs
        </div>

        {/* No coords warning */}
        {clusterReady && filtered.length > 0 && filtered.every(t => !t.latitude && !t.lat) && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)', zIndex: 1000,
            background: 'rgba(255,255,255,.95)', borderRadius: 12,
            padding: '16px 24px', textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,.15)',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>No coordinates in database</div>
            <div style={{ color: '#6c757d', fontSize: 13 }}>
              Turfs are missing <code>latitude</code> / <code>longitude</code> values
            </div>
          </div>
        )}
      </div>

      {/* ── Side list (desktop only) ── */}
      <div
        className="d-none d-lg-flex"
        style={{
          width: 300, flexShrink: 0, flexDirection: 'column', gap: 8,
          // No overflowY: 'auto' — pagination replaces scrolling
        }}
      >
        {/* Header — count + page indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: 1 }}>
            {filtered.length} Turf{filtered.length !== 1 ? 's' : ''}
          </div>
          {totalPages > 1 && (
            <div className="text-muted" style={{ fontSize: 11 }}>
              Page {page} of {totalPages}
            </div>
          )}
        </div>

        {/* Turf cards — current page only */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {paginated.map(t => (
            <div
              key={t.id}
              onClick={() => { setSelected(t); onOpenTurf(t) }}
              className="card border-0 shadow-sm rounded-3 p-3"
              style={{
                cursor: 'pointer', display: 'flex', flexDirection: 'row',
                alignItems: 'center', gap: 12,
                border: selected?.id === t.id ? '2px solid #0d6efd' : '1px solid #dee2e6',
                transition: 'border-color .15s',
              }}
            >
              <img
                src={t.cover_image ?? t.image ?? FALLBACK_PHOTOS[0]}
                alt={t.name} width={52} height={52}
                className="rounded-3 flex-shrink-0"
                style={{ objectFit: 'cover' }}
                onError={e => { e.target.src = FALLBACK_PHOTOS[0] }}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div className="fw-bold small text-truncate">{t.name}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>{t.location} · {t.distance ?? '—'} km</div>
                <div className="text-primary fw-bold" style={{ fontSize: 12 }}>₵{t.pricePerHour}/hr</div>
              </div>
              <i className="bi bi-chevron-right text-muted" />
            </div>
          ))}
        </div>

        {/* Pagination controls — only shown when there is more than one page */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 8, borderTop: '1px solid #f0f0f0', marginTop: 4,
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                border: 'none', borderRadius: 8, padding: '5px 12px',
                background: page === 1 ? '#f0f0f0' : '#0d6efd',
                color: page === 1 ? '#adb5bd' : '#fff',
                fontWeight: 700, fontSize: 12, cursor: page === 1 ? 'default' : 'pointer',
                transition: 'background .15s',
              }}
            >
              ‹ Prev
            </button>

            {/* Page number pills */}
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, idx) =>
                  p === '…'
                    ? <span key={`e${idx}`} style={{ fontSize: 11, color: '#adb5bd', alignSelf: 'center' }}>…</span>
                    : <button
                        key={p}
                        onClick={() => setPage(p)}
                        style={{
                          width: 26, height: 26, border: 'none', borderRadius: 6,
                          background: page === p ? '#0d6efd' : '#f0f0f0',
                          color: page === p ? '#fff' : '#495057',
                          fontWeight: 700, fontSize: 11, cursor: 'pointer',
                          transition: 'background .15s',
                        }}
                      >{p}</button>
                )
              }
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                border: 'none', borderRadius: 8, padding: '5px 12px',
                background: page === totalPages ? '#f0f0f0' : '#0d6efd',
                color: page === totalPages ? '#adb5bd' : '#fff',
                fontWeight: 700, fontSize: 12, cursor: page === totalPages ? 'default' : 'pointer',
                transition: 'background .15s',
              }}
            >
              Next ›
            </button>
          </div>
        )}
      </div>
    </div>
  )
}