import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

// ── OTP input — 6 individual digit boxes with auto-focus ────────────────────
function OtpInput({ otp, setOtp, onComplete }) {
  const inputRefs = useRef([]);

  const handleChange = (idx, val) => {
    // Accept only digits, take last char if pasted
    const digit = val.replace(/\D/g, "").slice(-1)
    const next  = [...otp]
    next[idx]   = digit
    setOtp(next)
    // Auto-advance focus
    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus()
    }
    // Auto-submit when all 6 filled
    if (digit && next.every(d => d !== "")) {
      onComplete?.()
    }
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  // Handle paste — spread digits across boxes
  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return
    const next = [...otp]
    pasted.split("").forEach((d, i) => { if (i < 6) next[i] = d })
    setOtp(next)
    // Focus last filled box
    const lastIdx = Math.min(pasted.length, 5)
    inputRefs.current[lastIdx]?.focus()
    if (pasted.length === 6) onComplete?.()
  }

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 4 }}>
      {otp.map((digit, idx) => (
        <input
          key={idx}
          ref={el => inputRefs.current[idx] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKeyDown(idx, e)}
          onPaste={idx === 0 ? handlePaste : undefined}
          style={{
            width: 44, height: 52,
            textAlign: "center",
            fontSize: 22, fontWeight: 800,
            border: `2px solid ${digit ? "#0d6efd" : "#dee2e6"}`,
            borderRadius: 10,
            outline: "none",
            color: "#1a1a2e",
            background: digit ? "rgba(13,110,253,.05)" : "#fff",
            transition: "border-color .15s, background .15s",
            caretColor: "transparent",
          }}
          onFocus={e => e.target.style.borderColor = "#0d6efd"}
          onBlur={e  => e.target.style.borderColor = digit ? "#0d6efd" : "#dee2e6"}
        />
      ))}
    </div>
  )
}

