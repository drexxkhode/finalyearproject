/**
 * Profile.jsx — User profile viewer + editor
 * Responsive: full-page on desktop, card-stack on mobile
 * Includes: avatar image upload with preview (mobile + desktop)
 *
 * Backend contract (updateUser controller):
 *  PUT /users/update-user/:id   — multipart/form-data
 *  Fields: name, email, contact, photo (file, optional)
 *  Returns: { message: "..." }   (no user object in response)
 *  Images served at: /images/:filename
 */
import { useState, useRef } from 'react'
import axios from 'axios';
import { useParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

/**
 * Build a displayable URL from a photo value.
 * Priority: base64 cached in localStorage > full URL > server filename path
 */
const toAvatarSrc = (photo) => {
  if (!photo) return null
  if (photo.startsWith('data:') || photo.startsWith('blob:') || photo.startsWith('http')) return photo
  return `${API}/images/${photo}`
}

/** Read the cached base64 avatar for a user id (survives refresh) */
const getCachedAvatar = (userId) => {
  try { return localStorage.getItem(`avatar_preview_${userId}`) ?? null } catch { return null }
}
/** Persist the base64 avatar so it survives refresh */
const setCachedAvatar = (userId, base64) => {
  try { localStorage.setItem(`avatar_preview_${userId}`, base64) } catch {} 
}

function AvatarCircle({ name, size = 80, image, onClick, uploading }) {
  const [imgBroken, setImgBroken] = useState(false)
  const initials = (name ?? 'U')
    .split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
  const colors = ['#0d6efd', '#198754', '#dc3545', '#0dcaf0', '#6f42c1', '#fd7e14']
  const color  = colors[(name?.charCodeAt(0) ?? 0) % colors.length]
  const showImage = image && !imgBroken

  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: showImage ? 'transparent' : `linear-gradient(135deg, ${color}, ${color}cc)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 900, fontSize: size * 0.36,
        fontFamily: "'Barlow Condensed',sans-serif",
        boxShadow: `0 6px 24px ${color}55`,
        flexShrink: 0, userSelect: 'none',
        border: '3px solid #fff',
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      {showImage
        ? <img
            src={image}
            alt="avatar"
            onError={() => setImgBroken(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        : (initials || '?')
      }

      {/* Hover / uploading overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        opacity: uploading ? 1 : 0,
        transition: 'opacity .2s',
        fontSize: 11, color: '#fff', gap: 3,
      }} className="avatar-overlay">
        {uploading
          ? <span className="spinner-border spinner-border-sm text-light" />
          : <>
              <i className="bi bi-camera-fill" style={{ fontSize: 18 }}></i>
              <span style={{ fontWeight: 700, letterSpacing: 0.5, fontSize: 10 }}>CHANGE</span>
            </>
        }
      </div>

      <style>{`div:hover > .avatar-overlay { opacity: 1 !important; }`}</style>
    </div>
  )
}

export default function Profile({ user, onBack, notify, onUserUpdate }) {
  const [tab,     setTab]     = useState('info')
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')
  const [success, setSuccess] = useState('')
  const { id } = useParams()

  // ── Avatar state ─────────────────────────────────────────────────────
  // On mount: prefer the locally-cached base64 (survives refresh & broken server URLs)
  // then fall back to building the server URL from the stored filename
  const [avatarPreview,   setAvatarPreview]   = useState(
    getCachedAvatar(user?.id) ?? toAvatarSrc(user?.photo ?? null)
  )
  const [avatarFile,      setAvatarFile]      = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showImageModal,  setShowImageModal]  = useState(false)
  const fileInputRef = useRef(null)

  // ── Form state ───────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name:    user?.name    ?? '',
    email:   user?.email   ?? '',
    contact: user?.contact ?? user?.phone ?? '',
  })

  const [pwd,     setPwd]     = useState({ current: '', next: '', confirm: '' })
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false })

  const handle     = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const handlePwd  = f => e => setPwd(p  => ({ ...p, [f]: e.target.value }))
  const toggleShow = f => () => setShowPwd(p => ({ ...p, [f]: !p[f] }))

  const clearMessages = () => { setErr(''); setSuccess('') }

  // Show a message then auto-clear it after 4 s
  const showErr     = (msg) => { setErr(msg);     setSuccess(''); setTimeout(() => setErr(''),     4000) }
  const showSuccess = (msg) => { setSuccess(msg); setErr('');     setTimeout(() => setSuccess(''), 4000) }

  // ── Image file selected ──────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showErr('Please select a valid image file (JPG, PNG, GIF, WebP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showErr('Image must be smaller than 5MB')
      return
    }
    clearMessages()
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result)   // base64 for instant preview
      setShowImageModal(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''   // allow re-selecting same file
  }

  const cancelImageSelection = () => {
    setAvatarPreview(getCachedAvatar(user?.id) ?? toAvatarSrc(user?.photo ?? null))
    setAvatarFile(null)
    setShowImageModal(false)
  }

  // ── Upload photo only (photo field only, no text fields) ─────────────
  const confirmAndUploadImage = async () => {
    if (!avatarFile) return
    setShowImageModal(false)
    setUploadingAvatar(true)
    clearMessages()
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('photo', avatarFile)   // matches upload.single("photo")

      await axios.put(
        `${API}/users/update-user/${id}`,    // same single endpoint
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
        // Do NOT set Content-Type — axios sets multipart boundary automatically
      )
      // Controller returns { message } only — update local state manually.
      // Persist the base64 preview in localStorage so it survives page refresh.
      // (The server-generated filename is unknown; base64 is the reliable fallback.)
      setCachedAvatar(user?.id, avatarPreview)   // avatarPreview is already the base64 from FileReader
      const updatedUser = { ...user }            // photo filename stays whatever it was in DB
      localStorage.setItem('user', JSON.stringify(updatedUser))
      onUserUpdate(updatedUser)
      showSuccess('Profile photo updated!')
    } catch (e) {
      setAvatarPreview(getCachedAvatar(user?.id) ?? toAvatarSrc(user?.photo ?? null))
      setAvatarFile(null)
      showErr(e.response?.data?.message ?? 'Failed to upload image')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // ── Save profile info (text fields only, no file) ────────────────────
  const saveInfo = async () => {
    clearMessages()
    if (!form.name.trim()) { showErr('Name cannot be empty'); return }
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      // Send as FormData so the same multipart endpoint accepts it correctly
      const formData = new FormData()
      formData.append('name',    form.name)
      formData.append('email',   form.email)
      formData.append('contact', form.contact)

      await axios.put(
        `${API}/users/update-user/${id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Controller returns { message } only — build updated user locally
      const updatedUser = { ...user, name: form.name, email: form.email, contact: form.contact }
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);
      showSuccess('Profile updated successfully!')
    } catch (e) {
      showErr(e.response?.data?.message ?? 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // ── Change password ───────────────────────────────────────────────────
  const changePassword = async () => {
    clearMessages()
    if (!pwd.current)             { showErr('Enter your current password'); return }
    if (pwd.next.length < 6)      { showErr('New password must be at least 6 characters'); return }
    if (pwd.next !== pwd.confirm) { showErr('New passwords do not match'); return }
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `${API}/users/change-password/${id}`,
        { currentPassword: pwd.current, newPassword: pwd.next },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setPwd({ current: '', next: '', confirm: '' })
      showSuccess('Password changed successfully!')
    } catch (e) {
      showErr(e.response?.data?.message ?? 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : 'Member'

  return (
    <div className="tf-animate-in">

      {/* Hidden file input — opens native picker (camera or gallery on mobile) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={handleImageChange}
      />

      {/* ── Image preview / confirm modal ── */}
      {showImageModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1055,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={cancelImageSelection}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20,
              padding: '1.75rem', maxWidth: 360, width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            }}
          >
            <h6 className="fw-bolder mb-0" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: '1.2rem' }}>
              Update Profile Photo
            </h6>

            {/* Circular preview with gradient ring */}
            <div style={{
              width: 150, height: 150, borderRadius: '50%',
              padding: 4,
              background: 'linear-gradient(135deg,#0d6efd,#6f42c1)',
              boxShadow: '0 8px 32px rgba(13,110,253,0.25)',
            }}>
              <img
                src={avatarPreview}
                alt="preview"
                style={{
                  width: '100%', height: '100%',
                  borderRadius: '50%', objectFit: 'cover',
                  border: '3px solid #fff', display: 'block',
                }}
              />
            </div>

            <p className="text-muted small text-center mb-0">
              This will replace your current profile photo. Looks good?
            </p>

            <div className="d-flex gap-2 w-100">
              <button className="btn btn-light fw-bold flex-fill" onClick={cancelImageSelection}>
                Cancel
              </button>
              <button className="btn btn-primary fw-bold flex-fill" onClick={confirmAndUploadImage}>
                <i className="bi bi-check-lg me-1"></i>Use This Photo
              </button>
            </div>

            <button
              className="btn btn-link text-muted small p-0"
              onClick={() => { setShowImageModal(false); fileInputRef.current?.click() }}
            >
              <i className="bi bi-arrow-repeat me-1"></i>Choose a different photo
            </button>
          </div>
        </div>
      )}

      <button className="tf-back-btn" onClick={onBack}>
        <i className="bi bi-arrow-left"></i> Back
      </button>

      <div className="row g-4 justify-content-center" style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* ── LEFT: Avatar card ── */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100" style={{ background: 'linear-gradient(135deg,#e7f0ff,#f0f7ff)' }}>

            {/* Clickable avatar */}
            <div className="d-flex justify-content-center mb-1">
              <AvatarCircle
                name={form.name || user?.name}
                size={96}
                image={avatarPreview}
                uploading={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              />
            </div>

            {/* Upload hint link */}
            <button
              className="btn btn-link btn-sm text-primary p-0 mb-2"
              style={{ fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar
                ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 10, height: 10 }} />Uploading…</>
                : <><i className="bi bi-camera me-1"></i>Change photo</>
              }
            </button>

            <h5 className="fw-bolder mb-0" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: '1.4rem' }}>
              {form.name || user?.name}
            </h5>
            <div className="text-muted small mt-1">{form.email || user?.email}</div>

            <hr className="my-3" />

            <div className="d-flex flex-column gap-2 text-start">
              {[
                { icon: 'bi-phone',        label: 'Phone',        val: form.contact || '—' },
                { icon: 'bi-calendar3',    label: 'Member since', val: memberSince },
                { icon: 'bi-shield-check', label: 'Account',      val: 'Verified' },
              ].map(({ icon, label, val }) => (
                <div key={label} className="d-flex align-items-center gap-2">
                  <i className={`bi ${icon} text-primary`} style={{ width: 18 }}></i>
                  <div>
                    <div style={{ fontSize: 10, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                    <div className="fw-bold small">{val}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <span className="tf-badge tf-badge-green">
                <i className="bi bi-check-circle-fill me-1"></i>Active
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Edit tabs ── */}
        <div className="col-12 col-md-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

            {/* Tab bar */}
            <div className="d-flex border-bottom">
              {[
                { key: 'info',     icon: 'bi-person',      label: 'Profile Info' },
                { key: 'security', icon: 'bi-shield-lock', label: 'Security' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); clearMessages() }}
                  style={{
                    flex: 1, border: 'none', background: 'none', padding: '14px 12px',
                    fontWeight: 700, fontSize: 14, fontFamily: "'Barlow',sans-serif",
                    color: tab === t.key ? '#0d6efd' : '#6c757d',
                    borderBottom: tab === t.key ? '2.5px solid #0d6efd' : '2.5px solid transparent',
                    transition: 'all .2s', cursor: 'pointer',
                  }}
                >
                  <i className={`bi ${t.icon} me-2`}></i>
                  <span className="d-none d-sm-inline">{t.label}</span>
                  <span className="d-sm-none">{t.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* Alert messages */}
              {err     && <div className="alert alert-danger  py-2 small rounded-3 mb-3">{err}</div>}
              {success && <div className="alert alert-success py-2 small rounded-3 mb-3">{success}</div>}

              {/* ── Info Tab ── */}
              {tab === 'info' && (
                <div className="d-flex flex-column gap-3">
                  <div className="text-muted small fw-bold text-uppercase mb-1" style={{ letterSpacing: 1 }}>
                    Personal Details
                  </div>

                  <div>
                    <label className="form-label small fw-bold">Full Name</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-person text-primary"></i>
                      </span>
                      <input
                        className="form-control border-start-0"
                        value={form.name}
                        onChange={handle('name')}
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label small fw-bold">Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-envelope text-primary"></i>
                      </span>
                      <input
                        className="form-control border-start-0"
                        type="email"
                        value={form.email}
                        onChange={handle('email')}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label small fw-bold">Phone Number</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-phone text-primary"></i>
                      </span>
                      <input
                        className="form-control border-start-0"
                        value={form.contact}
                        onChange={handle('contact')}
                        placeholder="+233 XX XXX XXXX"
                      />
                    </div>
                  </div>

                  <button
                    className="btn btn-primary fw-bold py-2 mt-1"
                    onClick={saveInfo}
                    disabled={saving}
                  >
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                      : <><i className="bi bi-check-lg me-2"></i>Save Changes</>
                    }
                  </button>
                </div>
              )}

              {/* ── Security Tab ── */}
              {tab === 'security' && (
                <div className="d-flex flex-column gap-3">
                  <div className="text-muted small fw-bold text-uppercase mb-1" style={{ letterSpacing: 1 }}>
                    Change Password
                  </div>

                  {[
                    { key: 'current', label: 'Current Password',    placeholder: 'Enter current password' },
                    { key: 'next',    label: 'New Password',         placeholder: 'At least 6 characters' },
                    { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="form-label small fw-bold">{label}</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <i className="bi bi-lock text-primary"></i>
                        </span>
                        <input
                          className="form-control border-start-0 border-end-0"
                          type={showPwd[key] ? 'text' : 'password'}
                          value={pwd[key]}
                          onChange={handlePwd(key)}
                          placeholder={placeholder}
                        />
                        <button
                          className="input-group-text bg-light"
                          style={{ border: '1px solid #dee2e6', cursor: 'pointer' }}
                          onClick={toggleShow(key)}
                          type="button"
                        >
                          <i className={`bi ${showPwd[key] ? 'bi-eye-slash' : 'bi-eye'} text-muted`}></i>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Password strength bar */}
                  {pwd.next.length > 0 && (
                    <div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="small text-muted">Password strength</span>
                        <span className="small fw-bold" style={{
                          color: pwd.next.length < 6 ? '#dc3545' : pwd.next.length < 10 ? '#fd7e14' : '#198754'
                        }}>
                          {pwd.next.length < 6 ? 'Weak' : pwd.next.length < 10 ? 'Fair' : 'Strong'}
                        </span>
                      </div>
                      <div className="progress" style={{ height: 4 }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${Math.min(100, (pwd.next.length / 12) * 100)}%`,
                            background: pwd.next.length < 6 ? '#dc3545' : pwd.next.length < 10 ? '#fd7e14' : '#198754',
                            transition: 'width .3s',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    className="btn btn-primary fw-bold py-2 mt-1"
                    onClick={changePassword}
                    disabled={saving}
                  >
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Updating…</>
                      : <><i className="bi bi-shield-lock me-2"></i>Update Password</>
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}