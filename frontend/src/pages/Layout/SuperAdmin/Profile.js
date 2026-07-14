import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.REACT_APP_URL || "http://localhost:5000";

const SuperAdminProfile = () => {
  const { id } = useParams();
  const [admin, setAdmin] = useState({});

  const fetchDetails = async (adminId) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/api/super/details/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmin(data);
    } catch (err) {
      console.error("Failed to fetch super admin:", err);
    }
  };

  function formatDate(timestamp) {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (id) {
      fetchDetails(id);
    } else {
      const getMe = async () => {
        try {
          const { data } = await axios.get(`${API}/api/super/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAdmin(data);
        } catch (err) {
          console.error("Failed to fetch logged user:", err);
        }
      };
      getMe();
    }
  }, [id]);

  const fullName =
    `${admin.firstName || ""} ${admin.middleName || ""} ${admin.lastName || ""}`
      .trim().replace(/\s+/g, " ");

  const AVATAR = "/assets/images/admin/avatar.webp";

  return (
    <div className="container my-5">
      <div className="profile-header mb-4">
        <div className="d-flex align-items-center gap-4">
          <img
            src={admin.photo || AVATAR}
            className="profile-img"
            alt="Profile"
            onError={(e) => { e.target.src = AVATAR; }}
          />
          <div>
            <h2 className="fw-bold mb-1">{fullName}</h2>
            <span className="badge bg-primary rounded-pill px-3">Super Admin</span>
          </div>
        </div>
      </div>

      <div className="stats-wrapper">
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card stat-card">
              <div className="stat-icon text-primary"><i className="bi bi-person-vcard"></i></div>
              <small className="text-muted">Contact</small>
              <h6 className="fw-bold mt-2">{admin.contact || "N/A"}</h6>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card stat-card">
              <div className="stat-icon text-success"><i className="bi bi-envelope-at"></i></div>
              <small className="text-muted">Email</small>
              <h6 className="fw-bold mt-2">{admin.email || "N/A"}</h6>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card stat-card">
              <div className="stat-icon text-danger"><i className="bi bi-calendar-plus"></i></div>
              <small className="text-muted">Enrollment Date</small>
              <h6 className="fw-bold mt-2">{formatDate(admin.created_at) || "N/A"}</h6>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminProfile;