import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AppSpinner from './AppSpinner';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export default function LostPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(0); // seconds remaining
  const [disabled, setDisabled] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Countdown effect
  useEffect(() => {
    if (timer <= 0) {
      setDisabled(false);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timer > 0]); // only re-run when crossing the 0 boundary, not every second

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || isSending || disabled) return;
    setMessage("");
    setIsSending(true);
    try {
      const res = await axios.post(`${API}/users/forgot-password`, { email });
      setMessage(res?.data?.message || "If that email exists, a reset link has been sent.");

      const cooldownMinutes = res.data?.minutesLeft || 1;
      setTimer(cooldownMinutes * 60);
      setDisabled(true);
    } catch (err) {
      if (err.response?.status === 429) {
        const timeLeft = err.response?.data?.minutesLeft || 1;
        setMessage(err.response?.data?.message || `Please wait before retrying.`);
        setTimer(timeLeft * 60);
        setDisabled(true);
      } else {
        setMessage(err?.response?.data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <div className="text-center mb-4">
        <div className="tf-auth-logo">
          <img src="/assets/img/logo/logo.png" alt="TurfArena logo" />
        </div>
        <div className="tf-brand-title font-condensed fs-2">TURFARENA</div>
        <div className="tf-brand-sub">Dome Kwabenya & Ayawaso West Constituency</div>
      </div>

      <div className="card border-0 shadow-lg rounded-4 p-4">
        <h3 className="mb-3 text-center fw-bold">Reset Password</h3>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="lostpw-email" className="visually-hidden">Email</label>
          <input
            id="lostpw-email"
            value={email}
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-control mb-3"
            placeholder="Enter your email"
            disabled={disabled || isSending}
            autoComplete="email"
          />

          <button
            type="submit"
            className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
            disabled={disabled || isSending || !email}
          >
            {isSending && <AppSpinner small color="#fff" />}
            {isSending ? "Sending..." : disabled ? "Please wait" : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <p role="status" className="mt-3 mb-0 text-center">{message}</p>
        )}
        {timer > 0 && (
          <p className="text-center text-muted mb-0">Try again in: {formatTime(timer)}</p>
        )}
      </div>

      <div className="text-center mt-3 fw-bold">
        <Link to="/">← Go back to home</Link>
      </div>
    </div>
  );
}