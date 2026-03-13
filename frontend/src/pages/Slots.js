/**
 * AdminSlots.jsx
 *
 * Manages time_slots TEMPLATE rows for the admin's turf.
 * These are reusable hourly slots (e.g. 06:00–07:00) with NO date.
 * The booking date is stored in the bookings table, not here.
 *
 * API expected:
 *   GET    /api/slots?turf_id=X        → { slots: [...] }
 *   POST   /api/slots                  → { slot }
 *   PUT    /api/slots/:id              → { slot }
 *   DELETE /api/slots/:id              → { message }
 */
import { useState, useEffect } from "react"
import axios from "axios"

const API = process.env.REACT_APP_URL || "http://localhost:5000";

// Generate 30-min or 1-hour options for a time picker
function timeOptions() {
  const opts = []
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      opts.push(`${hh}:${mm}`)
    }
  }
  return opts
}
const TIME_OPTIONS = timeOptions()

const fmt = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12  = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

const EMPTY_FORM = { start_time: '06:00', end_time: '07:00' }

// ── Slot Form Modal ────────────────────────────────────────────────────────
function SlotModal({ isOpen, onClose, onSave, onDelete, existing }) {
  const isEditing = Boolean(existing)
  const [form, setForm]   = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setForm(existing
        ? { start_time: existing.start_time.slice(0,5), end_time: existing.end_time.slice(0,5) }
        : EMPTY_FORM
      )
      setError('')
    }
  }, [isOpen, existing?.id])

  if (!isOpen) return null

  const validate = () => {
    if (form.start_time >= form.end_time) {
      setError('End time must be after start time')
      return false
    }
    return true
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({ ...existing, ...form })
  }

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1"
        style={{ background: 'rgba(10,12,20,0.55)' }}
        onClick={onClose}
      >
        <div className="modal-dialog modal-dialog-centered"
          style={{ maxWidth: 400 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">

            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1a56db 0%, #0e3fa5 100%)',
              padding: '18px 24px'
            }}>
              <h5 className="mb-0 text-white fw-bold">
                {isEditing ? 'Edit Time Slot' : 'Add Time Slot'}
              </h5>
              <p className="mb-0 text-white opacity-75" style={{ fontSize: 13 }}>
                Template slot — no date, reused every day
              </p>
            </div>

            <div className="modal-body px-4 py-3">
              {error && (
                <div className="alert alert-danger py-2 small mb-3">{error}</div>
              )}

              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label fw-semibold small">Start Time</label>
                  <select className="form-select"
                    value={form.start_time}
                    onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{fmt(t)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label fw-semibold small">End Time</label>
                  <select className="form-select"
                    value={form.end_time}
                    onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{fmt(t)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-3 p-2 rounded text-center"
                style={{ background: '#f0f4ff', fontSize: 13 }}>
                <span className="text-muted">Preview: </span>
                <strong className="text-primary">
                  {fmt(form.start_time)} – {fmt(form.end_time)}
                </strong>
                {form.start_time < form.end_time && (
                  <span className="text-muted ms-2">
                    ({(
                      (parseInt(form.end_time) * 60 + parseInt(form.end_time.split(':')[1])) -
                      (parseInt(form.start_time) * 60 + parseInt(form.start_time.split(':')[1]))
                    )} min)
                  </span>
                )}
              </div>
            </div>

            <div className="modal-footer border-0 px-4 pb-4 pt-0 gap-2">
              {isEditing && (
                <button className="btn btn-outline-danger btn-sm me-auto"
                  onClick={() => onDelete(existing)}>
                  <i className="bi bi-trash me-1"></i>Delete
                </button>
              )}
              <button className="btn btn-light btn-sm" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary btn-sm px-4" onClick={handleSave}>
                {isEditing ? 'Save Changes' : 'Add Slot'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Bulk generator modal ───────────────────────────────────────────────────
function BulkModal({ isOpen, onClose, onGenerate }) {
  const [from,  setFrom]  = useState('06:00')
  const [to,    setTo]    = useState('22:00')
  const [step,  setStep]  = useState(60)   // minutes

  if (!isOpen) return null

  const preview = () => {
    const slots = []
    let cur = parseInt(from.split(':')[0]) * 60 + parseInt(from.split(':')[1])
    const end = parseInt(to.split(':')[0]) * 60 + parseInt(to.split(':')[1])
    while (cur + step <= end) {
      const sh = String(Math.floor(cur / 60)).padStart(2, '0')
      const sm = String(cur % 60).padStart(2, '0')
      const eh = String(Math.floor((cur + step) / 60)).padStart(2, '0')
      const em = String((cur + step) % 60).padStart(2, '0')
      slots.push({ start_time: `${sh}:${sm}`, end_time: `${eh}:${em}` })
      cur += step
    }
    return slots
  }

  const slots = preview()

  return (
    <div className="modal fade show d-block" tabIndex="-1"
      style={{ background: 'rgba(10,12,20,0.55)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: 460 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            padding: '18px 24px'
          }}>
            <h5 className="mb-0 text-white fw-bold">Bulk Generate Slots</h5>
            <p className="mb-0 text-white opacity-75" style={{ fontSize: 13 }}>
              Auto-create evenly spaced slots
            </p>
          </div>

          <div className="modal-body px-4 py-3">
            <div className="row g-3 mb-3">
              <div className="col-4">
                <label className="form-label fw-semibold small">From</label>
                <select className="form-select form-select-sm"
                  value={from} onChange={e => setFrom(e.target.value)}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{fmt(t)}</option>)}
                </select>
              </div>
              <div className="col-4">
                <label className="form-label fw-semibold small">To</label>
                <select className="form-select form-select-sm"
                  value={to} onChange={e => setTo(e.target.value)}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{fmt(t)}</option>)}
                </select>
              </div>
              <div className="col-4">
                <label className="form-label fw-semibold small">Duration</label>
                <select className="form-select form-select-sm"
                  value={step} onChange={e => setStep(parseInt(e.target.value))}>
                  <option value={30}>30 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>90 min</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            {/* Preview grid */}
            <div className="p-2 rounded" style={{ background: '#f8f9fa', maxHeight: 180, overflowY: 'auto' }}>
              {slots.length === 0
                ? <p className="text-muted small text-center mb-0">No slots — adjust range or duration</p>
                : <div className="d-flex flex-wrap gap-2">
                    {slots.map((s, i) => (
                      <span key={i} className="badge bg-primary rounded-pill px-3 py-2" style={{ fontSize: 12 }}>
                        {fmt(s.start_time)} – {fmt(s.end_time)}
                      </span>
                    ))}
                  </div>
              }
            </div>
            {slots.length > 0 && (
              <p className="text-muted small mt-2 mb-0">
                {slots.length} slot{slots.length > 1 ? 's' : ''} will be created
              </p>
            )}
          </div>

          <div className="modal-footer border-0 px-4 pb-4 pt-0">
            <button className="btn btn-light btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-success btn-sm px-4"
              disabled={slots.length === 0}
              onClick={() => { onGenerate(slots); onClose() }}>
              Generate {slots.length} Slots
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminSlots() {
  const [slots,   setSlots]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [modal,   setModal]   = useState({ open: false, existing: null })
  const [bulk,    setBulk]    = useState(false)
  const [toast,   setToast]   = useState(null)

  const token   = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Fetch slots ──────────────────────────────────────────────────────────
  const fetchSlots = async () => {
    setLoading(true)
    try {
      const user    = JSON.parse(localStorage.getItem('user') || '{}')
      const turf_id = user.turf_id
      const res     = await axios.get(`${API}/api/slots?turf_id=${turf_id}`, { headers })
      setSlots(res.data.slots ?? [])
    } catch {
      showToast('Failed to load slots', 'danger');
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSlots() }, [])

  // ── Save (add or edit) ───────────────────────────────────────────────────
  const handleSave = async (formData) => {
    setSaving(true)
    try {
      const user    = JSON.parse(localStorage.getItem('user') || '{}')
      const turf_id = user.turf_id

      if (formData.id) {
        // Edit
        const res = await axios.put(`${API}/api/slots/${formData.id}`,
          { start_time: formData.start_time, end_time: formData.end_time },
          { headers }
        )
        setSlots(prev => prev.map(s => s.id === formData.id ? res.data.slot : s))
        showToast('Slot updated')
      } else {
        // Add single
        const res = await axios.post(`${API}/api/slots`,
          { turf_id, start_time: formData.start_time, end_time: formData.end_time },
          { headers }
        )
        setSlots(prev => [...prev, res.data.slot].sort((a,b) => a.start_time.localeCompare(b.start_time)))
        showToast('Slot added')
      }
      setModal({ open: false, existing: null })
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to save slot', 'danger')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (slot) => {
    if (!window.confirm(`Delete ${fmt(slot.start_time)} – ${fmt(slot.end_time)}? This cannot be undone.`)) return
    try {
      await axios.delete(`${API}/api/slots/${slot.id}`, { headers })
      setSlots(prev => prev.filter(s => s.id !== slot.id))
      setModal({ open: false, existing: null })
      showToast('Slot deleted')
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to delete slot', 'danger')
    }
  }

  // ── Bulk generate ────────────────────────────────────────────────────────
  const handleBulkGenerate = async (newSlots) => {
    setSaving(true)
    try {
      const user    = JSON.parse(localStorage.getItem('user') || '{}')
      const turf_id = user.turf_id
      const res     = await axios.post(`${API}/api/slots/bulk`,
        { turf_id, slots: newSlots },
        { headers }
      )
      await fetchSlots()  // re-fetch to get DB ids + sorted order
      showToast(`${res.data.created} slot${res.data.created > 1 ? 's' : ''} created`)
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Bulk generate failed', 'danger')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete all ───────────────────────────────────────────────────────────
  const handleDeleteAll = async () => {
    if (!window.confirm('Delete ALL slots for this turf? This cannot be undone.')) return
    try {
      const user    = JSON.parse(localStorage.getItem('user') || '{}')
      await axios.delete(`${API}/api/slots/all?turf_id=${user.turf_id}`, { headers })
      setSlots([])
      showToast('All slots deleted')
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to delete all slots', 'danger')
    }
  }

  return (
    <div className="row gx-3">
      <div className="col-xxl-12">

        {/* Toast */}
        {toast && (
          <div className={`alert alert-${toast.type} alert-dismissible py-2 mb-3`}
            style={{ position: 'sticky', top: 16, zIndex: 999 }}>
            {toast.msg}
          </div>
        )}

        <div className="card mb-3">
          <div className="card-header d-flex flex-wrap align-items-center gap-2">
            <div>
              <h5 className="card-title mb-0">Time Slot Templates</h5>
              <small className="text-muted">
                These slots repeat every day — no dates. Bookings store the date separately.
              </small>
            </div>
            <div className="ms-auto d-flex gap-2 flex-wrap">
              {slots.length > 0 && (
                <button className="btn btn-outline-danger btn-sm"
                  onClick={handleDeleteAll}>
                  <i className="bi bi-trash me-1"></i>Delete All
                </button>
              )}
              <button className="btn btn-outline-success btn-sm"
                onClick={() => setBulk(true)}>
                <i className="bi bi-lightning me-1"></i>Bulk Generate
              </button>
              <button className="btn btn-primary btn-sm"
                onClick={() => setModal({ open: true, existing: null })}>
                <i className="bi bi-plus-lg me-1"></i>Add Slot
              </button>
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-clock fs-1 d-block mb-3 opacity-25"></i>
                <p className="text-muted mb-3">No time slots yet.</p>
                <div className="d-flex gap-2 justify-content-center">
                  <button className="btn btn-outline-success btn-sm"
                    onClick={() => setBulk(true)}>
                    <i className="bi bi-lightning me-1"></i>Bulk Generate
                  </button>
                  <button className="btn btn-primary btn-sm"
                    onClick={() => setModal({ open: true, existing: null })}>
                    <i className="bi bi-plus-lg me-1"></i>Add First Slot
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Summary bar */}
                <div className="d-flex align-items-center gap-3 mb-3 p-3 rounded"
                  style={{ background: '#f0f4ff' }}>
                  <div>
                    <span className="fw-bold text-primary fs-5">{slots.length}</span>
                    <span className="text-muted ms-1 small">slot{slots.length > 1 ? 's' : ''} active</span>
                  </div>
                  <div className="text-muted small">
                    {fmt(slots[0]?.start_time)} → {fmt(slots[slots.length - 1]?.end_time)}
                  </div>
                  <div className="text-muted small ms-auto">
                    Visible to users every day they book
                  </div>
                </div>

                {/* Slot grid */}
                <div className="d-flex flex-wrap gap-2">
                  {slots.map(slot => (
                    <div key={slot.id}
                      className="d-flex align-items-center gap-2 px-3 py-2 rounded border"
                      style={{
                        background: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontSize: 13,
                      }}
                      onClick={() => setModal({ open: true, existing: slot })}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#1a56db'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = ''}
                    >
                      <i className="bi bi-clock text-primary" style={{ fontSize: 12 }}></i>
                      <span className="fw-semibold">
                        {fmt(slot.start_time)} – {fmt(slot.end_time)}
                      </span>
                      <i className="bi bi-pencil text-muted ms-1" style={{ fontSize: 11 }}></i>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <SlotModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, existing: null })}
        onSave={handleSave}
        onDelete={handleDelete}
        existing={modal.existing}
      />

      <BulkModal
        isOpen={bulk}
        onClose={() => setBulk(false)}
        onGenerate={handleBulkGenerate}
      />
    </div>
  )
};