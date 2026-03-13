import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"

const API = process.env.REACT_APP_URL || "http://localhost:5000"

const Login = () => {
  const [email,        setEmail]        = useState("")
  const [password,     setPassword]     = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState("")
  const [loading,      setLoading]      = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password })
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("user",  JSON.stringify(res.data?.user))
      navigate("/", { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-xl-4 col-lg-5 col-sm-6 col-12">
          <form onSubmit={handleSubmit} className="my-5">
            <div className="border rounded-2 p-4 mt-5">
              <div className="login-form">

                <a href="#" className="mb-4 d-flex">
                  <img src="/assets/images/logo.svg"
                    className="img-fluid login-logo"
                    alt="Admin Dashboard" />
                </a>

                <h5 className="fw-light mb-5">Sign in to access dashboard.</h5>

                <div className="mb-3">
                  <label className="form-label">Your Email</label>
                  <input className="form-control" type="email" placeholder="Email"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Your Password</label>
                  <div className="input-group">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <span className="input-group-text" style={{cursor:"pointer"}}
                      onClick={() => setShowPassword(p => !p)}>
                      <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger py-2 px-3 mb-3" style={{fontSize:14}}>
                    <i className="bi bi-exclamation-circle me-2"></i>{error}
                  </div>
                )}

                <div className="d-flex align-items-center justify-content-end mb-2">
                  <Link to="/forgot-password" className="text-decoration-underline" style={{fontSize:14}}>
                    Lost password?
                  </Link>
                </div>

                <div className="d-grid py-2">
                  <button type="submit" className="btn btn-lg btn-primary" disabled={loading}>
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-2"/>Signing in…</>
                      : "Login"
                    }
                  </button>
                </div>

              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login