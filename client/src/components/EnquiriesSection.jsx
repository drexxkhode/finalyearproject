import { useState } from 'react'
import { SEED_ENQUIRIES } from '../data/turfs'

export default function EnquiriesSection({ turfId, user }) {
  const [enquiries, setEnquiries] = useState(SEED_ENQUIRIES[turfId] || [])
  const [msg,  setMsg]  = useState('')
  const [sent, setSent] = useState(false)

  const submit = () => {
    if (!msg.trim()) return
    const id = `e${Date.now()}`
    setEnquiries(p => [...p, { id, user: user?.name || 'Guest', msg: msg.trim(), time: 'Just now', reply: null }])
    setMsg('')
    setSent(true)
    setTimeout(() => setSent(false), 3000)
    setTimeout(() => {
      setEnquiries(p => p.map(e => e.id === id
        ? { ...e, reply: 'Thanks for your enquiry! Our team will get back to you shortly.' }
        : e
      ))
    }, 2500)
  }

  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
      <div className="d-flex align-items-center gap-2 mb-3">
        <span className="fw-bold fs-6">💬 Enquiries</span>
        <span className="tf-badge tf-badge-blue">{enquiries.length}</span>
      </div>

      {enquiries.length === 0 && (
        <p className="text-muted text-center small py-2">No enquiries yet. Be the first to ask!</p>
      )}

      {enquiries.map(e => (
        <div key={e.id} className="tf-enquiry-bubble">
          <div className="d-flex align-items-center gap-2 mb-2">
            <div className="tf-enquiry-avatar">{e.user.charAt(0).toUpperCase()}</div>
            <div>
              <div className="fw-bold" style={{ fontSize: 13 }}>{e.user}</div>
              <div className="text-muted" style={{ fontSize: 11 }}>{e.time}</div>
            </div>
          </div>
          <p className="mb-0 small">{e.msg}</p>
          {e.reply && (
            <div className="tf-enquiry-reply">
              <div className="tf-enquiry-manager-label">🏟️ Turf Manager</div>
              {e.reply}
            </div>
          )}
        </div>
      ))}

      <div className="mt-2">
        {sent && (
          <div className="alert alert-success py-2 small mb-2">
            ✅ Enquiry sent! We'll reply shortly.
          </div>
        )}
        <textarea
          className="form-control mb-2"
          rows={3}
          placeholder={user ? 'Ask a question about this turf…' : 'Sign in to send an enquiry'}
          value={msg}
          onChange={e => setMsg(e.target.value)}
          disabled={!user}
        />
        <button
          className="btn btn-primary w-100 fw-bold"
          onClick={submit}
          disabled={!user || !msg.trim()}
        >
          Send Enquiry →
        </button>
        {!user && (
          <p className="text-center text-muted small mt-2 mb-0">Sign in to post an enquiry</p>
        )}
      </div>
    </div>
  )
}
