import {
  MapContainer, TileLayer, Marker, Popup, Polyline, useMap,
} from 'react-leaflet'
import { useEffect, useState, useRef, useCallback } from 'react'
import L from 'leaflet'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
const API = import.meta.env.VITE_API_URL;
  
/* ── Icons ─────────────────────────────────────────────────────────── */
const userIcon = L.icon({
  iconUrl:    'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize:   [40, 40],
  iconAnchor: [20, 20],
})

const turfIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:44px;height:44px;background:#0d6efd;
    border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    box-shadow:0 3px 12px rgba(13,110,253,.4);
    display:flex;align-items:center;justify-content:center;
    border:2.5px solid #fff;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="26" height="26"
         style="transform:rotate(45deg);display:block;margin:auto;">
      <rect x="8" y="10" width="48" height="44" rx="4" fill="none" stroke="white" stroke-width="3"/>
      <circle cx="32" cy="32" r="8" fill="none" stroke="white" stroke-width="2"/>
      <line x1="8" y1="32" x2="56" y2="32" stroke="white" stroke-width="2"/>
    </svg>
  </div>`,
  iconSize:   [44, 44],
  iconAnchor: [22, 44],
  popupAnchor:[0, -46],
})

/* ── Map controller ─────────────────────────────────────────────────── */
function MapController({ position, recenterSignal, onDrag }) {
  const map = useMap()
  useEffect(() => { if (position) map.setView(position, 16) }, [])             // eslint-disable-line
  useEffect(() => { if (recenterSignal > 0 && position) map.setView(position, 16) }, [recenterSignal]) // eslint-disable-line
  useEffect(() => {
    map.on('dragstart', onDrag)
    return () => map.off('dragstart', onDrag)
  }, [map, onDrag])
  return null
}

const overlay = { position: 'absolute', zIndex: 1000, pointerEvents: 'auto' }

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function Directions({ onBack, notify }) {
  const { id }     = useParams()
  const navigate   = useNavigate()

  const [userPos,       setUserPos]       = useState(null)
  const [route,         setRoute]         = useState([])
  const [steps,         setSteps]         = useState([])
  const [eta,           setEta]           = useState(null)
  const [distance,      setDistance]      = useState(null)
  const [selectedTurf,  setSelectedTurf]  = useState(null)
  const [showSteps,     setShowSteps]     = useState(false)
  const [isFollowing,   setIsFollowing]   = useState(true)
  const [recenterSignal,setRecenterSignal]= useState(0)
  const [cancelled,     setCancelled]     = useState(false)

  const lastRouteRef = useRef([])
  const watchIdRef   = useRef(null)
  const speakingRef  = useRef(false)

  // ── Stop everything: voice + GPS watch ────────────────────────────
  const stopAll = useCallback(() => {
    // Cancel all speech immediately
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      speakingRef.current = false
    }
    // Stop GPS watch
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  // ── Cancel directions & go back ────────────────────────────────────
  const handleCancel = useCallback(() => {
    stopAll()
    setCancelled(true)
    setTimeout(() => {
      if (onBack) onBack(id)
      else navigate(-1)
    }, 100)
  }, [stopAll, onBack, id, navigate])

  // ── Cleanup on unmount (handles any navigation away) ──────────────
  useEffect(() => {
    return () => { stopAll() }
  }, [stopAll])

  // ── Fetch turf ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    const fetchTurf = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get(
          `${API}/map/turf-dir/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setSelectedTurf(res?.data?.data);
      } catch (err) {
        console.error('Error fetching turf', err)
      }
    }
    fetchTurf()
  }, [id])

  // ── Voice ──────────────────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (cancelled || !text) return
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)
      utt.rate  = 1
      utt.pitch = 1
      speakingRef.current = true
      utt.onend = () => { speakingRef.current = false }
      window.speechSynthesis.speak(utt)
    }
  }, [cancelled])

  // ── Fetch route ────────────────────────────────────────────────────
  const fetchRoute = useCallback(async (lat, lng) => {
    if (cancelled || !selectedTurf?.latitude || !selectedTurf?.longitude) return
    try {
      const res = await axios.post(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        {
          coordinates: [
            [lng, lat],
            [parseFloat(selectedTurf.longitude), parseFloat(selectedTurf.latitude)],
          ],
        },
        {
          headers: { Authorization: ORS_API_KEY, 'Content-Type': 'application/json' },
        }
      )
      if (cancelled) return
      const feature = res.data.features[0]
      const latlngs = feature.geometry.coordinates.map(c => [c[1], c[0]])
      setRoute(latlngs)
      lastRouteRef.current = latlngs

      const summary = feature.properties.summary
      setEta(Math.round(summary.duration / 60))
      setDistance((summary.distance / 1000).toFixed(2))

      const stps = feature.properties.segments[0].steps
      setSteps(stps)
      speak(stps[0]?.instruction)
    } catch (err) {
      console.error('Route error', err)
    }
  }, [cancelled, selectedTurf, speak])

  // ── Reroute check ──────────────────────────────────────────────────
  const checkReroute = useCallback((lat, lng) => {
    if (cancelled) return
    if (!lastRouteRef.current.length) { fetchRoute(lat, lng); return }
    const [rlat, rlng] = lastRouteRef.current[0]
    const dist = Math.sqrt((lat - rlat) ** 2 + (lng - rlng) ** 2) * 111
    if (dist > 0.1) fetchRoute(lat, lng)
  }, [cancelled, fetchRoute])

  // ── GPS watch ──────────────────────────────────────────────────────
  useEffect(() => {
    if (cancelled) return
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserPos([lat, lng])
        if (selectedTurf) checkReroute(lat, lng)
      },
      err => console.error(err),
      { enableHighAccuracy: true }
    )
    watchIdRef.current = id
    return () => {
      navigator.geolocation.clearWatch(id)
      watchIdRef.current = null
    }
  }, [selectedTurf, cancelled, checkReroute])

  // Fetch route when turf loads + position known
  useEffect(() => {
    if (userPos && selectedTurf && !cancelled) fetchRoute(userPos[0], userPos[1])
  }, [selectedTurf]) // eslint-disable-line

  const handleDrag = useCallback(() => setIsFollowing(false), [])

  // ── Loading screen ─────────────────────────────────────────────────
  if (!userPos || !selectedTurf) return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0f1923', color: '#fff', fontFamily: 'sans-serif',
      gap: 16,
    }}>
      <div style={{ fontSize: 18 }}>📍 Getting your location...</div>
      <button
        onClick={handleCancel}
        style={{
          background: '#dc3545', border: 'none', borderRadius: 10,
          color: '#fff', fontWeight: 700, fontSize: 14, padding: '10px 24px',
          cursor: 'pointer', fontFamily: 'sans-serif',
        }}
      >
        ✕ Cancel
      </button>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>

      <MapContainer
        center={userPos} zoom={15}
        style={{ height: '100vh', width: '100vw' }}
        zoomControl={false}
      >
        <MapController position={userPos} recenterSignal={recenterSignal} onDrag={handleDrag} />
        <TileLayer attribution="OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={userPos} icon={userIcon}><Popup>You</Popup></Marker>
        {selectedTurf && (
          <Marker
            position={[parseFloat(selectedTurf.latitude), parseFloat(selectedTurf.longitude)]}
            icon={turfIcon}
          >
            <Popup>{selectedTurf.name}</Popup>
          </Marker>
        )}
        {route.length > 0 && (
          <Polyline positions={route} pathOptions={{ color: '#0d6efd', weight: 6, opacity: 0.9 }} />
        )}
      </MapContainer>

      {/* ── Top-left: Back + Cancel ── */}
      <div style={{ ...overlay, top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => { stopAll(); if (onBack) onBack(id); else navigate(-1) }}
          style={{
            background: 'rgba(255,255,255,.95)', border: 'none', borderRadius: 12,
            padding: '8px 16px', fontFamily: 'sans-serif', fontWeight: 600,
            fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: 6, boxShadow: '0 4px 16px rgba(0,0,0,.15)',
          }}
        >
          ← Back
        </button>

        {/* Cancel Directions — stops voice + routing */}
        {(route.length > 0 || eta !== null) && (
          <button
            onClick={handleCancel}
            style={{
              background: 'rgba(220,53,69,.92)', border: 'none', borderRadius: 12,
              padding: '8px 16px', fontFamily: 'sans-serif', fontWeight: 700,
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: 6, boxShadow: '0 4px 16px rgba(220,53,69,.3)', color: '#fff',
              backdropFilter: 'blur(6px)',
            }}
          >
            <span style={{ fontSize: 16 }}>🔇</span> Cancel Directions
          </button>
        )}
      </div>

      {/* ── Re-center ── */}
      {!isFollowing && (
        <button
          onClick={() => { setIsFollowing(true); setRecenterSignal(n => n + 1) }}
          style={{
            ...overlay, bottom: 160, right: 20, width: 48, height: 48,
            borderRadius: '50%', background: 'white', border: '2px solid #0d6efd',
            boxShadow: '0 4px 16px rgba(0,0,0,.25)', cursor: 'pointer', fontSize: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >📍</button>
      )}

      {/* ── ETA card ── */}
      {(eta !== null || distance !== null) && (
        <div style={{
          ...overlay, bottom: 32, left: '50%', transform: 'translateX(-50%)',
          width: 'min(420px,92vw)',
        }}>
          <div style={{
            background: 'rgba(15,25,40,.93)', borderRadius: 20,
            boxShadow: '0 8px 32px rgba(0,0,0,.3)', overflow: 'hidden',
            backdropFilter: 'blur(8px)',
          }}>
            {/* Turf name bar */}
            <div style={{
              padding: '10px 20px 8px', borderBottom: '1px solid rgba(255,255,255,.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>🏟️</span>
                <span style={{ color: '#cde', fontSize: 13, fontFamily: 'sans-serif', fontWeight: 500 }}>
                  {selectedTurf.name}
                </span>
              </div>
              {/* Mute / unmute voice */}
              <button
                onClick={() => {
                  if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel()
                  } else {
                    speak(steps[0]?.instruction ?? 'Navigation active')
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8,
                  color: '#cde', cursor: 'pointer', fontSize: 16, padding: '4px 8px',
                }}
                title="Toggle voice"
              >🔊</button>
            </div>

            {/* ETA / Distance / Steps toggle */}
            <div style={{ display: 'flex', padding: '14px 20px' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ color: '#0d6efd', fontSize: 30, fontWeight: 700, fontFamily: 'sans-serif', lineHeight: 1 }}>{eta}</div>
                <div style={{ color: '#7a9ab8', fontSize: 12, fontFamily: 'sans-serif', marginTop: 4 }}>min ETA</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,.1)', margin: '0 8px' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ color: '#fff', fontSize: 30, fontWeight: 700, fontFamily: 'sans-serif', lineHeight: 1 }}>{distance}</div>
                <div style={{ color: '#7a9ab8', fontSize: 12, fontFamily: 'sans-serif', marginTop: 4 }}>km away</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,.1)', margin: '0 8px' }} />
              <div style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => setShowSteps(v => !v)}
                  style={{
                    background: showSteps ? '#0d6efd' : 'rgba(13,110,253,.15)',
                    border: 'none', borderRadius: 10, color: showSteps ? '#fff' : '#0d6efd',
                    cursor: 'pointer', fontSize: 12, fontFamily: 'sans-serif',
                    fontWeight: 700, padding: '8px 10px', width: '100%', transition: 'all .2s',
                  }}
                >
                  {showSteps ? 'Hide' : 'Steps'}
                </button>
              </div>
            </div>

            {/* Turn-by-turn steps */}
            {showSteps && steps.length > 0 && (
              <div style={{
                borderTop: '1px solid rgba(255,255,255,.08)',
                maxHeight: 220, overflowY: 'auto', padding: '8px 0',
              }}>
                {steps.map((s, i) => (
                  <div key={i} style={{
                    padding: '8px 20px', display: 'flex', gap: 12, alignItems: 'flex-start',
                    borderBottom: i < steps.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none',
                  }}>
                    <span style={{ color: '#0d6efd', fontSize: 11, fontWeight: 700, fontFamily: 'sans-serif', minWidth: 20, paddingTop: 1 }}>
                      {i + 1}
                    </span>
                    <span style={{ color: '#c8ddef', fontSize: 13, fontFamily: 'sans-serif', lineHeight: 1.4 }}>
                      {s.instruction}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}