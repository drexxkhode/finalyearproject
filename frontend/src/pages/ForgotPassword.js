import axios from "axios";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";

const API = process.env.REACT_APP_URL || "http://localhost:5000";

const ForgotPassword = () => {
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
        `${API}/api/auth/forgot-password`,
        { email },
      );
      setMessage(res?.data?.message);

      // Start timer after sending email
      const cooldownMinutes = res?.data?.minutesLeft || 1; // you can have server return this
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
    <>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-4 col-lg-5 col-sm-6 col-12">
            <div className="my-5">
              <div className="border rounded-2 p-4 mt-5">
                <div className="login-form">
                  <Link to={"/login"}  className="mb-4 d-flex">
                    <img
                      src="/assets/images/logo.svg"
                      className="img-fluid login-logo"
                      alt="Earth Admin Dashboard"
                    />
                  </Link>
                  <h5 className="fw-light mb-5 lh-2">
                    In order to access your account, please enter the email you
                    provided during the registration process.
                  </h5>
                  <div className="mb-3">
                    <label className="form-label">Your Email</label>
                    <form onSubmit={handleSubmit}>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="form-control"
                        disabled={disabled}
                      />
                      <div className="d-grid py-3 mt-2">
                        <button
                          type="submit"
                          disabled={send}
                          className="btn btn-lg btn-primary d-flex align-items-center justify-content-center gap-2"
                        >
                          {send && <ClipLoader color="#fff" size={18} />}
                          {send ? "Sending..." : "Send Reset Link"}
                        </button>
                      </div>
                    </form>
                    <p>{message}</p>
                    {timer > 0 && <p>Try again in: {formatTime(timer)}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
