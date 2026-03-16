import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export default function EnquiriesSection({ turfId, user }) {
  const [enquiries, setEnquiries] = useState([])
  const [msg,       setMsg]       = useState('')
  const [subject,   setSubject]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [sent,      setSent]      = useState(false)
  const [error,     setError]     = useState(null)
  const socketRef = useRef(null)

  // ── Fetch existing enquiries on mount ──────────────────────────────────
  useEffect(() => {
    if (!turfId) return
    axios.get(`${API}/enquiries?turf_id=${turfId}`)
      .then(res => setEnquiries(res.data.enquiries ?? []))
      .catch(() => {})
  }, [turfId])

  // ── Socket — join user room + listen for admin replies ────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || !user?.id) return

    const socket = io(API, {
      auth:       { token },
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      // Join personal room so admin replies reach this specific user
      socket.emit('user:join', user.id)
    })

    // Admin replied — update the matching enquiry live
    socket.on('enquiry:reply', ({ enquiry_id, reply, replied_at }) => {
      setEnquiries(prev => prev.map(e =>
        e.id === enquiry_id
          ? { ...e, reply, replied_at, status: 'resolved' }
          : e
      ))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?.id])

  // ── Submit enquiry ─────────────────────────────────────────────────────
  const submit = async () => {
    if (!msg.trim() || !user) return
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const res   = await axios.post(
        `${API}/enquiries`,
        {
          turf_id: turfId,
          subject: subject.trim() || 'General Enquiry',
          message: msg.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setEnquiries(prev => [res.data.enquiry, ...prev])
      setMsg('')
      setSubject('')
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to send enquiry')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
      <div className="d-flex align-items-center gap-2 mb-3">
        <span className="fw-bold fs-6">💬 Enquiries</span>
        <span className="tf-badge tf-badge-blue">{enquiries.length}</span>
      </div>

      {enquiries.length === 0 && (
        <p className="text-muted text-center small py-2">
          No enquiries yet. Be the first to ask!
        </p>
      )}

      {enquiries.map(e => (
        <div key={e.id} className="tf-enquiry-bubble">
          <div className="d-flex align-items-center gap-2 mb-2">
            <div className="tf-enquiry-avatar">{e.name?.charAt(0).toUpperCase()}</div>
            <div>
              <div className="fw-bold" style={{ fontSize: 13 }}>{e.name}</div>
              <div className="text-muted" style={{ fontSize: 11 }}>{formatTime(e.created_at)}</div>
            </div>
            {e.subject && e.subject !== 'General Enquiry' && (
              <span className="tf-badge tf-badge-gray ms-auto" style={{ fontSize: 10 }}>
                {e.subject}
              </span>
            )}
          </div>
          <p className="mb-0 small">{e.message}</p>
          {e.reply && (
            <div className="tf-enquiry-reply">
              <div className="tf-enquiry-manager-label">🏟️ Turf Manager</div>
              {e.reply}
              <div className="text-muted mt-1" style={{ fontSize: 10 }}>
                {formatTime(e.replied_at)}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* ── Input ── */}
      <div className="mt-2">
        {sent && (
          <div className="alert alert-success py-2 small mb-2">
            ✅ Enquiry sent! We'll reply shortly.
          </div>
        )}
        {error && (
          <div className="alert alert-danger py-2 small mb-2">{error}</div>
        )}
        {user && (
          <input
            className="form-control mb-2"
            placeholder="Subject (optional)"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            disabled={loading}
          />
        )}
        <textarea
          className="form-control mb-2"
          rows={3}
          placeholder={user ? 'Ask a question about this turf…' : 'Sign in to send an enquiry'}
          value={msg}
          onChange={e => setMsg(e.target.value)}
          disabled={!user || loading}
        />
        <button
          className="btn btn-primary w-100 fw-bold"
          onClick={submit}
          disabled={!user || !msg.trim() || loading}
        >
          {loading
            ? <><span className="spinner-border spinner-border-sm me-2" />Sending...</>
            : 'Send Enquiry →'
          }
        </button>
        {!user && (
          <p className="text-center text-muted small mt-2 mb-0">
            Sign in to post an enquiry
          </p>
        )}
      </div>
    </div>
  )
};