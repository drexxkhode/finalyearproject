import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar({ TABS, activeTab, onTabChange, bookings, user, logout, notify, onProfile }) {
  const navigate   = useNavigate()
  const location   = useLocation()
  const [open, setOpen] = useState(false)
  const firstName  = user?.name?.split(' ')[0] || ''

  const handleLogout = () => {
    logout()
    notify('Signed out')
    setOpen(false)
    navigate('/login')
  }

  const closeAndGo = (path) => { setOpen(false); navigate(path) }

  // Avatar initials circle (mini version for navbar)
  const colors = ['#0d6efd','#198754','#dc3545','#0dcaf0','#6f42c1','#fd7e14']
  const avatarColor = colors[(user?.name?.charCodeAt(0) ?? 0) % colors.length]
  const initials = (user?.name ?? 'U').split(' ').slice(0,2).map(w => w[0]?.toUpperCase() ?? '').join('')

  const AvatarBtn = ({ size = 32, onClick }) => (
    <button
      onClick={onClick}
      title="View Profile"
      style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
        border: '2px solid #fff',
        boxShadow: `0 2px 8px ${avatarColor}44`,
        color: '#fff', fontWeight: 900,
        fontSize: size * 0.36,
        fontFamily: "'Barlow Condensed',sans-serif",
        cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {initials}
    </button>
  )

  return (
    <nav className="tf-navbar">
      <div className="container-fluid px-4">

        <div className="d-flex align-items-center justify-content-between py-2">

          {/* Brand */}
          <button className="d-flex align-items-center gap-2 border-0 bg-transparent p-0" onClick={() => navigate('/')}>
            <div className="tf-brand-icon">⚽</div>
            <div className="text-start">
              <div className="tf-brand-title">TURFARENA</div>
              <div className="tf-brand-sub">Accra Metropolitan Assembly</div>
            </div>
          </button>

          {/* Desktop centre tabs */}
          {location.pathname === '/' && TABS && (
            <div className="d-none d-md-flex align-items-center gap-4">
              {TABS.map(tab => (
                <button key={tab.key}
                  className={`tf-nav-link${activeTab === tab.key ? ' active' : ''}`}
                  onClick={() => onTabChange(tab.key)}
                >
                  <i className={`bi ${tab.icon} me-1`}></i>{tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="d-flex align-items-center gap-2">
            <span className="tf-live-dot d-none d-md-inline-block"></span>
            <span className="text-muted small d-none d-md-inline">Live</span>

            {/* Profile avatar button — desktop */}
            {user && (
              <div className="d-none d-md-flex align-items-center gap-2">
                <AvatarBtn onClick={onProfile} />
                <span className="text-muted small" style={{ cursor: 'pointer' }} onClick={onProfile}>
                  {firstName}
                </span>
              </div>
            )}

            <button
              className="btn btn-outline-primary btn-sm fw-bold position-relative d-none d-md-inline-flex"
              onClick={() => navigate('/mybookings')}
            >
              <i className="bi bi-calendar2-check me-1"></i>Bookings
              {bookings?.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">
                  {bookings?.length}
                </span>
              )}
            </button>

            {user && (
              <button className="btn btn-outline-danger btn-sm fw-bold d-none d-md-inline-flex" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right"></i>
              </button>
            )}

            {/* Mobile hamburger */}
            <button className="btn btn-light btn-sm d-md-none" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
              <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'} fs-5`}></i>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="d-md-none border-top pb-3 pt-2">

            {/* User card with avatar + profile link */}
            {user && (
              <div
                className="d-flex align-items-center gap-3 px-2 py-2 mb-2 rounded-3"
                style={{ background: 'var(--tf-blue-light,#e7f0ff)', cursor: 'pointer' }}
                onClick={() => { closeAndGo('/profile') }}
              >
                <AvatarBtn size={40} onClick={() => {}} />
                <div className="flex-grow-1">
                  <div className="fw-bold small">{user.name}</div>
                  <div className="text-muted" style={{ fontSize: '.72rem' }}>{user.email}</div>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <span className="tf-live-dot"></span>
                  <span className="text-muted" style={{ fontSize: '.72rem' }}>Live</span>
                </div>
                <i className="bi bi-chevron-right text-muted small"></i>
              </div>
            )}

            {/* Profile button */}
            {user && (
              <button className="btn btn-outline-primary btn-sm fw-bold w-100 mb-2"
                onClick={() => closeAndGo('/profile')}>
                <i className="bi bi-person-circle me-2"></i>My Profile
              </button>
            )}

            {/* Tabs */}
            {location.pathname === '/' && TABS && (
              <div className="mb-2">
                <div className="text-muted mb-1 px-1" style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Navigate
                </div>
                {TABS.map(tab => (
                  <button key={tab.key}
                    className={`tf-nav-link d-flex align-items-center w-100 py-2 px-2 rounded-2 mb-1${activeTab === tab.key ? ' active' : ''}`}
                    onClick={() => { onTabChange(tab.key); setOpen(false) }}
                  >
                    <i className={`bi ${tab.icon} me-2`}></i>{tab.label}
                  </button>
                ))}
              </div>
            )}

            <button className="btn btn-outline-primary btn-sm fw-bold w-100 mb-2 position-relative"
              onClick={() => closeAndGo('/mybookings')}>
              <i className="bi bi-calendar2-check me-2"></i>My Bookings
              {bookings.length > 0 && <span className="badge bg-primary ms-2">{bookings.length}</span>}
            </button>

            {user && (
              <button className="btn btn-outline-danger btn-sm fw-bold w-100" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}