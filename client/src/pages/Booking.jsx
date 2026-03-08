import { useState, useEffect } from 'react'
import axios from 'axios'

function usePaystackScript() {
  useEffect(() => {
    if (document.getElementById('paystack-script')) return
    const s = document.createElement('script')
    s.id = 'paystack-script'; s.src = 'https://js.paystack.co/v1/inline.js'; s.async = true
    document.body.appendChild(s)
  }, [])
}

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? ''
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

// lockedSlots: Array<{ slotId, turfId, label, countdown }>
export default function Booking({ turf, lockedSlots, user, fmtCountdown, onBack, onConfirm }) {
  usePaystackScript()

  const [step,      setStep]      = useState(1)
  const [info,      setInfo]      = useState({
    name: user?.name || '', phone: user?.contact || user?.phone || '',
    email: user?.email || '', date: '',
  })
  const [paying,    setPaying]    = useState(false)
  const [paid,      setPaid]      = useState(false)
  const [err,       setErr]       = useState('')
  const [bookingId, setBookingId] = useState(null)

  const handle = f => e => setInfo(p => ({ ...p, [f]: e.target.value }))

  const totalAmount = lockedSlots.length * (turf.pricePerHour ?? 0)
  // Shortest remaining countdown among all locked slots
  const minCountdown = lockedSlots.length > 0
    ? Math.min(...lockedSlots.map(l => l.countdown ?? 300))
    : 300

  // Save all slots to DB sequentially
  const saveAllBookings = async () => {
    const token = localStorage.getItem('token')
    const date  = info.date || new Date().toISOString().split('T')[0]
    const ids   = []
    for (const lock of lockedSlots) {
      const res = await axios.post(
        `${API}/api/bookings`,
        { turf_id: turf.id, time_slot_id: lock.slotId, date, amount: turf.pricePerHour },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      ids.push(res.data?.booking?.id)
    }
    return ids
  }

  const pay = () => {
    if (!PAYSTACK_PUBLIC_KEY) { setErr('Paystack public key not configured.'); return }
    if (!info.email)          { setErr('Email is required to process payment.'); return }

    setPaying(true)
    setErr('')

    const handler = window.PaystackPop.setup({
      key:      PAYSTACK_PUBLIC_KEY,
      email:    info.email,
      amount:   totalAmount * 100,   // pesewas
      currency: 'GHS',
      ref:      `BK-${Date.now()}`,
      metadata: {
        turf_name: turf.name,
        slots:     lockedSlots.map(l => l.label).join(', '),
        date:      info.date || new Date().toISOString().split('T')[0],
      },
      callback: async (response) => {
        try {
          const ids = await saveAllBookings()
          const id  = ids[0] ? `BK${String(ids[0]).padStart(6, '0')}` : `BK${Date.now().toString().slice(-6)}`
          setBookingId(id)
          setPaying(false)
          setPaid(true)
          onConfirm({ ...info, bookingId: id, paystackRef: response.reference })
        } catch (e) {
          setPaying(false)
          setErr(e.response?.data?.message || 'Payment succeeded but booking save failed. Contact support.')
        }
      },
      onClose: () => setPaying(false),
    })
    handler.openIframe()
  }

  const stepCls = i => step > i ? 'tf-step-done' : step === i ? 'tf-step-active' : 'tf-step-idle'
  const lineCls = i => step > i ? 'tf-step-line-done' : 'tf-step-line-idle'

  if (paid) return (
    <div className="tf-animate-in row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6 text-center py-5">
        <div className="display-1 mb-3">🎉</div>
        <h3 className="font-condensed fw-bolder text-primary mb-1">BOOKING CONFIRMED!</h3>
        <p className="text-muted mb-4">Your {lockedSlots.length > 1 ? 'slots are' : 'slot is'} secured. See you on the turf!</p>
        <div className="card border-0 shadow-sm rounded-4 p-3 text-start mb-4">
          {[
            ['Booking ID', bookingId ?? '—'],
            ['Turf', turf.name],
            ['Slots', lockedSlots.map(l => l.label).join(', ')],
            ['Paid', `₵${totalAmount}.00`],
          ].map(([k, v]) => (
            <div key={k} className="tf-divider-row">
              <span className="text-muted">{k}</span><span className="fw-bold">{v}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-outline-primary fw-bold px-4" onClick={onBack}>
          <i className="bi bi-house-fill me-2"></i>Back to Home
        </button>
      </div>
    </div>
  )

  return (
    <div className="tf-animate-in row justify-content-center">
      <div className="col-12 col-md-10 col-lg-8 col-xl-7">
        <button className="tf-back-btn" onClick={onBack}>
          <i className="bi bi-arrow-left"></i> Back
        </button>

        {/* Stepper */}
        <div className="tf-stepper mb-4">
          {['Details', 'Review', 'Pay'].map((label, i) => (
            <div key={i} className="d-flex align-items-center flex-grow-1">
              <div className="tf-step-wrap">
                <div className={`tf-step-circle ${stepCls(i + 1)}`}>
                  {step > i + 1 ? <i className="bi bi-check-lg"></i> : i + 1}
                </div>
                <span className={`tf-step-label ${step === i + 1 ? 'text-primary' : 'text-muted'}`}>{label}</span>
              </div>
              {i < 2 && <div className={`tf-step-line ${lineCls(i + 1)}`} />}
            </div>
          ))}
        </div>

        {/* Countdown banner — shows shortest remaining time */}
        <div className="tf-reserved-banner d-flex justify-content-between align-items-center mb-3">
          <small className="text-muted">🔒 {lockedSlots.length} slot{lockedSlots.length > 1 ? 's' : ''} reserved · expires in</small>
          <span className="fw-bolder" style={{ color: '#856404' }}>{fmtCountdown(minCountdown)}</span>
        </div>

        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-3">
            <div className="fw-bold mb-3">👤 Your Details</div>
            {err && <div className="alert alert-danger py-2 small">{err}</div>}
            <div className="row g-3">
              <div className="col-12 col-sm-6">
                <input className="form-control" placeholder="Full Name" value={info.name} onChange={handle('name')} />
              </div>
              <div className="col-12 col-sm-6">
                <input className="form-control" placeholder="Phone Number" value={info.phone} onChange={handle('phone')} />
              </div>
              <div className="col-12 col-sm-6">
                <input className="form-control" type="email" placeholder="Email Address" value={info.email} onChange={handle('email')} />
              </div>
              <div className="col-12 col-sm-6">
                <input className="form-control" type="date" value={info.date} onChange={handle('date')} />
              </div>
            </div>
            <button className="btn btn-primary w-100 fw-bold mt-4 py-2"
              onClick={() => { if (!info.name || !info.phone) { setErr('Name and phone are required.'); return } setErr(''); setStep(2) }}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — Review */}
        {step === 2 && (
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <div className="fw-bold text-primary mb-3">📋 Booking Summary</div>
                {[['Turf', turf.name], ['Location', turf.location], ['Date', info.date || 'Today'], ['Name', info.name], ['Phone', info.phone]].map(([k, v]) => (
                  <div key={k} className="tf-divider-row">
                    <span className="text-muted">{k}</span><span className="fw-bold">{v}</span>
                  </div>
                ))}
                {/* List each slot */}
                <div className="mt-2 mb-2">
                  <div className="text-muted small mb-1">Time Slots</div>
                  {lockedSlots.map(l => (
                    <div key={l.slotId} className="d-flex justify-content-between small py-1 border-bottom">
                      <span>{l.label}</span>
                      <span className="fw-bold">₵{turf.pricePerHour}</span>
                    </div>
                  ))}
                </div>
                <div className="d-flex justify-content-between align-items-center pt-2">
                  <span className="fw-bolder fs-5">Total</span>
                  <span className="fw-bolder fs-4 text-primary">₵{totalAmount}.00</span>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-5 d-flex flex-column gap-2 justify-content-end">
              <div className="card border-0 bg-light rounded-4 p-3">
                <div className="text-muted small mb-1">Turf</div>
                <div className="fw-bold">{turf.name}</div>
                <div className="text-muted small mt-2 mb-1">Slots</div>
                <div className="fw-bold text-primary small">{lockedSlots.map(l => l.label).join(' · ')}</div>
                <div className="text-muted small mt-2 mb-1">Amount</div>
                <div className="fw-bolder fs-4 text-primary">₵{totalAmount}.00</div>
              </div>
              <button className="btn btn-primary fw-bold py-2" onClick={() => setStep(3)}>Pay with Paystack →</button>
              <button className="btn btn-outline-secondary fw-bold" onClick={() => setStep(1)}>← Edit Details</button>
            </div>
          </div>
        )}

        {/* Step 3 — Pay */}
        {step === 3 && (
          <div className="row g-3">
            <div className="col-12 col-md-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 text-center">
                <div className="tf-paystack-badge mb-2">💳 PAYSTACK</div>
                <p className="text-muted small mb-4">
                  Clicking the button below opens the secure Paystack payment popup.
                  Your card details are entered directly on Paystack — we never see them.
                </p>
                <div className="d-flex flex-wrap gap-2 justify-content-center mb-4">
                  {['Visa', 'MasterCard', 'MTN MoMo', 'Vodafone Cash'].map(m => (
                    <span key={m} className="tf-badge tf-badge-cyan">{m}</span>
                  ))}
                </div>
                <button className="btn btn-primary w-100 fw-bold py-3 fs-5" onClick={pay} disabled={paying}>
                  {paying ? '⏳ Opening Paystack…' : `Pay ₵${totalAmount}.00 Now`}
                </button>
                {err && <div className="alert alert-danger py-2 small mt-3 text-start">{err}</div>}
                <p className="text-muted small mt-3 mb-0">
                  <i className="bi bi-lock-fill me-1"></i>256-bit SSL · Secured by Paystack
                </p>
              </div>
            </div>
            <div className="col-12 col-md-5">
              <div className="card border-0 bg-light rounded-4 p-3 mb-3">
                <div className="text-muted small mb-1">Amount Due</div>
                <div className="fw-bolder fs-1 text-primary">₵{totalAmount}.00</div>
                <hr />
                <div className="text-muted small mb-1">Booking</div>
                <div className="fw-bold small">{turf.name}</div>
                <div className="text-muted small">{lockedSlots.map(l => l.label).join(', ')}</div>
              </div>
              <button className="btn btn-outline-secondary w-100 fw-bold" onClick={() => setStep(2)}>← Back to Review</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}