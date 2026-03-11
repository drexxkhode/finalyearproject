import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const API = process.env.REACT_APP_URL || "http://localhost:5000";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(`${API}/api/auth/login`, {
        email,
        password,
      });

      // ✅ store token
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data?.user));
      // ✅ redirect after login
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-4 col-lg-5 col-sm-6 col-12">
            <form onSubmit={handleSubmit} className="my-5">
              <div className="border rounded-2 p-4 mt-5">
                <div className="login-form">
                  <a href="#" className="mb-4 d-flex">
                    <img
                      src="assets/images/logo.svg"
                      className="img-fluid login-logo"
                      alt="Earth Admin Dashboard"
                    />
                  </a>
                  <h5 className="fw-light mb-5">
                    Sign in to access dashboard.
                  </h5>
                  <div className="mb-3">
                    <label className="form-label">Your Email</label>
                    <div className="input-group"></div>
                    <input
                      className="form-control"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Your Password
                    </label>

                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        className="form-control"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />

                      <span
                        className="input-group-text"
                        style={{ cursor: "pointer" }}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        <i
                          className={`bi ${
                            showPassword ? "bi-eye-slash" : "bi-eye"
                          }`}
                        ></i>
                      </span>
                    </div>
                  </div>
                  {error && (
                    <p
                      className="error"
                      style={{ color: "#a13434", fontSize: "18px" }}
                    >
                      {error}
                    </p>
                  )}
                  <div className="d-flex align-items-center justify-content-end">
                    <Link
                      to={"/forgot-password"}
                      className="text-blue text-decoration-underline"
                    >
                      Lost password?
                    </Link>
                  </div>
                  <div className="d-grid py-3 mt-2">
                    <button type="submit" className="btn btn-lg btn-primary">
                      Login
                    </button>
                  </div>
                  <ToastContainer />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
export default Login;
