import { Link, useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import axios from "axios";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export default function ResetPassword() {
  const [newPassword, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { token } = useParams();
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API}/users/reset-password`, {
        token,
        newPassword,
      });

      setMessage(res?.data?.message);
      setPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Something went wrong");
      console.log(err);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      
      {/* Logo */}
      <div className="text-center mb-4">
        <div className="tf-auth-logo"><img src="/assets/img/logo/logo.png" alt="turfarea" /> </div>
        <div className="tf-brand-title font-condensed fs-2">TURFARENA</div>
        <div className="tf-brand-sub">Accra Metropolitan Assembly</div>
      </div>

      <div className="card border-0 shadow-lg rounded-4 p-4">
        <form onSubmit={handleSubmit}>
          <h3 className="mb-3 text-center fw-bold">Set New Password</h3>

          <div className="input-group mb-3">
            <input
              value={newPassword}
              type={showPassword ? "text" : "password"}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-control"
              placeholder="Enter password"
            />

            <span
              className="input-group-text"
              style={{ cursor: "pointer" }}
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
            </span>
          </div>

          <button className="btn btn-primary w-100">
            Submit
          </button>
        </form>
        <p className="text-info fw-bold text-center mt-2">{message}</p>
      </div>
    </div>
  );
}