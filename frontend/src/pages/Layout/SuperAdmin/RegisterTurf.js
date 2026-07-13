import "../../../components/PreviewGuide.css";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import ClipLoader from "react-spinners/ClipLoader";

const API = process.env.REACT_APP_URL || "http://localhost:5000";

const RegisterTurf = () => {
  const [activeTab, setActiveTab] = useState("oneA");
  const [save, setSave] = useState(false);
  const [errors, setErrors] = useState({});

  const initialForm = {
    turfName: "",
    email: "",
    contact: "",
    location: "",
    longitude: "",
    latitude: "",
    district: "",
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

  // ------------------- Validation -------------------
  const validateForm = () => {
    const newErrors = {};

    if (!formData.turfName.trim()) newErrors.turfName = "Turf name is required.";

    if (!formData.email.trim()) newErrors.email = "Email is required.";

    if (!formData.contact.trim()) newErrors.contact = "Contact is required.";

    if (!formData.location.trim()) newErrors.location = "Location is required.";

    if (!formData.district.trim())
      newErrors.district = "Municipal is required.";

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

      const response = await axios.post(`${API}/api/super/reg-turf`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        // Do NOT set Content-Type manually — axios sets multipart/form-data with boundary
      });

      toast.success(response?.data?.message || "Turf Registered successful!", {
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
        error?.response?.data?.message || "Turf Registration failed!",
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
                              <label htmlFor="turfName" className="form-label">
                                Turf Name
                              </label>
                              <input
                                type="text"
                                id="turfName"
                                className={`form-control ${errors.turfName ? "is-invalid" : ""}`}
                                value={formData.turfName}
                                onChange={handleChange}
                              />
                              {errors.turfName && (
                                <div className="invalid-feedback">
                                  {errors.turfName}
                                </div>
                              )}
                            </div>

                            <div className="col-md-6">
                              <label htmlFor="email" className="form-label">
                                Email
                              </label>
                              <input
                                type="email"
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

                            <div className="col-md-6 mt-3">
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

                            <div className="col-md-6 mt-3">
                              <label htmlFor="location" className="form-label">
                                Location
                              </label>
                              <input
                                type="text"
                                id="location"
                                className={`form-control ${errors.location ? "is-invalid" : ""}`}
                                value={formData.location}
                                onChange={handleChange}
                              />
                              {errors.location && (
                                <div className="invalid-feedback">
                                  {errors.location}
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
                          <h5 className="card-title"> Location</h5>
                        </div>
                        <div className="card-body">
                          <div className="row gx-3">
                            <div className="col-6">
                              <label htmlFor="district" className="form-label">
                                Municipal
                              </label>
                              <select
                                id="district"
                                className={`form-control ${errors.district ? "is-invalid" : ""}`}
                                value={formData.district}
                                onChange={handleChange}
                              >
                                <option value="">-- Select Municipal --</option>
                                <option value="Ayawaso West">
                                  Ayawaso West
                                </option>
                                <option value="Dome Kwabenya">
                                  Dome Kwabenya
                                </option>
                              </select>
                              {errors.district && (
                                <div className="invalid-feedback">
                                  {errors.district}
                                </div>
                              )}
                            </div>
                            <div className="col-md-6">
                              <label htmlFor="longitude" className="form-label">
                                Longitude
                              </label>
                              <input
                                type="text"
                                id="longitude"
                                className={`form-control ${errors.longitude ? "is-invalid" : ""}`}
                                value={formData.longitude}
                                onChange={handleChange}
                              />
                              {errors.longitude && (
                                <div className="invalid-feedback">
                                  {errors.longitude}
                                </div>
                              )}
                            </div>
                            <div className="col-md-6">
                              <label htmlFor="latitude" className="form-label">
                                Latitude
                              </label>
                              <input
                                type="text"
                                id="latitude"
                                className={`form-control ${errors.latitude ? "is-invalid" : ""}`}
                                value={formData.latitude}
                                onChange={handleChange}
                              />
                              {errors.latitude && (
                                <div className="invalid-feedback">
                                  {errors.latitude}
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

export default RegisterTurf;
