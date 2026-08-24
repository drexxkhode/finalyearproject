import { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_URL || "http://localhost:5000";

const MIN_LENGTH = 8;

const ResetPassword = () => {
  const [newPassword, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { token } = useParams();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null); // "success" | "error" | null
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    if (!newPassword || newPassword.length < MIN_LENGTH) {
      return `Password must be at least ${MIN_LENGTH} characters.`;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return "Password must include at least one uppercase letter and one number.";
    }
    if (newPassword !== confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || redirecting) return;

    const validationError = validate();
    if (validationError) {
      setStatus("error");
      setMessage(validationError);
      return;
    }

    setSubmitting(true);
    setStatus(null);
    setMessage("");

    try {
      const res = await axios.post(`${API}/api/auth/reset-password`, {
        token,
        newPassword,
      });

      setStatus("success");
      setMessage(res?.data?.message || "Password reset successful!");
      setPassword("");
      setConfirmPassword("");
      setRedirecting(true);

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      setStatus("error");
      setMessage(
        err?.response?.data?.message ||
          "Something went wrong. Your reset link may have expired — please request a new one."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-xl-4 col-lg-5 col-sm-6 col-12">
          <div className="my-5">
            <div className="border rounded-2 p-4 mt-5">
              <div className="login-form">
                <a href="/" className="mb-2 d-flex">
                  <img
                    src="/assets/images/admin/logo.png"
                    className="img-fluid login-logo"
                    alt="Turfarena Admin Dashboard"
                  />
                </a>
                <h5 className="fw-light mb-4 lh-2">
                  In order to complete your password reset, please enter a
                  new password to finish the password resetting process.
                </h5>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      New Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        className="form-control"
                        placeholder="Password"
                        value={newPassword}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={submitting || redirecting}
                        autoFocus
                        required
                      />
                      <span
                        className="input-group-text"
                        role="button"
                        tabIndex={0}
                        style={{ cursor: "pointer" }}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        <i
                          className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                        ></i>
                      </span>
                    </div>
                    <div className="form-text">
                      At least {MIN_LENGTH} characters, with one uppercase
                      letter and one number.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        className="form-control"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={submitting || redirecting}
                        required
                      />
                      <span
                        className="input-group-text"
                        role="button"
                        tabIndex={0}
                        style={{ cursor: "pointer" }}
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        <i
                          className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}
                        ></i>
                      </span>
                    </div>
                  </div>

                  {message && (
                    <p
                      className={`fw-bold mt-2 ${
                        status === "success" ? "text-success" : "text-danger"
                      }`}
                      role="alert"
                    >
                      {message}
                      {redirecting && " Redirecting to login…"}
                    </p>
                  )}

                  <div className="d-grid py-3 mt-2">
                    <button
                      type="submit"
                      className="btn btn-lg btn-primary d-flex align-items-center justify-content-center gap-2"
                      disabled={submitting || redirecting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm" />
                          Resetting…
                        </>
                      ) : redirecting ? (
                        "Redirecting…"
                      ) : (
                        "Submit"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;