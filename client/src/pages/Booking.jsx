import { useState } from 'react'

export default function Booking({ turf, slot, user, countdown, fmtCountdown, onBack, onConfirm }) {
  const [step,   setStep]   = useState(1)
  const [info,   setInfo]   = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
    email: user?.email || '',
    date:  '',
  })
  const [paying, setPaying] = useState(false)
  const [paid,   setPaid]   = useState(false)
  const [err,    setErr]    = useState('')

  const handle = f => e => setInfo(p => ({ ...p, [f]: e.target.value }))

  const pay = () => {
    setPaying(true)
    setTimeout(() => { setPaying(false); setPaid(true); onConfirm(info) }, 3000)
  }

  const stepState = i => step > i ? 'tf-step-done' : step === i ? 'tf-step-active' : 'tf-step-idle'
  const lineState = i => step > i ? 'tf-step-line-done' : 'tf-step-line-idle'

  return (
    <div className="tf-animate-in">
      <button className="tf-back-btn" onClick={onBack}>
        <i className="bi bi-arrow-left"></i> Back
      </button>

      {/* Stepper */}
      <div className="tf-stepper mb-4">
        {['Details', 'Review', 'Pay'].map((label, i) => (
          <div key={i} className="d-flex align-items-center flex-grow-1">
            <div className="tf-step-wrap">
              <div className={`tf-step-circle ${stepState(i + 1)}`}>
                {step > i + 1 ? <i className="bi bi-check-lg"></i> : i + 1}
              </div>
              <span className={`tf-step-label ${step === i + 1 ? 'text-primary' : 'text-muted'}`}>{label}</span>
            </div>
            {i < 2 && <div className={`tf-step-line ${lineState(i + 1)}`} />}
          </div>
        ))}
      </div>

      {/* Countdown banner */}
      <div className="tf-reserved-banner d-flex justify-content-between align-items-center mb-3">
        <small className="text-muted">🔒 Slot reserved for</small>
        <span className="fw-bolder" style={{ color: '#856404' }}>{fmtCountdown(countdown)}</span>
      </div>

      {/* Step 1 — Details */}
      {step === 1 && (
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
          <div className="fw-bold mb-3">👤 Your Details</div>
          {err && <div className="alert alert-danger py-2 small">{err}</div>}
          <div className="d-flex flex-column gap-2">
            <input className="form-control" placeholder="Full Name"     value={info.name}  onChange={handle('name')} />
            <input className="form-control" placeholder="Phone Number"  value={info.phone} onChange={handle('phone')} />
            <input className="form-control" type="email" placeholder="Email Address" value={info.email} onChange={handle('email')} />
            <input className="form-control" type="date" value={info.date} onChange={handle('date')} />
          </div>
          <button
            className="btn btn-primary w-100 fw-bold mt-3 py-2"
            onClick={() => {
              if (!info.name || !info.phone) { setErr('Name and phone are required.'); return }
              setErr(''); setStep(2)
            }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step 2 — Review */}
      {step === 2 && (
        <div>
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
            <div className="fw-bold text-primary mb-3">📋 Booking Summary</div>
            {[
              ['Turf',     turf.name],
              ['Location', turf.location],
              ['Date',     info.date || 'Today'],
              ['Time',     slot.label],
              ['Duration', '1 Hour'],
              ['Name',     info.name],
              ['Phone',    info.phone],
            ].map(([k, v]) => (
              <div key={k} className="tf-divider-row">
                <span className="text-muted">{k}</span>
                <span className="fw-bold">{v}</span>
              </div>
            ))}
            <div className="d-flex justify-content-between align-items-center pt-3">
              <span className="fw-bolder fs-5">Total</span>
              <span className="fw-bolder fs-4 text-primary">₵{turf.pricePerHour}.00</span>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary fw-bold flex-grow-1" onClick={() => setStep(1)}>← Edit</button>
            <button className="btn btn-primary fw-bold flex-grow-2 px-4" onClick={() => setStep(3)}>
              Pay with Paystack →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Pay */}
      {step === 3 && !paid && (
        <div>
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
            <div className="text-center mb-3">
              <div className="tf-paystack-badge mb-1">💳 PAYSTACK</div>
              <small className="text-muted">Secure Payment Gateway</small>
            </div>
            <div className="text-center bg-light rounded-3 p-3 mb-3">
              <small className="text-muted d-block">Amount to Pay</small>
              <span className="tf-info-price-big fs-1">₵{turf.pricePerHour}.00</span>
            </div>
            <div className="d-flex flex-column gap-2 mb-3">
              <input className="form-control" placeholder="Card Number" defaultValue="4084 0841 0841 0841" />
              <div className="d-flex gap-2">
                <input className="form-control" placeholder="MM/YY" defaultValue="12/26" />
                <input className="form-control" placeholder="CVV"   defaultValue="408" />
              </div>
              <input className="form-control" placeholder="Cardholder Name" value={info.name} readOnly />
            </div>
            <div className="d-flex flex-wrap gap-2 justify-content-center mb-3">
              {['Visa', 'MasterCard', 'MTN MoMo', 'Vodafone Cash'].map(m => (
                <span key={m} className="tf-badge tf-badge-cyan">{m}</span>
              ))}
            </div>
            <button className="btn btn-primary w-100 fw-bold py-2 fs-6" onClick={pay} disabled={paying}>
              {paying ? '⏳ Processing…' : `Pay ₵${turf.pricePerHour}.00 Now`}
            </button>
            {paying && (
              <div className="tf-progress-track mt-2">
                <div className="tf-progress-fill tf-progress-low" style={{ width: '70%' }} />
              </div>
            )}
          </div>
          <p className="text-center text-muted small">
            <i className="bi bi-lock-fill me-1"></i>256-bit SSL · Paystack certified
          </p>
        </div>
      )}

      {/* Success */}
      {paid && (
        <div className="text-center py-5 tf-animate-in">
          <div className="display-1 mb-3">🎉</div>
          <h3 className="font-condensed fw-bolder text-primary mb-1">BOOKING CONFIRMED!</h3>
          <p className="text-muted mb-4">Your slot is secured. See you on the turf!</p>
          <div className="card border-0 shadow-sm rounded-4 p-3 text-start mb-4">
            {[
              ['Booking ID', `BK${Date.now().toString().slice(-6)}`],
              ['Turf',       turf.name],
              ['Time',       slot.label],
              ['Paid',       `₵${turf.pricePerHour}.00`],
            ].map(([k, v]) => (
              <div key={k} className="tf-divider-row">
                <span className="text-muted">{k}</span>
                <span className="fw-bold">{v}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-outline-primary fw-bold px-4" onClick={onBack}>
            <i className="bi bi-house-fill me-2"></i>Back to Home
          </button>
        </div>
      )}
    </div>
  )
}
