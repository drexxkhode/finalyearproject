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

import { useState, useCallback, useEffect } from 'react'

const TABS = [
  { key: 'turfs',     icon: 'bi-grid-fill', label: 'Browse Turfs' },
  { key: 'map',       icon: 'bi-map-fill',  label: 'Map View'     },
  { key: 'recommend', icon: 'bi-stars',     label: 'For You'      },
]

const STORAGE_KEY    = 'tf_active_turf'
const SK_PAID        = 'tf_bk_paid'      // set by Booking.jsx on success

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
    viewDate,
    ensureSlots, refreshSlots,
    lockSlot, releaseSlot,
    confirmAll, leaveSlotRoom, fmtCountdown,
  } = useSlots(handleSlotExpired)

  // Restore slot room on hard refresh — covers both /turf/:id and /booking
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

  // ── Booking route guard — survives refresh ─────────────────────────────
  // myLockedCount from React state is 0 after refresh (state lost).
  // We allow /booking if:
  //   (a) user has active locked slots in state (normal flow), OR
  //   (b) sessionStorage has booking step saved (mid-checkout refresh), OR
  //   (c) payment was just completed (show success screen)
  const myLockedSlots = Object.values(lockedSlots)
    .filter(l => activeTurf && l.turfId === activeTurf.id)

  const bookingStepSaved = !!sessionStorage.getItem('tf_bk_step')
  const bookingPaid      = sessionStorage.getItem(SK_PAID) === '1'
  // activeTurf must exist — if it's null (e.g. localStorage cleared) we can't render Booking
  const canAccessBooking = !!activeTurf && (myLockedSlots.length > 0 || bookingStepSaved || bookingPaid)

  /* ── Unauthenticated ── */
  if (!user) return (
    <>
      <Notification notif={notif} />
      <Routes>
        <Route path="/login" element={
          <AuthScreen onSuccess={(u) => { setUser(u); notify(`Welcome!, ${u.name}! 👋`) }} />
        } />
        <Route path="/lost-password" element={<LostPassword />} />
      <Route path={"/reset-password/:token"} element={<ResetPassword/>} />
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
                  viewDate={viewDate}
                  onBack={closeTurf}
                  onBook={() => navigate('/booking')}
                  onDirections={turfId => navigate(`/directions/${turfId}`)}
                  lockSlot={lockSlot} releaseSlot={releaseSlot}
                  fmtCountdown={fmtCountdown} notify={notify}
                  onDateChange={date => {
                    const today = new Date().toISOString().split('T')[0]
                    // BUG 2 FIX: Hard-reject past dates even if mobile browser
                    // bypasses the min= attribute on the date input
                    if (!date || date < today) {
                      notify('Cannot select a past date', 'e')
                      return
                    }
                    refreshSlots(activeTurf.id, date)
                  }}
                />
              : <Navigate to="/" replace />
          } />

          <Route path="/booking" element={
            canAccessBooking
              ? <Booking
                  turf={activeTurf}
                  lockedSlots={myLockedSlots}
                  user={user}
                  fmtCountdown={fmtCountdown}
                  onBack={() => {
                    // clear session so back button from booking goes to turf detail
                    sessionStorage.removeItem('tf_bk_step')
                    navigate(activeTurf ? `/turf/${activeTurf.id}` : '/')
                  }}
                  onConfirm={handleConfirmBooking}
                />
              : <Navigate to="/" replace />
          } />

          <Route path="/directions/:id" element={
            <Directions onBack={turfId => navigate(`/turf/${turfId}`)} notify={notify} />
          } />

          <Route path="/mybookings" element={
            <MyBookings onBack={() => navigate('/')} notify={notify} />
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
};