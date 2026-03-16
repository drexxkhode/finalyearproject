import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSlots } from '../hooks/useSlots'
import { useNotification } from '../hooks/useNotification'

import Navbar from '../partials/Navbar'
import MobileBottomNav from '../partials/MobileBottomNav'
import Notification from '../components/Notification'
import AuthScreen from '../components/AuthScreen'
import LostPassword from '../components/LostPassword'
import ResetPassword from '../components/ResetPassword'

import Home from '../pages/Home'
import TurfDetail from '../pages/TurfDetail'
import Booking from '../pages/Booking'
import MyBookings from '../pages/MyBookings'
import Directions from '../pages/Directions'
import Profile from '../pages/Profile'

import { useState, useCallback, useEffect, useRef } from 'react'

const TABS = [
  { key: 'turfs',     icon: 'bi-grid-fill', label: 'Browse Turfs' },
  { key: 'map',       icon: 'bi-map-fill',  label: 'Map View'     },
  { key: 'recommend', icon: 'bi-stars',     label: 'For You'      },
]

const STORAGE_KEY = 'tf_active_turf'
const SK_PAID     = 'tf_bk_paid'

export default function Inner() {
  const { user, logout, setUser } = useAuth()
  const { notif, notify }         = useNotification()
  const navigate                  = useNavigate()
  const location                  = useLocation()

  const [activeTurf,  setActiveTurf]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? null }
    catch { return null }
  })
  const [activeTab,   setActiveTab]   = useState('turfs')
  // Auth modal state — shown when guest clicks a slot
  const [authOpen,      setAuthOpen]      = useState(false)
  // When true, AuthScreen opens directly on the OTP/verify screen
  const [openOnVerify,  setOpenOnVerify]  = useState(false)
  // Stores the slot the guest intended to lock before auth interrupted
  const pendingLockRef = useRef(null)

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
    viewDate,
    ensureSlots, refreshSlots,
    lockSlot, releaseSlot,
    confirmAll, leaveSlotRoom, fmtCountdown,
  } = useSlots(handleSlotExpired)

  // Restore slot room on hard refresh
  useEffect(() => {
    const onTurfPage    = location.pathname.match(/^\/turf\/(\d+)/)
    const onBookingPage = location.pathname === '/booking'
    if ((onTurfPage || onBookingPage) && activeTurf) ensureSlots(activeTurf.id)
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

  const handleConfirmBooking = useCallback((info) => {
    if (!activeTurf) { notify('Invalid booking session', 'e'); return }
    confirmAll(activeTurf.id)
    const count = info.slotCount ?? 1
    notify(`${count} slot${count > 1 ? 's' : ''} booked! 🎉`, 's')
  }, [activeTurf, confirmAll, notify])

  // Called by TurfDetail when a guest clicks a slot
  const openAuth = useCallback((pendingSlot) => {
    pendingLockRef.current = pendingSlot
    setOpenOnVerify(false)
    setAuthOpen(true)
  }, [])

  // Called by Navbar "Resend code" banner — opens auth modal straight on OTP screen
  const handleResendOtp = useCallback(() => {
    setOpenOnVerify(true)
    setAuthOpen(true)
  }, [])

  // Called by AuthScreen on successful login/register
  // If there is a pending slot intent, execute the lock now
  const handleAuthSuccess = useCallback((u) => {
    setUser(u)
    setAuthOpen(false)
    notify(`Welcome, ${u.name}! 👋`)

    const pending = pendingLockRef.current
    pendingLockRef.current = null
    if (pending) {
      // Small delay — give SocketContext time to connect with the new token
      setTimeout(() => {
        lockSlot(pending.turfId, pending.slotId, pending.slotLabel)
        notify('🔒 Slot locked for 5 mins!')
      }, 600)
    }
  }, [setUser, notify, lockSlot])

  const myLockedSlots  = Object.values(lockedSlots)
    .filter(l => activeTurf && l.turfId === activeTurf.id)

  const bookingStepSaved = !!sessionStorage.getItem('tf_bk_step')
  const bookingPaid      = sessionStorage.getItem(SK_PAID) === '1'
  const canAccessBooking = !!activeTurf && (myLockedSlots.length > 0 || bookingStepSaved || bookingPaid)

  return (
    <div className="tf-page">
      <Notification notif={notif} />

      {/* Auth modal — shown to guests who click a slot */}
      {authOpen && (
        <AuthScreen
          isModal
          startOnVerify={openOnVerify}
          onClose={() => { setAuthOpen(false); setOpenOnVerify(false); pendingLockRef.current = null }}
          onSuccess={handleAuthSuccess}
        />
      )}

      <Navbar
        TABS={TABS} activeTab={activeTab}
        user={user} logout={logout} onTabChange={handleTabChange}
        notify={notify}
        onProfile={() => navigate('/profile')}
        onSignIn={() => setAuthOpen(true)}
        onResendOtp={handleResendOtp}
      />

      <div className="container-fluid px-4 py-4">
        <Routes>
          {/* ── Public auth routes ── */}
          <Route path="/login" element={
            user
              ? <Navigate to="/" replace />
              : <AuthScreen onSuccess={(u) => { setUser(u); notify(`Welcome, ${u.name}! 👋`); navigate('/') }} />
          } />
          <Route path="/lost-password" element={<LostPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ── Public browsing routes (guests allowed) ── */}
          <Route path="/" element={
            <Home slots={slots} onOpenTurf={openTurf} activeTab={activeTab} />
          } />

          <Route path="/turf/:id" element={
            activeTurf
              ? <TurfDetail
                  turf={activeTurf} slots={slots} loadedTurfs={loadedTurfs}
                  lockedSlots={lockedSlots} user={user}
                  viewDate={viewDate}
                  onBack={closeTurf}
                  onBook={() => navigate('/booking')}
                  onDirections={turfId => navigate(`/directions/${turfId}`)}
                  lockSlot={lockSlot} releaseSlot={releaseSlot}
                  fmtCountdown={fmtCountdown} notify={notify}
                  openAuth={openAuth}
                  onDateChange={date => {
                    const today = new Date().toISOString().split('T')[0]
                    if (!date || date < today) {
                      notify('Cannot select a past date', 'e')
                      return
                    }
                    refreshSlots(activeTurf.id, date)
                  }}
                />
              : <Navigate to="/" replace />
          } />

          <Route path="/directions/:id" element={
            <Directions onBack={turfId => navigate(`/turf/${turfId}`)} notify={notify} />
          } />

          {/* ── Protected routes (must be logged in) ── */}
          <Route path="/booking" element={
            !user
              ? <Navigate to="/" replace />
              : canAccessBooking
                ? <Booking
                    turf={activeTurf}
                    lockedSlots={myLockedSlots}
                    user={user}
                    fmtCountdown={fmtCountdown}
                    onBack={() => {
                      sessionStorage.removeItem('tf_bk_step')
                      navigate(activeTurf ? `/turf/${activeTurf.id}` : '/')
                    }}
                    onConfirm={handleConfirmBooking}
                  />
                : <Navigate to="/" replace />
          } />

          <Route path="/mybookings" element={
            !user
              ? <Navigate to="/" replace />
              : <MyBookings onBack={() => navigate('/')} notify={notify} />
          } />

          <Route path="/profile" element={
            !user
              ? <Navigate to="/" replace />
              : <Profile
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