import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import '../components/Spinner.css';
import ClipLoader from "react-spinners/ClipLoader";
const API = process.env.REACT_APP_URL || "http://localhost:5000";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("oneA");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    turfName: "",
    location: "",
    district: "",
    longitude: "",
    latitude: "",
    email: "",
    contact: "",
    about: "",
    price: "",
  });

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    const requiredFields = [
      "turfName",
      "location",
      "district",
      "longitude",
      "latitude",
      "price",
    ];
    let hasError = false;

requiredFields.forEach((field) => {
  if (!formData[field] || formData[field].toString().trim() === "") {
    newErrors[field] = "This field is required";
    hasError = true;
  }
});

if (hasError) {
  toast.warning("Please fill in the highlighted fields.");
  return;
}

    // Contact number validation
    if (formData.contact && !/^\d{10,15}$/.test(formData.contact)) {
      newErrors.contact = "Enter a valid phone number";
      toast.warning("Please enter a phone number");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ------------------- Input Change -------------------

  const fetchDetail = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API}/api/turf/turf-details`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Map backend fields to frontend formData
      setFormData({
        turfName: res.data.name || "",
        email: res.data.email || "",
        district: res.data.district || "",
        latitude: res.data.latitude || "",
        longitude: res.data.longitude || "",
        location: res.data.location || "",
        price: res.data.price_per_hour || "",
        about: res.data.about || "",
        contact: res.data.contact || "", // if available
      });
    } catch (err) {
      console.error("Fetch failed:", err);
      toast.error("Failed to fetch turf details!");
    }
  };

  useEffect(() => {
    fetchDetail();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${API}/api/auth/change-password`,
        { oldPassword, newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success(response?.data?.message || "Password updated!");
      setNewPassword("");
      setOldPassword("");
    } catch (err) {
      console.log("Password Change Error", err);
      toast.error(err?.response?.data?.message || "Password Update Failed!");
    } finally {
      setIsUpdating(false);
    }
  };
  // ------------------- Submit -------------------
  const handleTurfDetailSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const token = localStorage.getItem("token");

      // Map frontend fields to backend expected fields
      const payload = {
        name: formData.turfName,
        email: formData.email,
        contact: formData.contact,
        district: formData.district,
        latitude: formData.latitude,
        longitude: formData.longitude,
        location: formData.location,
        price_per_hour: formData.price,
        about: formData.about,
      };

      const res = await axios.put(
        `${API}/api/turf/update-turf`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success(res.data.message || "Turf details updated successfully!");
    } catch (error) {
      console.error(error?.response?.data || error.message);
      toast.error("Update failed!");
    }
  };

  return (
    <>
      <div className="row gx-3">
        <div className="col-xxl-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="custom-tabs-container">
                <ul className="nav nav-tabs">
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${activeTab === "oneA" ? "active" : ""}`}
                      onClick={() => setActiveTab("oneA")}
                    >
                      General
                    </button>
                  </li>

                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${activeTab === "twoA" ? "active" : ""}`}
                      onClick={() => setActiveTab("twoA")}
                    >
                      GIS & Other Info
                    </button>
                  </li>

                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${activeTab === "threeA" ? "active" : ""}`}
                      onClick={() => setActiveTab("threeA")}
                    >
                      Turf Photos
                    </button>
                  </li>
                </ul>

                <div className="tab-content">
                  <div
                    className={`tab-pane ${activeTab === "oneA" ? "show active" : "d-none"}`}
                  >
                    <div className="row gx-3 justify-content-between">
                      <div className="col-sm-8 col-12">
                        <div className="card mb-3">
                          <div className="card-header">
                            <h5 className="card-title">Astro Turf Details</h5>
                          </div>
                          <div className="card-body">
                            <form>
                              <div className="row gx-3">
                                <div className="col-6">
                                  <div className="mb-3">
                                    <label
                                      htmlFor="turfName"
                                      className="form-label"
                                    >
                                      Astro Turf Name
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      id="turfName"
                                      value={formData.turfName}
                                      onChange={handleChange}
                                    />
                                  </div>

                                  <div className="mb-3">
                                    <label
                                      htmlFor="contact"
                                      className="form-label"
                                    >
                                      Contact
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      id="contact"
                                      value={formData.contact}
                                      onChange={handleChange}
                                    />
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-3">
                                    <label
                                      htmlFor="email"
                                      className="form-label"
                                    >
                                      Email
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      id="email"
                                      value={formData.email}
                                      onChange={handleChange}
                                    />
                                  </div>

                                  <div className="mb-3">
                                    <label
                                      htmlFor="location"
                                      className="form-label"
                                    >
                                      Location
                                    </label>
                                    <div className="input-group">
                                      <input
                                        type="text"
                                        className="form-control"
                                        id="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="col-12">
                                  <div className="mb-2">
                                    <label className="form-label">About</label>
                                    <textarea
                                      className="form-control"
                                      rows="3"
                                      id="about"
                                      value={formData.about || ""}
                                      onChange={handleChange}
                                    />
                                  </div>
                                </div>
                                <div className="d-flex gap-2 mt-2 justify-content-end">
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleTurfDetailSubmit}
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>

                      <div className="col-sm-4 col-12">
                        <div className="card mb-3">
                          <div className="card-header">
                            <h5 className="card-title">Change Password</h5>
                          </div>
                          <div className="card-body">
                            <form>
                              <div className="row gx-3">
                                <div className="col-12">
                                  <div className="mb-3">
                                    <label
                                      htmlFor="Oldpassword"
                                      className="form-label"
                                    >
                                      Curent Password
                                    </label>

                                    <div className="input-group">
                                      <input
                                        type={
                                          showPassword ? "text" : "password"
                                        }
                                        id="Oldpassword"
                                        className="form-control"
                                        placeholder="Enter Current Password"
                                        value={oldPassword}
                                        onChange={(e) =>
                                          setOldPassword(e.target.value)
                                        }
                                        required
                                      />

                                      <span
                                        className="input-group-text"
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                          setShowPassword((prev) => !prev)
                                        }
                                      >
                                        <i
                                          className={`bi ${
                                            showPassword
                                              ? "bi-eye-slash"
                                              : "bi-eye"
                                          }`}
                                        ></i>
                                      </span>
                                    </div>
                                  </div>

                                  <div className="mb-3">
                                    <label
                                      htmlFor="Newpassword"
                                      className="form-label"
                                    >
                                      New Password
                                    </label>

                                    <div className="input-group">
                                      <input
                                        type={
                                          showNewPassword ? "text" : "password"
                                        }
                                        id="Newpassword"
                                        className="form-control"
                                        placeholder="Enter New Password"
                                        value={newPassword}
                                        onChange={(e) =>
                                          setNewPassword(e.target.value)
                                        }
                                        required
                                      />

                                      <span
                                        className="input-group-text"
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                          setShowNewPassword((prev) => !prev)
                                        }
                                      >
                                        <i
                                          className={`bi ${
                                            showNewPassword
                                              ? "bi-eye-slash"
                                              : "bi-eye"
                                          }`}
                                        ></i>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <button
                                      type="button"
                                      className=" form-control col-12 btn btn-primary"
                                      onClick={handlePasswordChange}
                                      disabled={isUpdating}
                                    >
                                      Save Changes
                                    </button>
                                    {isUpdating && (
                                      <div className="spinner-overlay">
                                        <ClipLoader color="#1d20e0" size={60} />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ================= OTHER INFO ================= */}
                  <div
                    className={`tab-pane ${activeTab === "twoA" ? "show active" : "d-none"}`}
                    id="twoA"
                  >
                    <div className="card mb-3">
                      <div className="card-header">
                        <h5 className="card-title">GIS & Other Details</h5>
                      </div>
                      <div className="card-body">
                        <form>
                          <div className="row gx-3">
                            {/** log */}
                            <div className="col-6">
                              <label htmlFor="longitude" className="form-label">
                                Longitude
                              </label>
                              <input
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

                            {/** Latitude */}
                            <div className="col-6">
                              <label htmlFor="latitude" className="form-label">
                                Latitude
                              </label>
                              <input
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

                            {/** Next of Kin */}
                            <div className="col-6">
                              <label htmlFor="price" className="form-label">
                                Price per hour
                              </label>
                              <input
                                id="price"
                                className={`form-control ${errors.price ? "is-invalid" : ""}`}
                                value={formData.price}
                                onChange={handleChange}
                                type="text"
                              />
                              {errors.price && (
                                <div className="invalid-feedback">
                                  {errors.price}
                                </div>
                              )}
                            </div>
                            {/** Latitude */}
                            <div className="col-6">
                              <label htmlFor="district" className="form-label">
                                district
                              </label>
                              <input
                                id="district"
                                className={`form-control ${errors.district ? "is-invalid" : ""}`}
                                value={formData.district}
                                onChange={handleChange}
                              />
                              {errors.district && (
                                <div className="invalid-feedback">
                                  {errors.district}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="d-flex gap-2 justify-content-end p-3">
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={handleTurfDetailSubmit}
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`tab-pane ${activeTab === "threeA" ? "show active" : "d-none"}`}
                  >
                    <div className="row gx-3">
                      <div className="col-12">
                        <div class="card mb-3">
                          <div class="card-header">
                            <h5 class="card-title">Gallery</h5>
                          </div>
                          <div class="card-body">
                            <div class="row g-1 row-cols-3">
                              <div className="col-3">
                                <div className="dropdown ms-2">
                                  <a
                                    id="userSettings"
                                    className="dropdown-toggle d-flex py-2 align-items-center text-decoration-none"
                                    href="#!"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                  >
                                    <img
                                      src="assets/images/user.png"
                                      class="img-fluid rounded-2"
                                      alt="Bootstrap Themes"
                                    />
                                  </a>
                                  <div className="dropdown-menu dropdown-menu-end shadow-lg">
                                    <div className="header-action-links mx-3 gap-2">
                                      <input
                                        type="file"
                                        className="form-control col-1"
                                      />
                                    </div>
                                    <div className="mx-3 mt-2 d-grid">
                                      <input
                                        className="form-control col-1"
                                        value={"uid"}
                                        type="hidden"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div class="col-3">
                                <img
                                  src="assets/images/user2.png"
                                  class="img-fluid rounded-2"
                                  alt="Bootstrap Dashboard"
                                />
                              </div>
                              <div class="col-3">
                                <img
                                  src="assets/images/user1.png"
                                  class="img-fluid rounded-2"
                                  alt="Bootstrap Admin"
                                />
                              </div>
                              <div class="col-3">
                                <img
                                  src="assets/images/user3.png"
                                  class="img-fluid rounded-2"
                                  alt="Bootstrap Admin"
                                />
                              </div>
                              <div class="col-3">
                                <img
                                  src="assets/images/user4.png"
                                  class="img-fluid rounded-2"
                                  alt="Admin Dashboards"
                                />
                              </div>
                              <div class="col-3">
                                <img
                                  src="assets/images/user5.png"
                                  class="img-fluid rounded-2"
                                  alt="Admin Themes"
                                />
                              </div>
                              <div class="col-3">
                                <img
                                  src="assets/images/user1.png"
                                  class="img-fluid rounded-2"
                                  alt="Admin Dashboards"
                                />
                              </div>
                              <div class="col-3">
                                <img
                                  src="assets/images/user3.png"
                                  class="img-fluid rounded-2"
                                  alt="Admin Themes"
                                />
                              </div>
                              <div class="col-3">
                                <img
                                  src="assets/images/user2.png"
                                  class="img-fluid rounded-2"
                                  alt="Bootstrap Admin Themes"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-4 justify-content-end">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                      >
                        Cancel
                      </button>
                      <button type="button" className="btn btn-success">
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <ToastContainer />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Settings;
