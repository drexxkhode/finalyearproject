import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSlots } from '../hooks/useSlots'
import { useNotification } from '../hooks/useNotification'

import Navbar from '../partials/Navbar'
import MobileBottomNav from '../partials/MobileBottomNav'
import Notification from '../components/Notification'
import AuthScreen from '../components/AuthScreen'
import LostPassword from '../components/LostPassword'

import Home from '../pages/Home'
import TurfDetail from '../pages/TurfDetail'
import Booking from '../pages/Booking'
import MyBookings from '../pages/MyBookings'
import Directions from '../pages/Directions'
import Profile from '../pages/Profile'

import { useState, useCallback, useEffect } from 'react'
import ResetPassword from '../components/ResetPassword'

const TABS = [
  { key: 'turfs',     icon: 'bi-grid-fill', label: 'Browse Turfs' },
  { key: 'map',       icon: 'bi-map-fill',  label: 'Map View'     },
  { key: 'recommend', icon: 'bi-stars',     label: 'For You'      },
]

const STORAGE_KEY = 'tf_active_turf'

export default function Inner() {
  const { user, logout, setUser } = useAuth()
  const { notif, notify }         = useNotification()
  const navigate                  = useNavigate()
  const location                  = useLocation()

  const [activeTurf, setActiveTurf] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? null }
    catch { return null }
  })
  const [activeTab, setActiveTab] = useState('turfs')

  useEffect(() => {
    if (activeTurf) localStorage.setItem(STORAGE_KEY, JSON.stringify(activeTurf))
    else            localStorage.removeItem(STORAGE_KEY)
  }, [activeTurf])

  const handleSlotExpired = useCallback((slotId, reason) => {
    if (reason) notify(`Slot unavailable: ${reason}`, 'e')
    else        notify('A slot lock expired. Please re-select.', 'e')
  }, [notify])

  const {
    slots, loadedTurfs, lockedSlots,
    ensureSlots, refreshSlots,
    lockSlot, releaseSlot,
    confirmAll, leaveSlotRoom, fmtCountdown,
  } = useSlots(handleSlotExpired)

  // Restore slot room on refresh
  useEffect(() => {
    const match = location.pathname.match(/^\/turf\/(\d+)/)
    if (match && activeTurf) ensureSlots(activeTurf.id)
  }, []) // eslint-disable-line

  const openTurf = useCallback((turf) => {
    ensureSlots(turf.id)
    setActiveTurf(turf)
    navigate(`/turf/${turf.id}`)
  }, [navigate, ensureSlots])

  const closeTurf = useCallback(() => {
    if (activeTurf) leaveSlotRoom(activeTurf.id)
    setActiveTurf(null)
    navigate('/')
  }, [activeTurf, leaveSlotRoom, navigate])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    navigate('/')
  }

  // After payment, confirm locks + notify. MyBookings fetches from DB itself.
  const handleConfirmBooking = useCallback((info) => {
    if (!activeTurf) { notify('Invalid booking session', 'e'); return }
    confirmAll(activeTurf.id)
    const count = info.slotCount ?? 1
    notify(`${count} slot${count > 1 ? 's' : ''} booked! 🎉`, 's')
  }, [activeTurf, confirmAll, notify])

  const myLockedCount = Object.values(lockedSlots)
    .filter(l => activeTurf && l.turfId === activeTurf.id).length

  /* ── Unauthenticated ── */
  if (!user) return (
    <>
      <Notification notif={notif} />
      <Routes>
        <Route path="/login" element={
          <AuthScreen onSuccess={(u) => { setUser(u); notify(`Welcome, ${u.name}! 👋`) }} />
        } />
        <Route path="/lost-password" element={<LostPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )

  /* ── Authenticated ── */
  return (
    <div className="tf-page">
      <Notification notif={notif} />
      <Navbar
        TABS={TABS} activeTab={activeTab}
        user={user} logout={logout} onTabChange={handleTabChange}
        notify={notify}
        onProfile={() => navigate('/profile')}
      />

      <div className="container-fluid px-4 py-4">
        <Routes>
          <Route path="/" element={
            <Home slots={slots} onOpenTurf={openTurf} activeTab={activeTab} />
          } />

          <Route path="/turf/:id" element={
            activeTurf
              ? <TurfDetail
                  turf={activeTurf} slots={slots} loadedTurfs={loadedTurfs}
                  lockedSlots={lockedSlots} user={user}
                  onBack={closeTurf}
                  onBook={() => navigate('/booking')}
                  onDirections={turfId => navigate(`/directions/${turfId}`)}
                  lockSlot={lockSlot} releaseSlot={releaseSlot}
                  fmtCountdown={fmtCountdown} notify={notify}
                  onDateChange={date => refreshSlots(activeTurf.id, date)}
                />
              : <Navigate to="/" replace />
          } />

          <Route path="/booking" element={
            activeTurf && myLockedCount > 0
              ? <Booking
                  turf={activeTurf}
                  lockedSlots={Object.values(lockedSlots).filter(l => l.turfId === activeTurf.id)}
                  user={user} fmtCountdown={fmtCountdown}
                  onBack={() => navigate(`/turf/${activeTurf.id}`)}
                  onConfirm={handleConfirmBooking}
                />
              : <Navigate to="/" replace />
          } />

          <Route path="/directions/:id" element={
            <Directions onBack={turfId => navigate(`/turf/${turfId}`)} notify={notify} />
          } />

          <Route path="/mybookings" element={
            <MyBookings onBack={() => navigate('/')} />
          } />

          <Route path="/profile" element={
            <Profile
              user={user}
              onBack={() => navigate(-1)}
              notify={notify}
              onUserUpdate={setUser}
            />
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <MobileBottomNav TABS={TABS} activeTab={activeTab} handleTabChange={handleTabChange} />
    </div>
  )
}