import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? ''
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

const SK_STEP        = 'tf_bk_step'
const SK_INFO        = 'tf_bk_info'
const SK_REF         = 'tf_bk_ref'
const SK_PAID        = 'tf_bk_paid'
const SK_SLOTS_SNAP  = 'tf_bk_slots'   // snapshot of lockedSlots at pay time
const SK_AMOUNT_SNAP = 'tf_bk_amount'  // snapshot of totalAmount at pay time

function clearSession() {
  [SK_STEP, SK_INFO, SK_REF, SK_PAID, SK_SLOTS_SNAP, SK_AMOUNT_SNAP]
    .forEach(k => sessionStorage.removeItem(k))
}

// Loads Paystack script and resolves when window.PaystackPop is ready
function loadPaystack() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return }
    const existing = document.getElementById('paystack-js')
    if (existing) {
      const poll = setInterval(() => {
        if (window.PaystackPop) { clearInterval(poll); resolve() }
      }, 80)
      setTimeout(() => { clearInterval(poll); reject(new Error('timeout')) }, 12000)
      return
    }
    const s    = document.createElement('script')
    s.id       = 'paystack-js'
    s.src      = 'https://js.paystack.co/v1/inline.js'
    s.onload   = () => {
      // PaystackPop may not be set immediately on onload — poll briefly
      const poll = setInterval(() => {
        if (window.PaystackPop) { clearInterval(poll); resolve() }
      }, 50)
      setTimeout(() => { clearInterval(poll); reject(new Error('PaystackPop missing after load')) }, 5000)
    }
    s.onerror  = () => reject(new Error('Failed to load Paystack script'))
    document.head.appendChild(s)
  })
}

