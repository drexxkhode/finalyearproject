import {
  Circle, MapContainer, TileLayer, Marker, Popup, Polyline, useMap,
} from 'react-leaflet'
import { useEffect, useState, useRef, useCallback } from 'react'
import L from 'leaflet'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import AppSpinner from '../components/AppSpinner'

//const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
// Routing key now belongs on the server.
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
const REROUTE_COOLDOWN_MS = 20000
const MAX_ACCURACY_METERS = 250

// Lightweight adaptive Kalman filter: noisier GPS readings get less influence.
function smoothPosition(previous, raw) {
  if (!previous) return { ...raw, variance: Math.max(raw.accuracy ** 2, 25) }
  const predictedVariance = previous.variance + 9
  const measurementVariance = Math.max(raw.accuracy ** 2, 25)
  const gain = predictedVariance / (predictedVariance + measurementVariance)
  return { ...raw, lat: previous.lat + gain * (raw.lat - previous.lat), lng: previous.lng + gain * (raw.lng - previous.lng), variance: (1 - gain) * predictedVariance }
}

function nearestRouteMatch(point, route) {
  if (route.length < 2) return { distance: Infinity, point }
  const latScale = 111320
  const lngScale = latScale * Math.cos(point[0] * Math.PI / 180)
  let nearest = Infinity
  let nearestPoint = point
  for (let i = 0; i < route.length - 1; i += 1) {
    const a = [(route[i][1] - point[1]) * lngScale, (route[i][0] - point[0]) * latScale]
    const b = [(route[i + 1][1] - point[1]) * lngScale, (route[i + 1][0] - point[0]) * latScale]
    const dx = b[0] - a[0]; const dy = b[1] - a[1]
    const t = Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / ((dx * dx + dy * dy) || 1)))
    const distance = Math.hypot(a[0] + t * dx, a[1] + t * dy)
    if (distance < nearest) {
      nearest = distance
      nearestPoint = [point[0] + (a[1] + t * dy) / latScale, point[1] + (a[0] + t * dx) / lngScale]
    }
  }
  return { distance: nearest, point: nearestPoint }
}

/* ── Map controller ─────────────────────────────────────────────────── */
function MapController({ position, recenterSignal, onDrag, isFollowing }) {
  const map = useMap()
  useEffect(() => { if (position && isFollowing) map.panTo(position, { animate: true, duration: .45 }) }, [map, position, isFollowing])
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
  const [voiceEnabled,  setVoiceEnabled]  = useState(false)
  const [gpsAccuracy,   setGpsAccuracy]   = useState(null)
  const [gpsMessage,    setGpsMessage]    = useState('Getting a precise location…')
  const [turfError,     setTurfError]     = useState('')

  const lastRouteRef = useRef([])
  const watchIdRef   = useRef(null)
  const speakingRef  = useRef(false)
  const filterRef = useRef(null)
  const offRouteReadingsRef = useRef(0)

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
        setTurfError(err.response?.data?.message || 'Unable to load this turf location.')
      }
    }
    fetchTurf()
  }, [id])

  // ── Voice ──────────────────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (cancelled || !voiceEnabled || !text) return
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)
      utt.rate  = 1
      utt.pitch = 1
      speakingRef.current = true
      utt.onend = () => { speakingRef.current = false }
      window.speechSynthesis.speak(utt)
    }
  }, [cancelled, voiceEnabled])

  useEffect(() => {
    if (voiceEnabled && steps[0]?.text) speak(steps[0].text)
  }, [voiceEnabled]) // eslint-disable-line react-hooks/exhaustive-deps
  /*
const lastFetchTimeRef = useRef(0)
const inFlightRef      = useRef(false)
  // ── Fetch route ────────────────────────────────────────────────────
  const fetchRoute = useCallback(async (lat, lng) => {
  if (cancelled || !selectedTurf?.latitude || !selectedTurf?.longitude || inFlightRef.current) return;
  inFlightRef.current =true;
  try {
    console.log('[route] user:', lat, lng, '→ turf:', selectedTurf.latitude, selectedTurf.longitude)
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
        timeout: 10000, // fail fast instead of hanging indefinitely
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
    console.error('Route error', err.response?.status, err.response?.data ?? err.message)
    if (err.response?.status === 504 || err.code === 'ECONNABORTED') {
      notify?.('Routing service is slow to respond — retrying shortly…', 'e')
    } else {
      notify?.('Could not calculate directions right now.', 'e')
    }
  }  finally {
    inFlightRef.current = false
  }
}, [cancelled, selectedTurf, speak, notify])

  // ── Reroute check ──────────────────────────────────────────────────


const checkReroute = useCallback((lat, lng, accuracy) => {
  if (cancelled || inFlightRef.current) return
  if (!lastRouteRef.current.length) { fetchRoute(lat, lng); return }
  const { distance: dist } = nearestRouteMatch([lat, lng], lastRouteRef.current)
  const threshold = Math.max(35, Math.min(65, accuracy * 1.5))
  const now = Date.now()
  offRouteReadingsRef.current = dist > threshold ? offRouteReadingsRef.current + 1 : 0
  if (offRouteReadingsRef.current >= 3 && now - lastFetchTimeRef.current > REROUTE_COOLDOWN_MS) {
    lastFetchTimeRef.current = now
    offRouteReadingsRef.current = 0
    setGpsMessage('You are off route. Finding a better route…')
    fetchRoute(lat, lng)
  }
}, [cancelled, fetchRoute])  */

