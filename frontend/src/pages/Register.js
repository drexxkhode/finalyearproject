import "../components/PreviewGuide.css";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import ClipLoader from "react-spinners/ClipLoader";

const API = process.env.REACT_APP_URL || "http://localhost:5000";

const Register = () => {
  const [activeTab,       setActiveTab]       = useState("oneA");
  const [showPassword,    setShowPassword]    = useState(false);
  const [save,            setSave]            = useState(false);
  const [showImageModal,  setShowImageModal]  = useState(false);
  const [useCamera,       setUseCamera]       = useState(false);
  const [previewImage,    setPreviewImage]    = useState(null);
  const [errors,          setErrors]          = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0, label: "Very Weak", color: "bg-danger",
    message: "Password is too weak",
  });

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: "", middleName: "", lastName: "", dob: "",
    contact: "", gender: "", address: "", nationalId: "",
    email: "", maritalStatus: "", role: "", password: "",
    photo: null,
  });

  // ------------------- Camera -------------------
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch {
      alert("Camera access denied or not available");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
  };

  const capturePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], "profile-photo.png", { type: "image/png" });
      setFormData((p) => ({ ...p, photo: file }));
      setPreviewImage(URL.createObjectURL(blob));
      stopCamera();
      setUseCamera(false);
      setShowImageModal(false);
    });
  };

  useEffect(() => { return () => stopCamera(); }, []);

  // ------------------- Password Strength -------------------
  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8)                        score++;
    if (/[A-Z]/.test(password))                      score++;
    if (/[a-z]/.test(password))                      score++;
    if (/[0-9]/.test(password))                      score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password))    score++;

    const map = [
      { label: "Very Weak", color: "bg-danger",  message: "Use at least 8 characters, numbers, letters, and symbols." },
      { label: "Very Weak", color: "bg-danger",  message: "Use at least 8 characters, numbers, letters, and symbols." },
      { label: "Weak",      color: "bg-warning", message: "Add uppercase letters, numbers, or symbols." },
      { label: "Medium",    color: "bg-info",    message: "Stronger, but could add symbols or numbers." },
      { label: "Strong",    color: "bg-success", message: "Good password." },
      { label: "Very Strong", color: "bg-success", message: "Excellent password!" },
    ];
    setPasswordStrength({ score, ...map[score] });
  };

  // ------------------- Input Change -------------------
  const handleChange = (e) => {
    const { id, value, files } = e.target;
    if (id === "photo" && files?.length) {
      setFormData((p) => ({ ...p, photo: files[0] }));
      setPreviewImage(URL.createObjectURL(files[0]));
      setShowImageModal(false);
      return;
    }
    setFormData((p) => ({ ...p, [id]: value }));
    if (id === "password") checkPasswordStrength(value);
  };

  // ------------------- Validation -------------------
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      "firstName", "lastName", "dob", "contact", "gender",
      "address", "nationalId", "email", "maritalStatus", "role", "password",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] = "This field is required";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.warning("Please fill in the highlighted fields.");
      return false; // ← was returning undefined
    }

    if (formData.contact && !/^\d{10,15}$/.test(formData.contact))
      newErrors.contact = "Enter a valid phone number";

    if (formData.password && passwordStrength.score < 3)
      newErrors.password = "Password is too weak";

    if (formData.nationalId && formData.nationalId.length < 5)
      newErrors.nationalId = "Enter a valid ID";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ------------------- Submit -------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSave(true);

      // ← Build FormData properly — letting axios set the multipart boundary
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== null) payload.append(k, v);
      });

      const response = await axios.post(`${API}/api/auth/register`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        // Do NOT set Content-Type manually — axios sets multipart/form-data with boundary
      });

      toast.success(response?.data?.message || "Registration successful!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Reset form after success
      setFormData({
        firstName: "", middleName: "", lastName: "", dob: "",
        contact: "", gender: "", address: "", nationalId: "",
        email: "", maritalStatus: "", role: "", password: "",
        photo: null,
      });
      setPreviewImage(null);
      setErrors({});
      setActiveTab("oneA");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Registration failed!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setSave(false);
    }
  };

  const AVATAR = "/assets/images/admin/avatar.webp";

  return (
    <>
      {/* =================== Image Modal =================== */}
      {showImageModal && (
        <>
          <div className="custom-backdrop-blur"></div>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-camera-fill" /> Profile Photo
                  </h5>
                  <button
                    className="btn-close"
                    onClick={() => { stopCamera(); setUseCamera(false); setShowImageModal(false); }}
                  />
                </div>
                <div className="modal-body">
                  {!useCamera ? (
                    <>
                      <button
                        className="btn btn-outline-primary w-100 mb-2"
                        onClick={() => { setUseCamera(true); startCamera(); }}
                      >
                        <i className="bi bi-camera me-2" /> Open Camera
                      </button>
                      <label className="btn btn-outline-secondary w-100">
                        <i className="bi bi-upload me-2" /> Choose from device
                        <input type="file" accept="image/*" hidden id="photo" onChange={handleChange} />
                      </label>
                    </>
                  ) : (
                    <>
                      <div className="camera-preview-wrapper">
                        <video ref={videoRef} className="camera-video" autoPlay playsInline />
                        <div className="face-guide"></div>
                      </div>
                      <canvas ref={canvasRef} hidden />
                      <button className="btn btn-success w-100" onClick={capturePhoto}>
                        <i className="bi bi-camera-fill me-2" /> Capture Photo
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =================== Form =================== */}
      <div className="row gx-3">
        <div className="col-xxl-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="custom-tabs-container">
                <ul className="nav nav-tabs">
                  {[
                    { key: "oneA",   label: "General" },
                    { key: "twoA",   label: "Other Info" },
                    { key: "threeA", label: "Security & Photo" },
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
                    <div className={`tab-pane ${activeTab === "oneA" ? "show active" : "d-none"}`}>
                      <div className="card mb-3">
                        <div className="card-header"><h5 className="card-title">Personal Details</h5></div>
                        <div className="card-body">
                          <div className="row gx-3">
                            {[
                              { id: "firstName", label: "First Name" },
                              { id: "lastName",  label: "Last Name" },
                              { id: "middleName", label: "Other Name", optional: true },
                            ].map(({ id, label, optional }) => (
                              <div className="col-6" key={id}>
                                <label htmlFor={id} className="form-label">{label}</label>
                                <input
                                  id={id}
                                  className={`form-control ${errors[id] ? "is-invalid" : ""}`}
                                  value={formData[id]}
                                  onChange={handleChange}
                                />
                                {errors[id] && <div className="invalid-feedback">{errors[id]}</div>}
                              </div>
                            ))}
                            <div className="col-6">
                              <label htmlFor="dob" className="form-label">Date of Birth</label>
                              <input type="date" id="dob"
                                className={`form-control ${errors.dob ? "is-invalid" : ""}`}
                                value={formData.dob} onChange={handleChange}
                              />
                              {errors.dob && <div className="invalid-feedback">{errors.dob}</div>}
                            </div>
                            <div className="col-6">
                              <label htmlFor="contact" className="form-label">Contact</label>
                              <input id="contact"
                                className={`form-control ${errors.contact ? "is-invalid" : ""}`}
                                value={formData.contact} onChange={handleChange}
                              />
                              {errors.contact && <div className="invalid-feedback">{errors.contact}</div>}
                            </div>
                            <div className="col-6">
                              <label htmlFor="gender" className="form-label">Gender</label>
                              <select id="gender"
                                className={`form-control ${errors.gender ? "is-invalid" : ""}`}
                                value={formData.gender} onChange={handleChange}
                              >
                                <option value="">-- Select Gender --</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                              </select>
                              {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2 justify-content-end p-3">
                          <button type="button" className="btn btn-primary" onClick={() => setActiveTab("twoA")}>
                            Next <i className="bi bi-arrow-right-circle" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ===== OTHER INFO ===== */}
                    <div className={`tab-pane ${activeTab === "twoA" ? "show active" : "d-none"}`}>
                      <div className="card mb-3">
                        <div className="card-header"><h5 className="card-title">Other Details</h5></div>
                        <div className="card-body">
                          <div className="row gx-3">
                            <div className="col-6">
                              <label htmlFor="address" className="form-label">Address</label>
                              <input id="address"
                                className={`form-control ${errors.address ? "is-invalid" : ""}`}
                                value={formData.address} onChange={handleChange}
                              />
                              {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                            </div>
                            <div className="col-6">
                              <label htmlFor="nationalId" className="form-label">National ID</label>
                              <input id="nationalId"
                                className={`form-control ${errors.nationalId ? "is-invalid" : ""}`}
                                value={formData.nationalId} onChange={handleChange}
                              />
                              {errors.nationalId && <div className="invalid-feedback">{errors.nationalId}</div>}
                            </div>
                            <div className="col-6">
                              <label htmlFor="email" className="form-label">Email</label>
                              <input type="email" id="email"
                                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                                value={formData.email} onChange={handleChange}
                              />
                              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                            </div>
                            <div className="col-6">
                              <label htmlFor="maritalStatus" className="form-label">Marital Status</label>
                              <select id="maritalStatus"
                                className={`form-control ${errors.maritalStatus ? "is-invalid" : ""}`}
                                value={formData.maritalStatus} onChange={handleChange}
                              >
                                <option value="">-- Select Status --</option>
                                <option value="Married">Married</option>
                                <option value="Single">Single</option>
                                <option value="Widow">Widow</option>
                                <option value="Divorced">Divorced</option>
                              </select>
                              {errors.maritalStatus && <div className="invalid-feedback">{errors.maritalStatus}</div>}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2 justify-content-end p-3">
                          <button type="button" className="btn btn-success" onClick={() => setActiveTab("oneA")}>
                            <i className="bi bi-arrow-left-circle" /> Prev
                          </button>
                          <button type="button" className="btn btn-primary" onClick={() => setActiveTab("threeA")}>
                            Next <i className="bi bi-arrow-right-circle" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ===== SECURITY & PHOTO ===== */}
                    <div className={`tab-pane ${activeTab === "threeA" ? "show active" : "d-none"}`}>
                      <div className="card mb-3">
                        <div className="card-header"><h5 className="card-title">Security & Photo</h5></div>
                        <div className="card-body">
                          <div className="profile-header mb-1" style={{ padding: "5px", background: "#0073d8" }}>
                            <div className="camera-btn shadow" onClick={() => setShowImageModal(true)} style={{ cursor: "pointer" }}>
                              <i className="bi bi-camera-fill text-black" style={{ fontSize: "1.5rem" }} />
                            </div>
                            <div className="d-flex align-items-center gap-4">
                              <img
                                src={previewImage || AVATAR}
                                className={`profile-img ${errors.photo ? "is-invalid" : ""}`}
                                alt="Profile"
                                onError={(e) => { e.target.src = AVATAR }}
                              />
                              {errors.photo && <div className="text-danger">{errors.photo}</div>}
                            </div>
                          </div>
                          <hr />
                          <div className="row gx-3">
                            <div className="col-6">
                              <label htmlFor="role" className="form-label">Role</label>
                              <select id="role"
                                className={`form-control ${errors.role ? "is-invalid" : ""}`}
                                value={formData.role} onChange={handleChange}
                              >
                                <option value="">-- Select Role --</option>
                                <option value="Staff">Staff</option>
                                <option value="Manager">Manager</option>
                              </select>
                              {errors.role && <div className="invalid-feedback">{errors.role}</div>}
                            </div>
                            <div className="col-6">
                              <label htmlFor="password" className="form-label">Password</label>
                              <div className="input-group">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  id="password"
                                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                                  value={formData.password}
                                  onChange={handleChange}
                                />
                                <span className="input-group-text" style={{ cursor: "pointer" }}
                                  onClick={() => setShowPassword((p) => !p)}>
                                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} />
                                </span>
                                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                              </div>
                              <div className="progress mt-2" style={{ height: "6px" }}>
                                <div
                                  className={`progress-bar ${passwordStrength.color}`}
                                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                />
                              </div>
                              <small className="text-muted">
                                <strong>{passwordStrength.label}:</strong> {passwordStrength.message}
                              </small>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2 justify-content-end p-3">
                          <button type="button" className="btn btn-success" onClick={() => setActiveTab("twoA")}>
                            <i className="bi bi-arrow-left-circle" /> Prev
                          </button>
                          {/* ← disabled is now correctly on the button element */}
                          <button type="submit" className="btn btn-info" disabled={save}>
                            {save
                              ? <><ClipLoader color="#fff" size={18} /> Saving...</>
                              : <><i className="bi bi-cloud-arrow-up" /> Save</>
                            }
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

export default Register;