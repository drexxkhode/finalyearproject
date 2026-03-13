import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function AuthScreen({ onSuccess }) {
  const { login, register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const [mode, setMode] = useState("login");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });

  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  const switchMode = (m) => {
    setMode(m);
    setErr("");
    setOk(false);
  };

  /* LOGIN INPUT */
  const handleLogin = (field) => (e) => {
    setErr("");
    setLoginForm((p) => ({ ...p, [field]: e.target.value }));
  };

  /* REGISTER INPUT */
  const handleRegister = (field) => (e) => {
    setErr("");
    setRegisterForm((p) => ({ ...p, [field]: e.target.value }));
  };

  /* LOGIN SUBMIT */
  const submitLogin = async (e) => {
    e.preventDefault();

    if (!loginForm.email || !loginForm.password) {
      return setErr("Email and password required.");
    }

    try {
      setErr("");
      const user = await login(loginForm);
      onSuccess(user);
    } catch (e) {
      setErr(e.message || "Login failed");
    }
  };

  /* REGISTER SUBMIT */
  const submitRegister = async (e) => {
    e.preventDefault();

    if (
      !registerForm.name ||
      !registerForm.email ||
      !registerForm.phone ||
      !registerForm.password
    ) {
      return setErr("All fields are required.");
    }

    if (registerForm.password !== registerForm.confirm) {
      return setErr("Passwords do not match.");
    }

    if (registerForm.password.length < 6) {
      return setErr("Password must be at least 6 characters.");
    }

    try {
      setErr("");

      await register(registerForm);

      setOk(true);

      setTimeout(() => {
        setOk(false);
        setMode("login");
      }, 1500);
    } catch (e) {
      setErr(e.message || "Registration failed");
    }
  };

  /* AUTO CLEAR ERROR */
  useEffect(() => {
    if (err) {
      const timer = setTimeout(() => setErr(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [err]);

  return (
    <div className="tf-auth-overlay">
      <div className="w-100" style={{ maxWidth: 420 }}>
        {/* Logo */}
        <div className="text-center mb-4">
          <div className="tf-auth-logo"><img src="/assets/img/logo/logo.png" /></div>
          <div className="tf-brand-title font-condensed fs-2">TURFARENA</div>
          <div className="tf-brand-sub">Accra Metropolitan Assembly</div>
        </div>

        <div className="card border-0 shadow-lg rounded-4 p-4">
          {/* Toggle */}
          <div className="tf-auth-toggle">
            <button
              type="button"
              className={`tf-auth-toggle-btn ${
                mode === "login" ? "active" : ""
              }`}
              onClick={() => switchMode("login")}
            >
              <i className="bi bi-key-fill me-1"></i>Sign In
            </button>

            <button
              type="button"
              className={`tf-auth-toggle-btn ${
                mode === "register" ? "active" : ""
              }`}
              onClick={() => switchMode("register")}
            >
              <i className="bi bi-person-plus-fill me-1"></i>Register
            </button>
          </div>

          {ok && (
            <div className="alert alert-success py-2 text-center fw-bold">
              ✅ Account created! Redirecting…
            </div>
          )}

          {err && <div className="alert alert-danger py-2 small">{err}</div>}

          {/* LOGIN */}
          {mode === "login" && (
            <form onSubmit={submitLogin}>
              <div className="d-flex flex-column gap-2">
                <input
                  className="form-control"
                  type="email"
                  placeholder="Email Address"
                  value={loginForm.email}
                  onChange={handleLogin("email")}
                />

                <div className="input-group">
                  <input
                    className="form-control"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={handleLogin("password")}
                  />
                  <span
                    className="input-group-text"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <i
                      className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                    ></i>
                  </span>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-2">
                <Link
                  to="/lost-password"
                  className="text-primary text-decoration-underline small"
                >
                  Lost password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 fw-bold mt-3 py-2"
              >
                Sign In →
              </button>

              <p className="text-center text-muted small mt-3 mb-0">
                No account?{" "}
                <span
                  className="text-primary fw-bold"
                  role="button"
                  onClick={() => switchMode("register")}
                >
                  Register here
                </span>
              </p>
            </form>
          )}

          {/* REGISTER */}
          {mode === "register" && (
            <form onSubmit={submitRegister}>
              <div className="d-flex flex-column gap-2">
                <input
                  className="form-control"
                  placeholder="Full Name"
                  value={registerForm.name}
                  onChange={handleRegister("name")}
                />

                <input
                  className="form-control"
                  type="email"
                  placeholder="Email Address"
                  value={registerForm.email}
                  onChange={handleRegister("email")}
                />

                <input
                  className="form-control"
                  placeholder="Phone Number"
                  value={registerForm.phone}
                  onChange={handleRegister("phone")}
                />

                <div className="input-group">
                  <input
                    className="form-control"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={registerForm.password}
                    onChange={handleRegister("password")}
                  />{" "}
                  <span
                    className="input-group-text"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <i
                      className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                    ></i>
                  </span>
                </div>

                <input
                  className="form-control"
                  type="password"
                  placeholder="Confirm Password"
                  value={registerForm.confirm}
                  onChange={handleRegister("confirm")}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 fw-bold mt-3 py-2"
              >
                Create Account →
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-muted small mt-3">
          <i className="bi bi-lock-fill me-1"></i>Your data is secure ·
          <span className="text-success fw-bold"> Turf</span>
          <span className="text-primary fw-bold">Arena</span> Certified Platform
        </p>
      </div>
    </div>
  );
}