const lastFetchTimeRef = useRef(0)
const inFlightRef      = useRef(false)

const fetchRoute = useCallback(async (lat, lng) => {
  if (cancelled || !selectedTurf?.latitude || !selectedTurf?.longitude || inFlightRef.current) return
  inFlightRef.current = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get(`${API}/map/route/${id}`, {
      params: {
        point: [
          `${lat},${lng}`,
          `${selectedTurf.latitude},${selectedTurf.longitude}`,
        ],
        vehicle:         'car',
        instructions:    true,
        points_encoded:  false,
        key:             undefined,
      },
      paramsSerializer: params => {
        // axios doesn't repeat array params as `point=...&point=...` by default —
        // GraphHopper needs the same key twice, once per waypoint
        const parts = []
        for (const [k, v] of Object.entries(params)) {
          if (Array.isArray(v)) v.forEach(item => parts.push(`${k}=${encodeURIComponent(item)}`))
          else parts.push(`${k}=${encodeURIComponent(v)}`)
        }
        return parts.join('&')
      },
      timeout: 10000,
      headers: { Authorization: `Bearer ${token}` },
    })

    if (cancelled) return
    const path = res.data.data
    if (!path) throw new Error('No route found')

    const latlngs = path.points.map(c => [c[1], c[0]])
    setRoute(latlngs)
    lastRouteRef.current = latlngs

    setEta(Math.round(path.time / 60000))          // ms → minutes
    setDistance((path.distance / 1000).toFixed(2))  // m → km

    const stps = path.instructions ?? []
    setSteps(stps)
    speak(stps[0]?.text)

  } catch (err) {
    console.error('Route error', err.response?.status, err.response?.data ?? err.message)
    if (err.code === 'ECONNABORTED') {
      notify?.('Routing service is slow to respond. Please try again.', 'e')
    } else {
      notify?.('Could not calculate directions right now.', 'e')
    }
  } finally {
    inFlightRef.current = false
  }
}, [cancelled, selectedTurf, speak, notify])

