import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar({ TABS, activeTab, onTabChange, user, logout, notify, onProfile }) {
  const navigate      = useNavigate()
  const location      = useLocation()
  const [open, setOpen] = useState(false)

  // Close menu on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleLogout = () => {
    logout()
    notify('Signed out')
    setOpen(false)
    navigate('/login')
  }

  const closeAndGo = (path) => { setOpen(false); navigate(path) }

  const colors = ['#0d6efd','#198754','#dc3545','#0dcaf0','#6f42c1','#fd7e14']
  const avatarColor = colors[(user?.name?.charCodeAt(0) ?? 0) % colors.length]
  const initials = (user?.name ?? 'U').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
  const firstName = user?.name?.split(' ')[0] || ''

  const AvatarBtn = ({ size = 32, onClick }) => {
    const [imgErr, setImgErr] = React.useState(false)
    if (user?.photo && !imgErr) return (
      <button onClick={onClick} title="View Profile"
        style={{ width: size, height: size, borderRadius: '50%',
          border: '2px solid #fff', padding: 0, cursor: 'pointer',
          boxShadow: `0 2px 8px ${avatarColor}44`, flexShrink: 0,
          overflow: 'hidden', background: 'none' }}>
        <img src={user.photo} alt={user.name}
          onError={() => setImgErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </button>
    )
    return (
      <button onClick={onClick} title="View Profile"
        style={{ width: size, height: size, borderRadius: '50%',
          background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
          border: '2px solid #fff', boxShadow: `0 2px 8px ${avatarColor}44`,
          color: '#fff', fontWeight: 900, fontSize: size * 0.36,
          fontFamily: "'Barlow Condensed',sans-serif",
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
        {initials}
      </button>
    )
  }

  return (
    <>
      <nav className="tf-navbar">
        <div className="container-fluid px-4">
          <div className="d-flex align-items-center justify-content-between py-2">

            {/* Brand */}
            <button
              className="d-flex align-items-center gap-2 border-0 bg-transparent p-0"
              onClick={() => navigate('/')}
            >
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
                  <button
                    key={tab.key}
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

              {/* Desktop: avatar + name */}
              {user && (
                <div className="d-none d-md-flex align-items-center gap-2">
                  <AvatarBtn onClick={onProfile} />
                  <span
                    className="text-muted small"
                    style={{ cursor: 'pointer' }}
                    onClick={onProfile}
                  >
                    {firstName}
                  </span>
                </div>
              )}

              <button
                className="btn btn-outline-primary btn-sm fw-bold d-none d-md-inline-flex"
                onClick={() => navigate('/mybookings')}
              >
                <i className="bi bi-calendar2-check me-1"></i>Bookings
              </button>

              {user && (
                <button
                  className="btn btn-outline-danger btn-sm fw-bold d-none d-md-inline-flex"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right"></i>
                </button>
              )}

              {/* Mobile hamburger */}
              <button
                className="btn btn-light btn-sm d-md-none"
                onClick={() => setOpen(o => !o)}
                aria-label="Toggle menu"
                style={{ zIndex: 1050, position: 'relative' }}
              >
                <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'} fs-5`}></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu — fixed overlay, outside navbar DOM ── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,.35)',
              zIndex: 1040,
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Slide-down panel */}
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0,
              zIndex: 1045,
              background: '#fff',
              borderRadius: '0 0 20px 20px',
              boxShadow: '0 8px 32px rgba(0,0,0,.18)',
              padding: '16px 20px 24px',
              animation: 'slideDown .22s ease',
            }}
          >
            {/* Top row: brand + close */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="tf-brand-icon">⚽</div>
                <div className="tf-brand-title">TURFARENA</div>
              </div>
              <button
                className="btn btn-light btn-sm"
                onClick={() => setOpen(false)}
              >
                <i className="bi bi-x-lg fs-5"></i>
              </button>
            </div>

            {/* User card */}
            {user && (
              <div
                onClick={() => closeAndGo('/profile')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--tf-blue-light, #e7f0ff)',
                  borderRadius: 12, padding: '12px 14px',
                  marginBottom: 16, cursor: 'pointer',
                }}
              >
                <AvatarBtn size={44} onClick={() => {}} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: '#6c757d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <span className="tf-live-dot"></span>
                  <i className="bi bi-chevron-right text-muted" style={{ fontSize: 12 }}></i>
                </div>
              </div>
            )}

            {/* Nav tabs — only on home */}
            {location.pathname === '/' && TABS && (
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: '#adb5bd',
                  textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8,
                }}>
                  Navigate
                </div>
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { onTabChange(tab.key); setOpen(false) }}
                    style={{
                      width: '100%', border: 'none', borderRadius: 10,
                      background: activeTab === tab.key ? 'var(--tf-blue-light,#e7f0ff)' : 'transparent',
                      color: activeTab === tab.key ? '#0d6efd' : '#495057',
                      fontWeight: 700, fontSize: 14,
                      padding: '10px 12px', marginBottom: 4,
                      display: 'flex', alignItems: 'center', gap: 10,
                      cursor: 'pointer', transition: 'background .15s',
                      fontFamily: "'Barlow',sans-serif",
                    }}
                  >
                    <i className={`bi ${tab.icon}`} style={{ fontSize: 16, width: 20 }}></i>
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn-outline-primary fw-bold w-100"
                onClick={() => closeAndGo('/mybookings')}
              >
                <i className="bi bi-calendar2-check me-2"></i>My Bookings
              </button>

              {user && (
                <button
                  className="btn btn-outline-danger fw-bold w-100"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>Sign Out
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Slide-down animation */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}