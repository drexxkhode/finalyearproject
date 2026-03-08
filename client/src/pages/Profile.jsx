/**
 * Profile.jsx — User profile viewer + editor
 * Responsive: full-page on desktop, card-stack on mobile
 */
import { useState, useRef } from 'react'
import axios from 'axios';
import { useParams } from 'react-router-dom';


const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

function AvatarCircle({ name, size = 80 }) {
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
      flexShrink: 0, userSelect: 'none',
      border: '3px solid #fff',
    }}>
      {initials || '?'}
    </div>
  )
}

export default function Profile({ user, onBack, notify, onUserUpdate }) {
  const [tab,     setTab]     = useState('info')   // 'info' | 'security'
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')
  const [success, setSuccess] = useState('')
  const {id } = useParams();

  const [form, setForm] = useState({
    name:    user?.name    ?? '',
    email:   user?.email   ?? '',
    contact: user?.contact ?? user?.phone ?? '',
  })

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false })

  const handle      = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const handlePwd   = f => e => setPwd(p  => ({ ...p, [f]: e.target.value }))
  const toggleShow  = f => ()  => setShowPwd(p => ({ ...p, [f]: !p[f] }))

  const clearMessages = () => { setErr(''); setSuccess('') }

  // ── Save profile info ───────────────────────────────────────────────
  const saveInfo = async () => {
    clearMessages()
    if (!form.name.trim()) { setErr('Name cannot be empty'); return }
    setSaving(true)
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API}/users/update-user/${id}`,
        { name: form.name, email: form.email, contact: form.contact },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const updated = res.data?.user ?? { ...user, ...form }
      localStorage.setItem('user', JSON.stringify(updated))
      onUserUpdate(updated)
      setSuccess('Profile updated successfully!')
    } catch (e) {
      setErr(e.response?.data?.message ?? 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // ── Change password ─────────────────────────────────────────────────
  const changePassword = async () => {
    clearMessages()
    if (!pwd.current)          { setErr('Enter your current password'); return }
    if (pwd.next.length < 6)   { setErr('New password must be at least 6 characters'); return }
    if (pwd.next !== pwd.confirm) { setErr('New passwords do not match'); return }
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
 const res =     await axios.put(
        `${API}/users/change-password/${id}`,
        { currentPassword: pwd.current, newPassword: pwd.next },
        { headers: { Authorization: `Bearer ${token}` } }
      ) 
      console.log(res?.data);
      setPwd({ current: '', next: '', confirm: '' });
      setSuccess('Password changed successfully!');
    } catch (e) {
      setErr(e.response?.data?.message ?? 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : 'Member'

  return (
    <div className="tf-animate-in">
      <button className="tf-back-btn" onClick={onBack}>
        <i className="bi bi-arrow-left"></i> Back
      </button>

      <div className="row g-4 justify-content-center" style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* ── LEFT: Avatar card ── */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100" style={{ background: 'linear-gradient(135deg,#e7f0ff,#f0f7ff)' }}>
            <div className="d-flex justify-content-center mb-3">
              <AvatarCircle name={form.name || user?.name} size={96} />
            </div>
            <h5 className="fw-bolder mb-0" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: '1.4rem' }}>
              {form.name || user?.name}
            </h5>
            <div className="text-muted small mt-1">{form.email || user?.email}</div>

            <hr className="my-3" />

            <div className="d-flex flex-column gap-2 text-start">
              {[
                { icon: 'bi-phone', label: 'Phone', val: form.contact || '—' },
                { icon: 'bi-calendar3', label: 'Member since', val: memberSince },
                { icon: 'bi-shield-check', label: 'Account', val: 'Verified' },
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
              {/* Messages */}
              {err     && <div className="alert alert-danger   py-2 small rounded-3 mb-3">{err}</div>}
              {success && <div className="alert alert-success  py-2 small rounded-3 mb-3">{success}</div>}

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
                    { key: 'current', label: 'Current Password',  placeholder: 'Enter current password' },
                    { key: 'next',    label: 'New Password',       placeholder: 'At least 6 characters' },
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
                            width:      `${Math.min(100, (pwd.next.length / 12) * 100)}%`,
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