const checkReroute = useCallback((lat, lng, accuracy) => {
  if (cancelled || inFlightRef.current) return
  if (!lastRouteRef.current.length) { fetchRoute(lat, lng); return }
  const { distance: dist } = nearestRouteMatch([lat, lng], lastRouteRef.current)
  const threshold = Math.max(35, Math.min(65, (accuracy || 35) * 1.5))
  const now = Date.now()
  offRouteReadingsRef.current = dist > threshold ? offRouteReadingsRef.current + 1 : 0
  if (offRouteReadingsRef.current >= 3 && now - lastFetchTimeRef.current > REROUTE_COOLDOWN_MS) {
    lastFetchTimeRef.current = now
    offRouteReadingsRef.current = 0
    setGpsMessage('You are off route. Finding a better route…')
    fetchRoute(lat, lng)
  }
}, [cancelled, fetchRoute])

  // ── GPS watch ──────────────────────────────────────────────────────
  useEffect(() => {
    if (cancelled) return
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return
        const { latitude, longitude, accuracy } = pos.coords
        if (accuracy > MAX_ACCURACY_METERS) {
          setGpsMessage(`Location accuracy is ±${Math.round(accuracy)} m. Move outdoors for better directions.`)
          return
        }
        const filtered = smoothPosition(filterRef.current, { lat: latitude, lng: longitude, accuracy })
        filterRef.current = filtered
        setUserPos([filtered.lat, filtered.lng])
        setGpsAccuracy(accuracy)
        setGpsMessage(accuracy > 35 ? `Location accuracy ±${Math.round(accuracy)} m` : '')
        if (selectedTurf) checkReroute(filtered.lat, filtered.lng, accuracy)
      },
      err => setGpsMessage(err.code === 1 ? 'Location permission is required for directions.' : 'Unable to get your location. Check GPS and try again.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
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
      <div style={{ fontSize: 18 }}><AppSpinner small size={42} color="#fff" /></div>
      <div style={{ fontSize: 18 }}>{turfError || gpsMessage}</div>
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
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <style>{`@keyframes tf-route-pulse{0%,100%{opacity:.72}50%{opacity:1}} .tf-route-line{animation:tf-route-pulse 1.8s ease-in-out infinite}`}</style>

      <MapContainer
        center={userPos} zoom={15}
        style={{ height: '100dvh', width: '100vw' }}
        zoomControl={false}
      >
        <MapController position={userPos} recenterSignal={recenterSignal} onDrag={handleDrag} isFollowing={isFollowing} />
        <TileLayer attribution="OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {gpsAccuracy && <Circle center={userPos} radius={gpsAccuracy} pathOptions={{ color: '#0d6efd', fillColor: '#0d6efd', fillOpacity: .08, weight: 1 }} />}
        <Marker position={route.length > 1 ? nearestRouteMatch(userPos, route).point : userPos} icon={userIcon}><Popup>Your live location</Popup></Marker>
        {selectedTurf && (
          <Marker
            position={[parseFloat(selectedTurf.latitude), parseFloat(selectedTurf.longitude)]}
            icon={turfIcon}
          >
            <Popup>{selectedTurf.name}</Popup>
          </Marker>
        )}
        {route.length > 0 && <>
          <Polyline positions={route} pathOptions={{ color: '#fff', weight: 10, opacity: 0.85 }} />
          <Polyline positions={route} className="tf-route-line" pathOptions={{ color: '#0d6efd', weight: 6, opacity: 1, lineCap: 'round' }} />
        </>}
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
          width: 'min(420px,92vw)', maxHeight: 'min(62dvh,520px)',
        }}>
          <div style={{
            background: 'rgba(15,25,40,.93)', borderRadius: 20,
            boxShadow: '0 8px 32px rgba(0,0,0,.3)', overflowY: 'auto',
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
                onClick={() => setVoiceEnabled(value => {
                  const next = !value
                  if (!next) window.speechSynthesis?.cancel()
                  return next
                })}
                style={{
                  background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8,
                  color: '#cde', cursor: 'pointer', fontSize: 16, padding: '4px 8px',
                }}
                title={voiceEnabled ? 'Turn voice guidance off' : 'Speak directions'}
              >{voiceEnabled ? '🔊' : '🔇'}</button>
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
                      {s.text}
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