export default function AuthScreen({ onSuccess, isModal = false, onClose, startOnVerify = false }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode,    setMode]    = useState("login");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");
  // After register — show "check your email" screen
  // startOnVerify = true when opened from navbar banner (user already registered)
  const [verifyPending, setVerifyPending] = useState(startOnVerify);
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') ?? '{}') } catch { return {} } })()
  const [registeredEmail, setRegisteredEmail] = useState(startOnVerify ? (storedUser.email ?? '') : '');
  // OTP input — 6 individual digit boxes
  const [otp,            setOtp]            = useState(["", "", "", "", "", ""]);
  const [otpLoading,     setOtpLoading]     = useState(false);
  const [otpErr,         setOtpErr]         = useState("");
  const [otpSuccess,     setOtpSuccess]     = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);  // seconds

  const [showLoginPw,    setShowLoginPw]    = useState(false);
  const [showRegisterPw, setShowRegisterPw] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "", email: "", phone: "", password: "", confirm: "",
  });

  // Lock body scroll when shown as modal
  useEffect(() => {
    if (!isModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isModal]);

  const switchMode = (m) => {
    setMode(m); setErr("");
    setLoginForm({ email: "", password: "" });
    setRegisterForm({ name: "", email: "", phone: "", password: "", confirm: "" });
  };

  // Auto-clear error after 4s
  useEffect(() => {
    if (!err) return;
    const t = setTimeout(() => setErr(""), 4000);
    return () => clearTimeout(t);
  }, [err]);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  /* ── LOGIN ── */
  const submitLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!loginForm.email || !loginForm.password)
      return setErr("Email and password required.");
    setLoading(true); setErr("");
    try {
      const user = await login(loginForm);
      onSuccess?.(user);
      if (isModal) onClose?.();
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── REGISTER ── */
  const submitRegister = async (e) => {
    e.preventDefault();
    if (loading) return;
    const { name, email, phone, password, confirm } = registerForm;
    if (!name || !email || !phone || !password)
      return setErr("All fields are required.");
    if (password !== confirm)
      return setErr("Passwords do not match.");
    // phone validation — was broken before (checked registerForm.phone which was undefined)
    if (!/^[0-9]{9,15}$/.test(phone))
      return setErr("Enter a valid phone number (digits only).");

    setLoading(true); setErr("");
    try {
      const res = await register({ name, email, phone, password });
      // Auto-logged in (token stored) but email_verified = 0
      // Show OTP screen — do NOT call onSuccess yet.
      // onSuccess is called only after OTP is verified so the
      // app doesn't grant full access before the user verifies.
      setRegisteredEmail(email);
      setVerifyPending(true);
    } catch (e) {
      setErr(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── RESEND VERIFICATION ── */
  const resendVerification = async () => {
    if (resendCooldown > 0) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/users/resend-verification`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOtp(["", "", "", "", "", ""])   // clear boxes so user types fresh code
      setOtpErr("")
      setResendCooldown(120)             // 2 min cooldown
    } catch (e) {
      const retryAfter = e.response?.data?.retryAfter
      if (retryAfter) setResendCooldown(retryAfter)
      setOtpErr(e.response?.data?.message || "Could not resend. Please try again.");
    }
  };

  /* ── OTP SUBMIT ── */
  const submitOtp = async () => {
    const code = otp.join("")
    if (code.length !== 6) { setOtpErr("Please enter all 6 digits."); return }
    setOtpLoading(true); setOtpErr("")
    try {
      const token = localStorage.getItem("token")
      const res = await axios.post(`${API}/users/verify-otp`,
        { otp: code },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Update stored token so email_verified = 1 takes effect immediately
      if (res.data.token) {
        localStorage.setItem("token", res.data.token)
        // Update stored user too
        const stored = JSON.parse(localStorage.getItem("user") ?? "{}")
        localStorage.setItem("user", JSON.stringify({ ...stored, email_verified: 1 }))
      }
      setOtpSuccess(true)
      // Now notify the parent — user is fully authenticated and verified
      // Build the updated user object from localStorage
      const verifiedUser = JSON.parse(localStorage.getItem("user") ?? "{}")
      onSuccess?.(verifiedUser)
    } catch (e) {
      setOtpErr(e.response?.data?.message ?? "Invalid code. Please try again.")
    } finally {
      setOtpLoading(false)
    }
  }

  /* ── VERIFY PENDING SCREEN ── */
  const verifyScreen = (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      {otpSuccess ? (
        /* ── Success state ── */
        <>
          <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
          <h5 className="fw-bolder mb-2">Email Verified!</h5>
          <p className="text-muted small mb-3">
            Your account is fully activated. You can now complete bookings.
          </p>
          {isModal && (
            <button className="btn btn-primary fw-bold w-100" onClick={onClose}>
              Continue →
            </button>
          )}
        </>
      ) : (
        /* ── OTP entry state ── */
        <>
          <div style={{ fontSize: 48, marginBottom: 10 }}>📧</div>
          <h5 className="fw-bolder mb-1">Enter Verification Code</h5>
          <p className="text-muted small mb-3">
            We sent a 6-digit code to<br />
            <strong>{registeredEmail}</strong>
          </p>

          {/* 6 individual digit boxes */}
          <OtpInput otp={otp} setOtp={setOtp} onComplete={submitOtp} />

          {otpErr && (
            <div className="alert alert-danger py-2 small mt-2 mb-0">{otpErr}</div>
          )}

          <button
            className="btn btn-primary fw-bold w-100 mt-3 py-2"
            onClick={submitOtp}
            disabled={otpLoading || otp.join("").length !== 6}
          >
            {otpLoading
              ? <><span className="spinner-border spinner-border-sm me-2" />Verifying…</>
              : "Verify Code →"
            }
          </button>

          <div className="d-flex align-items-center justify-content-center gap-2 mt-3">
            <span className="text-muted small">Didn't receive it?</span>
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-primary small fw-bold"
              onClick={resendVerification}
              disabled={resendCooldown > 0}
              style={{ textDecoration: "underline", opacity: resendCooldown > 0 ? 0.5 : 1 }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </div>

          <p className="text-muted" style={{ fontSize: 11, marginTop: 8 }}>
            Code expires in 15 minutes
          </p>
        </>
      )}
    </div>
  );

  /* ── CONTENT ── */
  const content = (
    <div className={isModal ? "" : "tf-auth-overlay"}>
      <div className="w-100" style={{ maxWidth: 420, margin: "0 auto" }}>

        {/* Logo — only shown on full page */}
        {!isModal && (
          <div className="text-center mb-4">
            <div className="tf-auth-logo">
              <img src="/assets/img/logo/logo.png" alt="logo" />
            </div>
            <div className="tf-brand-title font-condensed fs-2">TURFARENA</div>
            <div className="tf-brand-sub">Accra Metropolitan Assembly</div>
          </div>
        )}

        <div className={`card border-0 rounded-4 p-4 ${isModal ? "" : "shadow-lg"}`}>

          {/* Modal header with close */}
          {isModal && (
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bolder" style={{ fontSize: 16 }}>
                <i className="bi bi-person-circle me-2 text-primary"></i>
                {verifyPending ? "Account Created" : mode === "login" ? "Sign In" : "Create Account"}
              </div>
              {onClose && (
                <button onClick={onClose} style={{
                  border: "none", background: "none", fontSize: 18,
                  cursor: "pointer", color: "#6c757d", lineHeight: 1,
                }}>✕</button>
              )}
            </div>
          )}

          {/* Verify pending screen */}
          {verifyPending ? verifyScreen : (
            <>
              {/* Toggle */}
              <div className="tf-auth-toggle mb-3">
                <button
                  type="button"
                  className={`tf-auth-toggle-btn ${mode === "login" ? "active" : ""}`}
                  onClick={() => switchMode("login")}
                >
                  <i className="bi bi-key-fill me-1"></i>Sign In
                </button>
                <button
                  type="button"
                  className={`tf-auth-toggle-btn ${mode === "register" ? "active" : ""}`}
                  onClick={() => switchMode("register")}
                >
                  <i className="bi bi-person-plus-fill me-1"></i>Register
                </button>
              </div>

              {err && (
                <div className="alert alert-danger py-2 small mb-3">{err}</div>
              )}

              {/* LOGIN FORM */}
              {mode === "login" && (
                <form onSubmit={submitLogin}>
                  <div className="d-flex flex-column gap-2">
                    <input className="form-control" type="email" placeholder="Email Address"
                      autoComplete="email" value={loginForm.email}
                      onChange={e => { setErr(""); setLoginForm(p => ({ ...p, email: e.target.value })) }}
                    />
                    <div className="input-group">
                      <input className="form-control"
                        type={showLoginPw ? "text" : "password"}
                        placeholder="Password" autoComplete="current-password"
                        value={loginForm.password}
                        onChange={e => { setErr(""); setLoginForm(p => ({ ...p, password: e.target.value })) }}
                      />
                      <span className="input-group-text" style={{ cursor: "pointer" }}
                        onClick={() => setShowLoginPw(p => !p)}>
                        <i className={`bi ${showLoginPw ? "bi-eye-slash" : "bi-eye"}`}></i>
                      </span>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end mt-2">
                    {isModal
                      ? <button type="button" className="btn btn-link btn-sm p-0 text-primary"
                          onClick={() => { onClose?.(); navigate('/lost-password') }}
                          style={{ textDecoration: "underline", fontSize: 13 }}>
                          Lost password?
                        </button>
                      : <Link to="/lost-password" className="text-primary text-decoration-underline small">
                          Lost password?
                        </Link>
                    }
                  </div>
                  <button type="submit" className="btn btn-primary w-100 fw-bold mt-3 py-2"
                    disabled={loading}>
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-2" />Signing in…</>
                      : "Sign In →"
                    }
                  </button>
                  <p className="text-center text-muted small mt-3 mb-0">
                    No account?{" "}
                    <span className="text-primary fw-bold" role="button"
                      onClick={() => switchMode("register")}>
                      Register here
                    </span>
                  </p>
                </form>
              )}

              {/* REGISTER FORM */}
              {mode === "register" && (
                <form onSubmit={submitRegister}>
                  <div className="d-flex flex-column gap-2">
                    <input className="form-control" placeholder="Full Name"
                      autoComplete="name" value={registerForm.name}
                      onChange={e => { setErr(""); setRegisterForm(p => ({ ...p, name: e.target.value })) }}
                    />
                    <input className="form-control" type="email" placeholder="Email Address"
                      autoComplete="email" value={registerForm.email}
                      onChange={e => { setErr(""); setRegisterForm(p => ({ ...p, email: e.target.value })) }}
                    />
                    <input className="form-control" placeholder="Phone Number"
                      autoComplete="tel" value={registerForm.phone}
                      onChange={e => { setErr(""); setRegisterForm(p => ({ ...p, phone: e.target.value })) }}
                    />
                    <div className="input-group">
                      <input className="form-control"
                        type={showRegisterPw ? "text" : "password"}
                        placeholder="Password" autoComplete="new-password"
                        value={registerForm.password}
                        onChange={e => { setErr(""); setRegisterForm(p => ({ ...p, password: e.target.value })) }}
                      />
                      <span className="input-group-text" style={{ cursor: "pointer" }}
                        onClick={() => setShowRegisterPw(p => !p)}>
                        <i className={`bi ${showRegisterPw ? "bi-eye-slash" : "bi-eye"}`}></i>
                      </span>
                    </div>
                    <input className="form-control" type="password"
                      placeholder="Confirm Password" autoComplete="new-password"
                      value={registerForm.confirm}
                      onChange={e => { setErr(""); setRegisterForm(p => ({ ...p, confirm: e.target.value })) }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-100 fw-bold mt-3 py-2"
                    disabled={loading}>
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-2" />Registering…</>
                      : "Create Account →"
                    }
                  </button>
                  <p className="text-center text-muted small mt-3 mb-0">
                    Already have an account?{" "}
                    <span className="text-primary fw-bold" role="button"
                      onClick={() => switchMode("login")}>
                      Sign in
                    </span>
                  </p>
                </form>
              )}
            </>
          )}
        </div>

        {!isModal && (
          <p className="text-center text-muted small mt-3">
            <i className="bi bi-lock-fill me-1"></i>
            Your data is secure ·
            <span className="text-success fw-bold"> Turf</span>
            <span className="text-primary fw-bold">Arena</span> Certified Platform
          </p>
        )}
      </div>
    </div>
  );

  // When used as modal — render as bottom sheet portal (same pattern as cancel modal)
  if (isModal) {
    return createPortal(
      <div
        onClick={e => { if (e.target === e.currentTarget) onClose?.() }}
        className="tf-modal-overlay"
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(10,10,20,.75)",
          display: "flex", flexDirection: "column",
          justifyContent: "flex-end", alignItems: "stretch",
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="tf-modal-sheet"
          style={{
            background: "#fff",
            borderRadius: "20px 20px 0 0",
            boxShadow: "0 -4px 32px rgba(0,0,0,.22)",
            maxHeight: "92vh",
            overflowY: "auto",
            padding: "16px 20px 32px",
            animation: "tfSlideUp .28s cubic-bezier(.32,1,.32,1)",
          }}
        >
          <div className="tf-modal-handle" style={{
            width: 36, height: 4, borderRadius: 2,
            background: "#dee2e6", margin: "0 auto 16px",
          }} />
          {content}
        </div>
        <style>{`@keyframes tfSlideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>
      </div>,
      document.body
    );
  }

  return content;
}