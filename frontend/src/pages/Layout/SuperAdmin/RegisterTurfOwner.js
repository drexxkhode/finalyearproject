import "../../../components/PreviewGuide.css";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import ClipLoader from "react-spinners/ClipLoader";

const API = process.env.REACT_APP_URL || "http://localhost:5000";

const RegisterTurfOwner = () => {
  const [activeTab, setActiveTab] = useState("oneA");
  const [save, setSave] = useState(false);
  const [errors, setErrors] = useState({});
  const [turfs, setTurfs] = useState([]);

 const initialForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  contact: "",
  password: "12345678",
  role: "",
  turfId: ""
};

  const [formData, setFormData] = useState(initialForm);

  // ------------------- Input Change -------------------
  const handleChange = (e) => {
    const { id, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: files ? files[0] : value,
    }));

    if (errors[id]) {
      setErrors((prev) => ({
        ...prev,
        [id]: "",
      }));
    }
  };


useEffect(() => {
  const fetchTurfs = async () => {
    try {
      const data  = await axios.get(`${API}/api/super/get-turf`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      setTurfs(data.data);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load turfs");
    }
  };

  fetchTurfs();
}, []);

  // ------------------- Validation -------------------
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";

    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required.";

    if (!formData.email.trim()) newErrors.email = "Email is required.";

    if (!formData.contact.trim()) newErrors.contact = "Contact is required.";

    if (!formData.role.trim()) newErrors.role = "Role is required.";

    if (!formData.turfId.trim()) newErrors.turfId = "Turf is required.";

    if (!formData.password.trim())
      newErrors.password = "Password is required.";

    if (formData.contact && !/^\d{10,15}$/.test(formData.contact)) {
      newErrors.contact = "Enter a valid phone number.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length) {
      toast.warning("Please fill all required fields.");
      return false;
    }

    return true;
  };

  // ------------------- Submit -------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSave(true);

      const response = await axios.post(`${API}/api/super/reg-turfowner`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        // Do NOT set Content-Type manually — axios sets multipart/form-data with boundary
      });

      toast.success(response?.data?.message || "Turf Owner Registered successful!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Reset form after success
      setFormData(initialForm);
      setErrors({});
      setActiveTab("oneA");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Turf Owner Registration failed!",
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        },
      );
    } finally {
      setSave(false);
    }
  };

  return (
    <>
      {/* =================== Form =================== */}
      <div className="row gx-3">
        <div className="col-xxl-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="custom-tabs-container">
                <ul className="nav nav-tabs">
                  {[
                    { key: "oneA", label: "General" },
                    { key: "threeA", label: "Other Info" },
                  ].map(({ key, label }) => (
                    <li className="nav-item" key={key}>
                      <button
                        type="button"
                        className={`nav-link ${activeTab === key ? "active" : ""}`}
                        onClick={() => setActiveTab(key)}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>

                <form onSubmit={handleSubmit}>
                  <div className="tab-content">
                    {/* ===== GENERAL ===== */}
                    <div
                      className={`tab-pane ${activeTab === "oneA" ? "show active" : "d-none"}`}
                    >
                      <div className="card mb-3">
                        <div className="card-header">
                          <h5 className="card-title">Registration Details</h5>
                        </div>
                        <div className="card-body">
                          <div className="row gx-3">
                            <div className="col-md-6">
                              <label htmlFor="firstName" className="form-label">
                                First Name
                              </label>
                              <input
                                type="text"
                                id="firstName"
                                className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                                value={formData.firstName}
                                onChange={handleChange}
                              />
                              {errors.firstName && (
                                <div className="invalid-feedback">
                                  {errors.firstName}
                                </div>
                              )}
                            </div>

                            <div className="col-md-6">
                              <label htmlFor="middleName" className="form-label">
                                Middle Name
                              </label>
                              <input
                                type="middleName"
                                id="middleName"
                                placeholder="( Optional )"
                                className={`form-control ${errors.middleName ? "is-invalid" : ""}`}
                                value={formData.middleName}
                                onChange={handleChange}
                              />
                              {errors.middleName && (
                                <div className="invalid-feedback">
                                  {errors.middleName}
                                </div>
                              )}
                            </div>

                            <div className="col-md-6 mt-3">
                              <label htmlFor="lastName" className="form-label">
                                Last Name
                              </label>
                              <input
                                type="text"
                                id="lastName"
                                className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                                value={formData.lastName}
                                onChange={handleChange}
                              />
                              {errors.lastName && (
                                <div className="invalid-feedback">
                                  {errors.lastName}
                                </div>
                              )}
                            </div>

                            <div className="col-md-6 mt-3">
                              <label htmlFor="email" className="form-label">
                                Email
                              </label>
                              <input
                                type="text"
                                id="email"
                                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                                value={formData.email}
                                onChange={handleChange}
                              />
                              {errors.email && (
                                <div className="invalid-feedback">
                                  {errors.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2 justify-content-end p-3">
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => setActiveTab("threeA")}
                          >
                            Next <i className="bi bi-arrow-right-circle" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ===== SECURITY & PHOTO ===== */}
                    <div
                      className={`tab-pane ${activeTab === "threeA" ? "show active" : "d-none"}`}
                    >
                      <div className="card mb-3">
                        <div className="card-header">
                          <h5 className="card-title"> Other</h5>
                        </div>
                        <div className="card-body">
                          <div className="row gx-3">

                             <div className="col-md-6">
                              <label htmlFor="contact" className="form-label">
                                Contact
                              </label>
                              <input
                                type="text"
                                id="contact"
                                className={`form-control ${errors.contact ? "is-invalid" : ""}`}
                                value={formData.contact}
                                onChange={handleChange}
                              />
                              {errors.contact && (
                                <div className="invalid-feedback">
                                  {errors.contact}
                                </div>
                              )}
                            </div>

                            <div className="col-6">
                              <label htmlFor="role" className="form-label">
                                Role
                              </label>
                              <select
                                id="role"
                                className={`form-control ${errors.role ? "is-invalid" : ""}`}
                                value={formData.role}
                                onChange={handleChange}
                              >
                                <option value="">-- Select Role --</option>
                                <option value="Manager">
                                  Turf Owner
                                </option>
                              </select>
                              {errors.role && (
                                <div className="invalid-feedback">
                                  {errors.role}
                                </div>
                              )}
                            </div>
                            <div className="col-md-6">
                              <label htmlFor="password" className="form-label" >
                                Password
                              </label>
                              <input
                                type="password"
                                id="password"
                                placeholder="DEFAULT PASSWORD"
                                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                                value={formData.password}
                                onChange={handleChange}
                                disabled
                              />
                              {errors.password && (
                                <div className="invalid-feedback">
                                  {errors.password}
                                </div>
                              )}
                            </div>
                             <div className="col-6">
                              <label htmlFor="turfId" className="form-label">
                                Turf
                              </label>
                              <select
                                id="turfId"
                                className={`form-control ${errors.turfId ? "is-invalid" : ""}`}
                                value={formData.turfId}
                                onChange={handleChange}
                              >
                                <option value="">-- Select Turf --</option>
                                {turfs.map((turf) =>(
                                    <option key={turf.id} value={turf.id} >
                                    {turf.name}
                                    </option>
                                ))}
                                
                              </select>
                              {errors.turfId && (
                                <div className="invalid-feedback">
                                  {errors.turfId}
                                </div>
                              )}
                            </div>
                            
                          </div>
                        </div>
                        <div className="d-flex gap-2 justify-content-end p-3">
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => setActiveTab("oneA")}
                          >
                            <i className="bi bi-arrow-left-circle" /> Prev
                          </button>
                          {/* ← disabled is now correctly on the button element */}
                          <button
                            type="submit"
                            className="btn btn-info"
                            disabled={save}
                          >
                            {save ? (
                              <>
                                <ClipLoader color="#fff" size={18} /> Saving...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-cloud-arrow-up" /> Save
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
                <ToastContainer />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterTurfOwner;
