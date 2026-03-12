import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.REACT_APP_URL || "http://localhost:5000";

const Profile = () => {
  const { id } = useParams();
  const [admin, setAdmin] = useState({});

  const fetchDetails = async (adminId) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/api/auth/details/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmin(data);
    } catch (err) {
      console.error("Failed to fetch admin:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (id) {
      fetchDetails(id);
    } else {
      const getMe = async () => {
        try {
          const { data } = await axios.get(`${API}/api/auth/me`, {
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

  // trim + collapse double spaces when middleName is empty
  const fullName = `${admin.firstName || ""} ${admin.middleName || ""} ${admin.lastName || ""}`.trim().replace(/\s+/g, " ");

  const AVATAR = "/assets/images/admin/avatar.webp";

  return (
    <div className="container my-5">
      <div className="profile-header mb-4">
        <div className="camera-btn shadow">
          <i className="bi bi-camera-fill text-black" style={{ fontSize: "1.5rem" }}></i>
        </div>

        <div className="d-flex align-items-center gap-4">
          <img
            src={admin.photo || AVATAR}
            className="profile-img"
            alt="Profile"
            onError={(e) => { e.target.src = AVATAR }}
          />
          <div>
            <h2 className="fw-bold mb-1">{fullName}</h2>
            <p className="mb-2">
              <i className="bi bi-person-badge"></i> Member ID: MEM20260001
            </p>
            <span className="badge bg-success rounded-pill px-3">Active</span>
          </div>
        </div>
      </div>

      <div className="stats-wrapper">
        <div className="row g-4">
          <div className="col-md-3">
            <div className="card stat-card">
              <div className="stat-icon text-primary"><i className="bi bi-person-vcard"></i></div>
              <small className="text-muted">National ID</small>
              <h6 className="fw-bold mt-2">{admin.nationalId || "N/A"}</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card stat-card">
              <div className="stat-icon text-success"><i className="bi bi-percent"></i></div>
              <small className="text-muted">Age</small>
              <h6 className="fw-bold mt-2">
                {admin.dob ? `${new Date().getFullYear() - new Date(admin.dob).getFullYear()} Years` : "N/A"}
              </h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card stat-card">
              <div className="stat-icon text-danger"><i className="bi bi-heart"></i></div>
              <small className="text-muted">Marital Status</small>
              <h6 className="fw-bold mt-2">{admin.maritalStatus || "N/A"}</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card stat-card">
              <div className="stat-icon text-warning"><i className="bi bi-briefcase"></i></div>
              <small className="text-muted">Role</small>
              <h6 className="fw-bold mt-2">{admin.role || "N/A"}</h6>
            </div>
          </div>
        </div>
      </div>

      <hr />

      <div className="card info-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title fw-bold">
            <i className="bi bi-person-lines-fill text-primary"></i> Personal Information
          </h5>
          <Link to={`/edit-details/${admin.id}`} className="btn btn-primary btn-sm ms-auto">
            Edit Details
          </Link>
        </div>
        <div className="row g-4 p-4">
          <div className="col-md-6">
            <div className="info-label">Full Name</div>
            <div className="fw-semibold">{fullName}</div>
          </div>
          <div className="col-md-6">
            <div className="info-label">Date of Birth</div>
            <div className="fw-semibold">{admin.dob ? new Date(admin.dob).toLocaleDateString() : "N/A"}</div>
          </div>
          <div className="col-md-6">
            <div className="info-label">Gender</div>
            <div className="fw-semibold">{admin.gender || "N/A"}</div>
          </div>
          <div className="col-md-6">
            <div className="info-label">Email</div>
            <div className="fw-semibold">{admin.email || "N/A"}</div>
          </div>
          <div className="col-md-6">
            <div className="info-label">Phone</div>
            <div className="fw-semibold">{admin.contact || "N/A"}</div>
          </div>
          <div className="col-md-6">
            <div className="info-label">Address</div>
            <div className="fw-semibold">{admin.address || "N/A"}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;