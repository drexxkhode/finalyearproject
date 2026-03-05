import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useSlots }              from './hooks/useSlots'
import { useNotification }       from './hooks/useNotification'
import AuthScreen                from './components/AuthScreen'
import Notification              from './components/Notification'
import Home                      from './pages/Home'
import TurfDetail                from './pages/TurfDetail'
import Booking                   from './pages/Booking'
import Directions                from './pages/Directions'
import MyBookings                from './pages/MyBookings'

const TABS = [
  { key: 'turfs',     icon: 'bi-grid-fill',   label: 'Browse Turfs' },
  { key: 'map',       icon: 'bi-map-fill',     label: 'Map View' },
  { key: 'recommend', icon: 'bi-stars',        label: 'For You' },
]

function Inner() {
  const { user, logout, setUser }             = useAuth()
  const { notif, notify }                     = useNotification()
  const [screen,       setScreen]             = useState('home')
  const [activeTurf,   setActiveTurf]         = useState(null)
  const [selectedSlot, setSelectedSlot]       = useState(null)
  const [bookings,     setBookings]           = useState([])
  const [activeTab,    setActiveTab]          = useState('turfs')
  const [navOpen,      setNavOpen]            = useState(false)

  const handleLockExpired = useCallback(() => {
    setSelectedSlot(null)
    notify('Slot lock expired! Please re-select.', 'e')
  }, [notify])

  const { slots, lockSlot, releaseSlot, confirmSlot, countdown, fmtCountdown } =
    useSlots(handleLockExpired)

  const openTurf = useCallback(t => {
    setActiveTurf(t)
    setScreen('detail')
    setNavOpen(false)
  }, [])

  const goHome = useCallback(() => {
    setScreen('home')
    setNavOpen(false)
  }, [])

  const handleTabChange = tab => {
    setActiveTab(tab)
    setScreen('home')
    setNavOpen(false)
  }

  const handleConfirmBooking = info => {
    confirmSlot(activeTurf.id, selectedSlot.hour)
    setBookings(prev => [...prev, {
      id:     `BK${Date.now()}`,
      turf:   activeTurf.name,
      slot:   selectedSlot.label,
      date:   info.date || 'Today',
      amount: activeTurf.pricePerHour,
      status: 'Confirmed',
    }])
  }

  /* ── Screen router ── */
  const renderScreen = () => {
    if (screen === 'home')
      return <Home slots={slots} onOpenTurf={openTurf} activeTab={activeTab} onTabChange={handleTabChange} />
    if (screen === 'detail' && activeTurf)
      return (
        <TurfDetail
          turf={activeTurf}
          slots={slots}
          user={user}
          onBack={goHome}
          onBook={() => setScreen('book')}
          onDirections={() => setScreen('dir')}
          lockSlot={lockSlot}
          releaseSlot={releaseSlot}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          countdown={countdown}
          fmtCountdown={fmtCountdown}
          notify={notify}
          onDateChange={() => {}}
        />
      )
    if (screen === 'book' && activeTurf && selectedSlot)
      return (
        <Booking
          turf={activeTurf}
          slot={selectedSlot}
          user={user}
          countdown={countdown}
          fmtCountdown={fmtCountdown}
          onBack={() => setScreen('detail')}
          onConfirm={handleConfirmBooking}
        />
      )
    if (screen === 'dir' && activeTurf)
      return <Directions turf={activeTurf} onBack={() => setScreen('detail')} notify={notify} />
    if (screen === 'bkgs')
      return <MyBookings bookings={bookings} onBack={goHome} />
    return <Home slots={slots} onOpenTurf={openTurf} activeTab={activeTab} onTabChange={handleTabChange} />
  }

  return (
    <div className="tf-page">
      {!user && <AuthScreen onSuccess={u => { setUser(u); notify(`Welcome, ${u.name}! 👋`) }} />}
      <Notification notif={notif} />

      {/* ── Navbar ── */}
      <nav className="tf-navbar">
        <div className="container-xl">
          <div className="d-flex align-items-center justify-content-between py-2">

            {/* Brand */}
            <button
              className="d-flex align-items-center gap-2 border-0 bg-transparent p-0"
              onClick={goHome}
            >
              <div className="tf-brand-icon">⚽</div>
              <div className="text-start">
                <div className="tf-brand-title">TURFFIELD</div>
                <div className="tf-brand-sub">Accra Metropolitan Assembly</div>
              </div>
            </button>

            {/* Desktop nav items */}
            <div className="d-none d-md-flex align-items-center gap-4">
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`tf-nav-link${activeTab === t.key && screen === 'home' ? ' active' : ''}`}
                  onClick={() => handleTabChange(t.key)}
                >
                  <i className={`bi ${t.icon}`}></i>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Right side */}
            <div className="d-flex align-items-center gap-2">
              <span className="tf-live-dot d-none d-md-inline-block"></span>
              <span className="text-muted small d-none d-md-inline">Live</span>

              {user && (
                <span className="text-muted small d-none d-md-inline">
                  <i className="bi bi-person-circle me-1"></i>{user.name.split(' ')[0]}
                </span>
              )}

              <button
                className="btn btn-outline-primary btn-sm fw-bold position-relative"
                onClick={() => { setScreen('bkgs'); setNavOpen(false) }}
              >
                <i className="bi bi-calendar2-check me-1"></i>
                <span className="d-none d-sm-inline">Bookings</span>
                {bookings.length > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">
                    {bookings.length}
                  </span>
                )}
              </button>

              {user && (
                <button
                  className="btn btn-outline-danger btn-sm fw-bold d-none d-md-inline-flex"
                  onClick={() => { logout(); setScreen('home'); notify('Signed out') }}
                >
                  <i className="bi bi-box-arrow-right"></i>
                </button>
              )}

              {/* Mobile hamburger */}
              <button
                className="btn btn-light btn-sm d-md-none"
                onClick={() => setNavOpen(o => !o)}
              >
                <i className={`bi ${navOpen ? 'bi-x-lg' : 'bi-list'} fs-5`}></i>
              </button>
            </div>
          </div>

          {/* Mobile collapse menu */}
          {navOpen && (
            <div className="d-md-none border-top py-2">
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`tf-nav-link d-flex w-100 py-2 px-2 rounded-2${activeTab === t.key && screen === 'home' ? ' active' : ''}`}
                  onClick={() => handleTabChange(t.key)}
                >
                  <i className={`bi ${t.icon} me-2`}></i>{t.label}
                </button>
              ))}
              {user && (
                <button
                  className="btn btn-outline-danger btn-sm fw-bold w-100 mt-2"
                  onClick={() => { logout(); setScreen('home'); notify('Signed out'); setNavOpen(false) }}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ── Main content ── */}
      <div className="container-xl py-4">
        {renderScreen()}
      </div>

      {/* ── Mobile bottom nav (shows only on home screen) ── */}
      {screen === 'home' && (
        <div className="tf-bottom-nav d-md-none">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`tf-bottom-btn${activeTab === t.key ? ' active' : ''}`}
              onClick={() => handleTabChange(t.key)}
            >
              <i className={`bi ${t.icon} tf-bottom-btn-icon`}></i>
              {t.label.split(' ')[0]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  )
}
