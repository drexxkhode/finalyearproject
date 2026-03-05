import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthScreen({ onSuccess }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [err,  setErr]  = useState('')
  const [ok,   setOk]   = useState(false)

  const handle = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  const switchMode = m => { setMode(m); setErr('') }

  const submit = () => {
    setErr('')
    if (mode === 'register') {
      if (!form.name || !form.email || !form.phone || !form.password)
        return setErr('All fields are required.')
      if (form.password !== form.confirm) return setErr('Passwords do not match.')
      if (form.password.length < 6) return setErr('Password must be at least 6 characters.')
      try {
        register(form)
        setOk(true)
        setTimeout(() => {
          setOk(false)
          setMode('login')
          setForm(p => ({ ...p, name: '', phone: '', password: '', confirm: '' }))
        }, 1500)
      } catch (e) { setErr(e.message) }
    } else {
      if (!form.email || !form.password) return setErr('Email and password required.')
      try { onSuccess(login(form)) } catch (e) { setErr(e.message) }
    }
  }

  const onKey = e => { if (e.key === 'Enter') submit() }

  return (
    <div className="tf-auth-overlay">
      <div className="w-100" style={{ maxWidth: 420 }}>

        {/* Logo */}
        <div className="text-center mb-4">
          <div className="tf-auth-logo">⚽</div>
          <div className="tf-brand-title font-condensed fs-2">TURFFIELD</div>
          <div className="tf-brand-sub">Accra Metropolitan Assembly</div>
        </div>

        <div className="card border-0 shadow-lg rounded-4 p-4">
          {/* Toggle */}
          <div className="tf-auth-toggle">
            <button
              className={`tf-auth-toggle-btn${mode === 'login' ? ' active' : ''}`}
              onClick={() => switchMode('login')}
            >
              <i className="bi bi-key-fill me-1"></i>Sign In
            </button>
            <button
              className={`tf-auth-toggle-btn${mode === 'register' ? ' active' : ''}`}
              onClick={() => switchMode('register')}
            >
              <i className="bi bi-person-plus-fill me-1"></i>Register
            </button>
          </div>

          {ok  && <div className="alert alert-success py-2 text-center fw-bold">✅ Account created! Redirecting…</div>}
          {err && <div className="alert alert-danger  py-2 small">{err}</div>}

          <div className="d-flex flex-column gap-2">
            {mode === 'register' && (
              <input
                className="form-control"
                placeholder="Full Name"
                value={form.name}
                onChange={handle('name')}
                onKeyDown={onKey}
              />
            )}
            <input
              className="form-control"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handle('email')}
              onKeyDown={onKey}
            />
            {mode === 'register' && (
              <input
                className="form-control"
                placeholder="Phone Number (0244…)"
                value={form.phone}
                onChange={handle('phone')}
                onKeyDown={onKey}
              />
            )}
            <input
              className="form-control"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handle('password')}
              onKeyDown={onKey}
            />
            {mode === 'register' && (
              <input
                className="form-control"
                type="password"
                placeholder="Confirm Password"
                value={form.confirm}
                onChange={handle('confirm')}
                onKeyDown={onKey}
              />
            )}
          </div>

          <button className="btn btn-primary w-100 fw-bold mt-3 py-2" onClick={submit}>
            {mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>

          {mode === 'login' && (
            <p className="text-center text-muted small mt-3 mb-0">
              No account?{' '}
              <span
                className="text-primary fw-bold"
                role="button"
                onClick={() => switchMode('register')}
              >
                Register here
              </span>
            </p>
          )}
        </div>

        <p className="text-center text-muted small mt-3">
          <i className="bi bi-lock-fill me-1"></i>Your data is secure · AMA Certified Platform
        </p>
      </div>
    </div>
  )
}
