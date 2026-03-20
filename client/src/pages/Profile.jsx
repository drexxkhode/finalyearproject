import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

// ── Avatar: shows photo if available, else initials ───────────────────────
function AvatarCircle({ name, photo, size = 80 }) {
  const [imgErr, setImgErr] = useState(false)

  if (photo && !imgErr) return (
    <img
      src={photo}
      alt={name}
      onError={() => setImgErr(true)}
      style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', border: '3px solid #fff',
        boxShadow: '0 6px 24px rgba(0,0,0,0.15)', flexShrink: 0,
      }}
    />
  )

  const initials = (name ?? 'U')
    .split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
  const colors = ['#0d6efd', '#198754', '#dc3545', '#0dcaf0', '#6f42c1', '#fd7e14']
  const color  = colors[(name?.charCodeAt(0) ?? 0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 900, fontSize: size * 0.36,
      fontFamily: "'Barlow Condensed',sans-serif",
      boxShadow: `0 6px 24px ${color}55`,
      flexShrink: 0, userSelect: 'none', border: '3px solid #fff',
    }}>
      {initials || '?'}
    </div>
  )
}

// ── Profile ───────────────────────────────────────────────────────────────
export default function Profile({ user, onBack, notify, onUserUpdate }) {
  const { id } = useParams()

  const [tab,             setTab]             = useState('info')
  const [saving,          setSaving]          = useState(false)
  const [uploadingPic,    setUploadingPic]    = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [err,             setErr]             = useState('')
  const [success,         setSuccess]         = useState('')
  const photoInputRef = useRef(null)

  const [form, setForm] = useState({
    name:    user?.name    ?? '',
    email:   user?.email   ?? '',
    contact: user?.contact ?? user?.phone ?? '',
  })
  // Resend OTP from profile — with cooldown display
  const [resendCooldown, setResendCooldown] = useState(0)  // seconds remaining
  const [resending,      setResending]      = useState(false)
  const [pwd,          setPwd]     = useState({ current: '', next: '', confirm: '' })
  const [showPwd,      setShowPwd] = useState({ current: false, next: false, confirm: false })
  const [currentPhoto, setCurrentPhoto] = useState(user?.photo ?? null)

  const handle     = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const handlePwd  = f => e => setPwd(p  => ({ ...p, [f]: e.target.value }))
  const toggleShow = f => () => setShowPwd(p => ({ ...p, [f]: !p[f] }))
  const clearMsgs  = () => { setErr(''); setSuccess('') }

  // Auto-dismiss messages after 4 seconds
  useEffect(() => {
    if (!err && !success) return
    const t = setTimeout(() => { setErr(''); setSuccess('') }, 4000)
    return () => clearTimeout(t)
  }, [err, success])

  // ── Resend OTP from profile page ────────────────────────────────────────
  const resendOtp = async () => {
    if (resendCooldown > 0 || resending) return
    setResending(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API}/users/resend-verification`, {},
        { headers: { Authorization: `Bearer ${token}` } })
      setSuccess('Verification code sent! Check your inbox.')
      setResendCooldown(120)  // 2 min cooldown matches server
    } catch (e) {
      const retryAfter = e.response?.data?.retryAfter
      if (retryAfter) {
        setResendCooldown(retryAfter)
        setErr(`Please wait ${retryAfter}s before requesting another code.`)
      } else {
        setErr(e.response?.data?.message ?? 'Could not send code. Try again.')
      }
    } finally {
      setResending(false)
    }
  }

  // Countdown ticker for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  // ── Save profile info ───────────────────────────────────────────────────
  const saveInfo = async () => {
    clearMsgs()
    if (!form.name.trim()) { setErr('Name cannot be empty'); return }
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res   = await axios.put(
        `${API}/users/update-user/${user?.id}`,
        { name: form.name, email: form.email, contact: form.contact },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const updated = res.data?.user ?? { ...user, ...form }
      localStorage.setItem('user', JSON.stringify(updated))
      onUserUpdate(updated)
      setSuccess('Profile updated successfully!')
      notify?.('Profile updated ✓', 's')
    } catch (e) {
      setErr(e.response?.data?.message ?? 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // ── Change password ─────────────────────────────────────────────────────
  const changePassword = async () => {
    clearMsgs()
    if (!pwd.current)             { setErr('Enter your current password'); return }
    if (pwd.next.length < 6)      { setErr('New password must be at least 6 characters'); return }
    if (pwd.next !== pwd.confirm) { setErr('New passwords do not match'); return }
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `${API}/users/change-password/${id}`,
        { currentPassword: pwd.current, newPassword: pwd.next },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setPwd({ current: '', next: '', confirm: '' })
      setSuccess('Password changed successfully!')
      notify?.('Password updated ✓', 's')
    } catch (e) {
      setErr(e.response?.data?.message ?? 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  // ── Upload profile photo ────────────────────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    clearMsgs()
    setUploadingPic(true)
    try {
      const token    = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('photo', file)
      const res = await axios.put(
        `${API}/users/profile/photo`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      )
      const updated = res.data.user
      setCurrentPhoto(updated.photo)
      localStorage.setItem('user', JSON.stringify(updated))
      onUserUpdate(updated)
      setSuccess('Profile photo updated!')
      notify?.('Photo updated ✓', 's')
    } catch (e) {
      setErr(e.response?.data?.message ?? 'Failed to upload photo')
    } finally {
      setUploadingPic(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  // ── Confirm delete (called from modal confirm button) ───────────────────
  const confirmPhotoDelete = async () => {
    setShowDeleteModal(false)
    clearMsgs()
    setUploadingPic(true)
    try {
      const token = localStorage.getItem('token')
      const res   = await axios.delete(
        `${API}/users/profile/photo`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const updated = res.data.user
      setCurrentPhoto(null)
      localStorage.setItem('user', JSON.stringify(updated))
      onUserUpdate(updated)
      setSuccess('Profile photo removed.')
      notify?.('Photo removed', 's')
    } catch (e) {
      setErr(e.response?.data?.message ?? 'Failed to remove photo')
    } finally {
      setUploadingPic(false)
    }
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : 'Member'

  return (
    <>
      {/* ── Main page ── */}
      <div className="tf-animate-in">
        <button className="tf-back-btn" onClick={onBack}>
          <i className="bi bi-arrow-left"></i> Back
        </button>

        <div className="row g-4 justify-content-center" style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* LEFT: Avatar card */}
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100"
              style={{ background: 'linear-gradient(135deg,#e7f0ff,#f0f7ff)' }}>

              <div className="d-flex justify-content-center mb-3 position-relative"
                style={{ width: 'fit-content', margin: '0 auto' }}>
                <AvatarCircle name={form.name || user?.name} photo={currentPhoto} size={96} />
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPic}
                  title="Change photo"
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 30, height: 30, borderRadius: '50%',
                    background: '#0d6efd', border: '2px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: 0,
                  }}
                >
                  {uploadingPic
                    ? <span className="spinner-border spinner-border-sm text-white" style={{ width: 14, height: 14 }} />
                    : <i className="bi bi-camera-fill text-white" style={{ fontSize: 12 }}></i>
                  }
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                />
              </div>

              {currentPhoto && (
                <button
                  className="btn btn-link btn-sm text-danger p-0 mb-2"
                  style={{ fontSize: 12 }}
                  onClick={() => setShowDeleteModal(true)}
                  disabled={uploadingPic}
                >
                  <i className="bi bi-trash me-1"></i>Remove photo
                </button>
              )}

              <h5 className="fw-bolder mb-0"
                style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: '1.4rem' }}>
                {form.name || user?.name}
              </h5>
              <div className="text-muted small mt-1">{form.email || user?.email}</div>

              <hr className="my-3" />

              <div className="d-flex flex-column gap-2 text-start">
                {[
                  { icon: 'bi-phone',     label: 'Phone',        val: form.contact || '—' },
                  { icon: 'bi-calendar3', label: 'Member since', val: memberSince },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="d-flex align-items-center gap-2">
                    <i className={`bi ${icon} text-primary`} style={{ width: 18 }}></i>
                    <div>
                      <div style={{ fontSize: 10, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                      <div className="fw-bold small">{val}</div>
                    </div>
                  </div>
                ))}

                {/* Email verification status — real from DB */}
                <div className="d-flex align-items-center gap-2">
                  <i className={`bi ${user?.email_verified ? 'bi-shield-check' : 'bi-shield-exclamation'}`}
                     style={{ width: 18, color: user?.email_verified ? '#198754' : '#fd7e14' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#6c757d', textTransform: 'uppercase', letterSpacing: 1 }}>Email</div>
                    {user?.email_verified ? (
                      <div className="fw-bold small" style={{ color: '#198754' }}>
                        <i className="bi bi-check-circle-fill me-1"></i>Verified
                      </div>
                    ) : (
                      <>
                        <div className="fw-bold small" style={{ color: '#fd7e14' }}>
                          Not verified
                        </div>
                        <button
                          className="btn btn-link p-0 mt-1"
                          style={{ fontSize: 11, color: '#0d6efd', textDecoration: 'underline', fontWeight: 700 }}
                          onClick={resendOtp}
                          disabled={resendCooldown > 0 || resending}
                        >
                          {resending
                            ? 'Sending…'
                            : resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : 'Send verification code'
                          }
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <span className="tf-badge tf-badge-green">
                  <i className="bi bi-check-circle-fill me-1"></i>Active
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Edit tabs */}
          <div className="col-12 col-md-8">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

              <div className="d-flex border-bottom">
                {[
                  { key: 'info',     icon: 'bi-person',      label: 'Profile Info' },
                  { key: 'security', icon: 'bi-shield-lock', label: 'Security' },
                ].map(t => (
                  <button key={t.key}
                    onClick={() => { setTab(t.key); clearMsgs() }}
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
                {err     && <div className="alert alert-danger  py-2 small rounded-3 mb-3">{err}</div>}
                {success && <div className="alert alert-success py-2 small rounded-3 mb-3">{success}</div>}

                {/* Info Tab */}
                {tab === 'info' && (
                  <div className="d-flex flex-column gap-3">
                    <div className="text-muted small fw-bold text-uppercase mb-1" style={{ letterSpacing: 1 }}>
                      Personal Details
                    </div>
                    {[
                      { key: 'name',    label: 'Full Name',     icon: 'bi-person',   type: 'text',  placeholder: 'Your full name' },
                      { key: 'email',   label: 'Email Address', icon: 'bi-envelope', type: 'email', placeholder: 'your@email.com' },
                      { key: 'contact', label: 'Phone Number',  icon: 'bi-phone',    type: 'text',  placeholder: '+233 XX XXX XXXX' },
                    ].map(({ key, label, icon, type, placeholder }) => (
                      <div key={key}>
                        <label className="form-label small fw-bold">{label}</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className={`bi ${icon} text-primary`}></i>
                          </span>
                          <input
                            className="form-control border-start-0"
                            type={type} value={form[key]}
                            onChange={handle(key)} placeholder={placeholder}
                          />
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-primary fw-bold py-2 mt-1"
                      onClick={saveInfo} disabled={saving}>
                      {saving
                        ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                        : <><i className="bi bi-check-lg me-2"></i>Save Changes</>
                      }
                    </button>
                  </div>
                )}

                {/* Security Tab */}
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
                            value={pwd[key]} onChange={handlePwd(key)} placeholder={placeholder}
                          />
                          <button className="input-group-text bg-light"
                            style={{ border: '1px solid #dee2e6', cursor: 'pointer' }}
                            onClick={toggleShow(key)} type="button">
                            <i className={`bi ${showPwd[key] ? 'bi-eye-slash' : 'bi-eye'} text-muted`}></i>
                          </button>
                        </div>
                      </div>
                    ))}

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
                          <div className="progress-bar" style={{
                            width: `${Math.min(100, (pwd.next.length / 12) * 100)}%`,
                            background: pwd.next.length < 6 ? '#dc3545' : pwd.next.length < 10 ? '#fd7e14' : '#198754',
                            transition: 'width .3s',
                          }} />
                        </div>
                      </div>
                    )}

                    <button className="btn btn-primary fw-bold py-2 mt-1"
                      onClick={changePassword} disabled={saving}>
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

      {/* ── Remove Photo Confirmation Modal ── */}
      {showDeleteModal && (
        <div
          onClick={() => setShowDeleteModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="card border-0 shadow-lg rounded-4 p-4 text-center"
            style={{ maxWidth: 360, width: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 48, lineHeight: 1 }} className="mb-3">🗑️</div>
            <h5 className="fw-bolder mb-2">Remove Profile Photo?</h5>
            <p className="text-muted small mb-4">
              Your photo will be permanently deleted. Your initials will show instead.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                className="btn btn-outline-secondary fw-bold px-4"
                onClick={() => setShowDeleteModal(false)}
                disabled={uploadingPic}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger fw-bold px-4"
                onClick={confirmPhotoDelete}
                disabled={uploadingPic}
              >
                {uploadingPic
                  ? <><span className="spinner-border spinner-border-sm me-2" />Removing…</>
                  : <><i className="bi bi-trash me-2"></i>Yes, Remove</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}