export default function Booking({ turf, lockedSlots, user, fmtCountdown, onBack, onConfirm }) {
  const [step,       setStep]       = useState(() => parseInt(sessionStorage.getItem(SK_STEP) ?? '1'))
  const [info,       setInfo]       = useState(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(SK_INFO))
      if (s && typeof s === 'object') return s
    } catch {}
    return {
      name:  user?.name    || '',
      phone: user?.contact || user?.phone || '',
      email: user?.email   || '',
      date:  '',
    }
  })
  const [paying,     setPaying]     = useState(false)
  const [paid,       setPaid]       = useState(() => sessionStorage.getItem(SK_PAID) === '1')
  const [err,        setErr]        = useState('')
  const [bookingRef, setBookingRef] = useState(() => sessionStorage.getItem(SK_REF) ?? null)
  const [psReady,    setPsReady]    = useState(!!window.PaystackPop)
  // Snapshot at pay time — so confirmation screen shows correct values
  // even if lockedSlots state is cleared by timer expiry after payment
  const [slotsSnap,  setSlotsSnap]  = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SK_SLOTS_SNAP)) ?? [] } catch { return [] }
  })
  const [amountSnap, setAmountSnap] = useState(() => {
    return parseFloat(sessionStorage.getItem(SK_AMOUNT_SNAP) ?? '0')
  })
  const payingRef  = useRef(false)
  const snapRef    = useRef({ slots: [], amount: 0 })  // sync snapshot for callback closure

  // Persist step + info across refreshes
  useEffect(() => { sessionStorage.setItem(SK_STEP, String(step)) }, [step])
  useEffect(() => { sessionStorage.setItem(SK_INFO, JSON.stringify(info)) }, [info])

  // Preload Paystack script on mount
  useEffect(() => {
    loadPaystack()
      .then(() => setPsReady(true))
      .catch(e  => console.warn('[Booking] Paystack load failed:', e.message))
  }, [])

  useEffect(() => {
    return () => { if (sessionStorage.getItem(SK_PAID) === '1') clearSession() }
  }, [])

  const handle = f => e => setInfo(p => ({ ...p, [f]: e.target.value }))
  const goStep = n => { setErr(''); setStep(n) }

  const totalAmount  = lockedSlots.length * (turf?.pricePerHour ?? 0)
  const minCountdown = lockedSlots.length > 0
    ? Math.min(...lockedSlots.map(l => l.countdown ?? 300))
    : 300

  if (!turf) return (
    <div className="text-center py-5">
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h5 className="fw-bold mt-3">Session expired</h5>
      <p className="text-muted">Please go back and select a turf again.</p>
      <button className="btn btn-primary fw-bold px-4"
        onClick={() => { clearSession(); window.location.href = '/' }}>
        Back to Home
      </button>
    </div>
  )

  const pay = async () => {
    if (payingRef.current) return
    if (!psReady)    { setErr('Payment system still loading — please wait.'); return }
    if (!info.email) { setErr('Email is required for payment.'); return }

    payingRef.current = true
    setPaying(true)
    setErr('')

    try {
      const token = localStorage.getItem('token')
      const today = new Date().toISOString().split('T')[0]

      // The canonical booking date comes from the lock itself — not the form field.
      // All slots in one session are locked for the same date (viewDate when locked).
      // info.date is kept as a display/confirmation field only.
      const lockDate = lockedSlots[0]?.lockDate ?? info.date ?? today
      const date     = lockDate

      // Final guard — reject past dates (belt + suspenders for mobile)
      if (date < today) {
        setPaying(false)
        payingRef.current = false
        setErr('The selected date is in the past. Please go back and choose today or a future date.')
        return
      }

      // ── Step 1: get the real ref from backend FIRST ────────────────────
      // This MUST happen before openIframe() so the webhook can find it.
      const initRes = await axios.post(
        `${API}/bookings`,
        {
          turf_id:      turf.id,
          date,
          total_amount: totalAmount,
          slots: lockedSlots.map(l => ({
            time_slot_id: l.slotId,
            amount:       turf.pricePerHour,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const { paystack_ref } = initRes.data
      console.log('[pay] got ref from backend:', paystack_ref)

      // Snapshot slots + amount NOW before any state changes
      const snapSlots  = lockedSlots.map(l => ({ slotId: l.slotId, label: l.label }))
      const snapAmount = totalAmount
      sessionStorage.setItem(SK_SLOTS_SNAP,  JSON.stringify(snapSlots))
      sessionStorage.setItem(SK_AMOUNT_SNAP, String(snapAmount))
      setSlotsSnap(snapSlots)
      setAmountSnap(snapAmount)
      snapRef.current = { slots: snapSlots, amount: snapAmount }  // sync ref for callback

      // ── Step 2: open Paystack with the BACKEND ref ─────────────────────
      // Mobile browsers (Safari/Chrome) require openIframe() to be called
      // in the same task as the user gesture. Using a hidden iframe trick:
      // we set up the handler and call openIframe() inside a Promise
      // microtask which still counts as the same gesture on most browsers.
      // If that still fails on iOS, we fall back to a direct window.open.
      const handler = window.PaystackPop.setup({
        key:      PAYSTACK_PUBLIC_KEY,
        email:    info.email,
        amount:   Math.round(totalAmount * 100),   // pesewas, must be integer
        currency: 'GHS',
        ref:      paystack_ref,                    // ← backend ref, matches pending_payments
        channels: ['card', 'mobile_money', 'bank'],
        label:    turf.name,
        metadata: {
          custom_fields: [
            { display_name: 'Turf',  variable_name: 'turf',  value: turf.name },
            { display_name: 'Date',  variable_name: 'date',  value: date },
            { display_name: 'Slots', variable_name: 'slots', value: lockedSlots.map(l => l.label).join(', ') },
          ],
        },
        callback: (response) => {
          console.log('[pay] Paystack callback:', response.reference)
          setBookingRef(response.reference)
          sessionStorage.setItem(SK_REF,  response.reference)
          sessionStorage.setItem(SK_PAID, '1')
          setPaying(false)
          setPaid(true)
          payingRef.current = false
          onConfirm({ bookingRef: response.reference, slotCount: lockedSlots.length })
        },
        onClose: () => {
          setPaying(false)
          payingRef.current = false
          setErr('Payment cancelled. Your slot is still reserved — tap "Pay Now" to try again.')
        },
      })

      handler.openIframe()

    } catch (e) {
      setPaying(false)
      payingRef.current = false
      const msg = e.response?.data?.message || 'Could not initiate payment. Please try again.'
      setErr(msg)
      console.error('[pay] error:', e.response?.data ?? e.message)
    }
  }

  const stepCls = i => step > i ? 'tf-step-done' : step === i ? 'tf-step-active' : 'tf-step-idle'
  const lineCls = i => step > i ? 'tf-step-line-done' : 'tf-step-line-idle'

  // ── Confirmed ────────────────────────────────────────────────────────────
  // Use snapshots — lockedSlots may be empty by the time this renders
  // Priority: ref (sync) → sessionStorage → state → live props
  const displaySlots = (() => {
    if (snapRef.current.slots.length > 0) return snapRef.current.slots
    try {
      const s = JSON.parse(sessionStorage.getItem(SK_SLOTS_SNAP))
      if (Array.isArray(s) && s.length > 0) return s
    } catch {}
    return slotsSnap.length > 0 ? slotsSnap : lockedSlots
  })()
  const displayAmount = (() => {
    if (snapRef.current.amount > 0) return snapRef.current.amount
    const v = parseFloat(sessionStorage.getItem(SK_AMOUNT_SNAP))
    if (v > 0) return v
    return amountSnap > 0 ? amountSnap : totalAmount
  })()

  if (paid) return (
    <div className="tf-animate-in row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6 text-center py-5">
        <div className="display-1 mb-3">🎉</div>
        <h3 className="font-condensed fw-bolder text-primary mb-1">BOOKING CONFIRMED!</h3>
        <p className="text-muted mb-2">
          Your {displaySlots.length > 1 ? 'slots are' : 'slot is'} secured. See you on the turf!
        </p>
        <p className="text-muted small mb-4">
          <i className="bi bi-info-circle me-1"></i>
          Your booking will appear in My Bookings within a few seconds.
        </p>
        <div className="card border-0 shadow-sm rounded-4 p-3 text-start mb-4">
          {[
            ['Reference',  bookingRef ?? '—'],
            ['Turf',       turf.name],
            ['Slots',      displaySlots.map(l => l.label).join(', ') || '—'],
            ['Date',       info.date || new Date().toLocaleDateString('en-GB')],
            ['Total Paid', `₵${displayAmount}.00`],
          ].map(([k, v]) => (
            <div key={k} className="tf-divider-row">
              <span className="text-muted">{k}</span>
              <span className="fw-bold">{v}</span>
            </div>
          ))}
        </div>
        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <button className="btn btn-primary fw-bold px-4"
            onClick={() => { clearSession(); window.location.href = '/mybookings' }}>
            <i className="bi bi-calendar2-check me-2"></i>My Bookings
          </button>
          <button className="btn btn-outline-primary fw-bold px-4"
            onClick={() => { clearSession(); onBack() }}>
            <i className="bi bi-house-fill me-2"></i>Home
          </button>
        </div>
      </div>
    </div>
  )

  // ── Booking flow ─────────────────────────────────────────────────────────
  return (
    <div className="tf-animate-in row justify-content-center">
      <div className="col-12 col-md-10 col-lg-8 col-xl-7">

        <button className="tf-back-btn" onClick={() => { clearSession(); onBack() }}>
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
                <span className={`tf-step-label ${step === i + 1 ? 'text-primary' : 'text-muted'}`}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className={`tf-step-line ${lineCls(i + 1)}`} />}
            </div>
          ))}
        </div>

        {/* Expiry banner */}
        <div className="tf-reserved-banner d-flex justify-content-between align-items-center mb-3">
          <small className="text-muted">
            🔒 {lockedSlots.length} slot{lockedSlots.length > 1 ? 's' : ''} reserved · expires in
          </small>
          <span className="fw-bolder" style={{ color: '#856404' }}>{fmtCountdown(minCountdown)}</span>
        </div>

        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-3">
            <div className="fw-bold mb-3">👤 Your Details</div>
            {err && <div className="alert alert-danger py-2 small">{err}</div>}
            <div className="row g-3">
              <div className="col-12 col-sm-6">
                <input className="form-control" placeholder="Full Name"
                  value={info.name} onChange={handle('name')} />
              </div>
              <div className="col-12 col-sm-6">
                <input className="form-control" placeholder="Phone Number"
                  value={info.phone} onChange={handle('phone')} />
              </div>
              <div className="col-12 col-sm-6">
                <input className="form-control" type="email" placeholder="Email Address"
                  value={info.email} onChange={handle('email')} />
              </div>
              <div className="col-12 col-sm-6">
                <div className="form-control bg-light text-muted" style={{ cursor: 'default' }}>
                  <i className="bi bi-calendar3 me-2"></i>
                  {[...new Set(lockedSlots.map(l => l.lockDate))].filter(Boolean).length > 0
                    ? [...new Set(lockedSlots.map(l => l.lockDate))].filter(Boolean)
                        .map(d => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
                          weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
                        })).join(' & ')
                    : 'No date selected'}
                </div>
              </div>
            </div>
            <button className="btn btn-primary w-100 fw-bold mt-4 py-2"
              onClick={() => {
                if (!info.name || !info.phone) { setErr('Name and phone are required.'); return }
                if (!info.email) { setErr('Email is required for payment.'); return }
                goStep(2)
              }}>
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 2: Review ── */}
        {step === 2 && (
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <div className="fw-bold text-primary mb-3">📋 Booking Summary</div>
                {(() => {
                  // Derive unique booking dates from the locks themselves
                  const uniqueDates = [...new Set(lockedSlots.map(l => l.lockDate))].filter(Boolean)
                  const dateDisplay = uniqueDates.length > 0
                    ? uniqueDates.map(d => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
                        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
                      })).join(' & ')
                    : new Date().toLocaleDateString('en-GB')
                  return [
                    ['Turf',     turf.name],
                    ['Location', turf.location],
                    ['Date',     dateDisplay],
                    ['Name',     info.name],
                    ['Phone',    info.phone],
                  ].map(([k, v]) => (
                    <div key={k} className="tf-divider-row">
                      <span className="text-muted">{k}</span>
                      <span className="fw-bold">{v}</span>
                    </div>
                  ))
                })()}
                <div className="mt-2 mb-1">
                  <div className="text-muted small mb-1">Time Slots</div>
                  {(() => {
                    // Group slots by their lockDate for a clear multi-date display
                    const byDate = lockedSlots.reduce((acc, l) => {
                      const key = l.lockDate ?? 'Unknown date'
                      if (!acc[key]) acc[key] = []
                      acc[key].push(l)
                      return acc
                    }, {})
                    const dates = Object.keys(byDate).sort()
                    return dates.map(date => (
                      <div key={date}>
                        {dates.length > 1 && (
                          <div className="text-muted small fw-bold mt-2 mb-1">
                            {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
                              weekday: 'short', day: 'numeric', month: 'short'
                            })}
                          </div>
                        )}
                        {byDate[date].map(l => (
                          <div key={l.slotId} className="d-flex justify-content-between small py-1 border-bottom">
                            <span>{l.label}</span>
                            <span className="fw-bold">₵{turf.pricePerHour}</span>
                          </div>
                        ))}
                      </div>
                    ))
                  })()}
                </div>
                <div className="d-flex justify-content-between align-items-center pt-2">
                  <span className="fw-bolder fs-5">Total</span>
                  <span className="fw-bolder fs-4 text-primary">₵{totalAmount}.00</span>
                </div>
                <div className="alert alert-warning py-2 small mt-3 mb-0">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  <strong>Cancellation policy:</strong> Full refund 24+ hrs before.
                  50% penalty within 24 hrs. No refund within 6 hrs.
                </div>
              </div>
            </div>
            <div className="col-12 col-md-5 d-flex flex-column gap-2 justify-content-end">
              <div className="card border-0 bg-light rounded-4 p-3">
                <div className="text-muted small mb-1">Turf</div>
                <div className="fw-bold">{turf.name}</div>
                <div className="text-muted small mt-2 mb-1">Slots</div>
                <div className="fw-bold text-primary small">
                  {(() => {
                    const byDate = lockedSlots.reduce((acc, l) => {
                      const key = l.lockDate ?? ''
                      if (!acc[key]) acc[key] = []
                      acc[key].push(l.label)
                      return acc
                    }, {})
                    return Object.entries(byDate).sort().map(([date, labels]) => (
                      <div key={date}>
                        {Object.keys(byDate).length > 1 && date && (
                          <span className="text-muted me-1">
                            {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short'
                            })}:
                          </span>
                        )}
                        {labels.join(' · ')}
                      </div>
                    ))
                  })()}
                </div>
                <div className="text-muted small mt-2 mb-1">Amount</div>
                <div className="fw-bolder fs-4 text-primary">₵{totalAmount}.00</div>
              </div>
              <button className="btn btn-primary fw-bold py-2" onClick={() => goStep(3)}>
                Pay with Paystack →
              </button>
              <button className="btn btn-outline-secondary fw-bold" onClick={() => goStep(1)}>
                ← Edit Details
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Pay ── */}
        {step === 3 && (
          <div className="row g-3">
            <div className="col-12 col-md-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 text-center">
                <div className="tf-paystack-badge mb-2">💳 PAYSTACK</div>
                <p className="text-muted small mb-3">
                  Tap "Pay Now" — a secure Paystack window will open.
                  Pay by card, MTN MoMo, or Vodafone Cash.
                </p>
                <div className="d-flex flex-wrap gap-2 justify-content-center mb-4">
                  {['Visa', 'Mastercard', 'MTN MoMo', 'Vodafone Cash'].map(m => (
                    <span key={m} className="tf-badge tf-badge-cyan">{m}</span>
                  ))}
                </div>

                {!psReady && (
                  <div className="alert alert-info py-2 small mb-3">
                    <span className="spinner-border spinner-border-sm me-2" />
                    Loading payment system…
                  </div>
                )}

                <button
                  className="btn btn-primary w-100 fw-bold py-3 fs-5"
                  onClick={pay}
                  disabled={paying || !psReady}
                >
                  {paying
                    ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Processing…</>
                    : !psReady
                      ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Loading…</>
                      : `Pay ₵${totalAmount}.00 Now`
                  }
                </button>

                {err && (
                  <div className="alert alert-danger py-2 small mt-3 text-start">
                    <i className="bi bi-exclamation-circle me-1"></i>{err}
                  </div>
                )}

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
                <div className="text-muted small">
                  {(() => {
                    const byDate = lockedSlots.reduce((acc, l) => {
                      const key = l.lockDate ?? ''
                      if (!acc[key]) acc[key] = []
                      acc[key].push(l.label)
                      return acc
                    }, {})
                    return Object.entries(byDate).sort().map(([date, labels]) => (
                      <div key={date}>
                        {Object.keys(byDate).length > 1 && date && (
                          <span className="text-muted me-1">
                            {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short'
                            })}:
                          </span>
                        )}
                        {labels.join(', ')}
                      </div>
                    ))
                  })()}
                </div>
              </div>
              <button className="btn btn-outline-secondary w-100 fw-bold" onClick={() => goStep(2)}>
                ← Back to Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
};