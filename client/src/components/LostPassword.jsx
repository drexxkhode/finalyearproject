import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import axios from 'axios';

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
export default function LostPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(0); // seconds remaining
  const [disabled, setDisabled] = useState(false);
  const [send, setIsSending] = useState(false);

  // Countdown effect
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setDisabled(false);
      setMessage("");
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setMessage("");
    setIsSending(true);
    try {
      const res = await axios.post(
        `${API}/users/forgot-password`,
        { email },
      );
      setMessage(res?.data?.message);

      // Start timer after sending email
      const cooldownMinutes = res.data?.minutesLeft || 1; // you can have server return this
      setTimer(cooldownMinutes * 60);
      setDisabled(true);
    } catch (err) {
      if (err.response?.status === 429) {
        // Server returns time left in minutes
        const timeLeft = err.response?.data?.minutesLeft || 1;
        setMessage(err.response?.data?.message);
        setTimer(timeLeft * 60); // convert minutes to seconds
        setDisabled(true);
      } else {
        setMessage(err?.response?.data?.message || "Something went wrong");
        console.log(err);
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
      {/* Logo */}
      <div className="text-center mb-4">
        <div className="tf-auth-logo"><img src="/assets/img/logo/logo.png" /></div>
        <div className="tf-brand-title font-condensed fs-2">TURFARENA</div>
        <div className="tf-brand-sub">Accra Metropolitan Assembly</div>
      </div>
      <div className="card border-0 shadow-lg rounded-4 p-4">
        <h3 className="mb-3 text-center fw-bold">Reset Password</h3>

        <form onSubmit={handleSubmit}>
          <input
          value={email}
          type="email"
          onChange={(e) => setEmail(e.target.value)}
          required
          className="form-control mb-3"
          placeholder="Enter your email"
          disabled={disabled}
        />

        <button className="btn btn-primary w-100">
           {send && <ClipLoader color="#fff" size={18} />}
          {send ? "Sending..." : "Send Reset Link"}
        </button>
        </form>
        <p>{message}</p>
        {timer > 0 && <p>Try again in: {formatTime(timer)}</p>}
      </div>
      <div className="text-center mt-3 fw-bold">
        <Link to="/login">← Back to Login</Link>
      </div>
    </div>
  );
}
