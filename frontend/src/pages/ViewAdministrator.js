import axios from "axios";
import "../components/PreviewGuide.css";
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

const Update = () => {
  const API = process.env.REACT_APP_URL ?? "http://localhost:5000";
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    contact: "",
    gender: "",
    address: "",
    nationalId: "",
    email: "",
    maritalStatus: "",
    role: "",
    photo: null, // File object or null — null means "no change"
  });

  const [previewImage,   setPreviewImage]   = useState(null);
  const [isNewPhoto,     setIsNewPhoto]     = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [activeTab,      setActiveTab]      = useState("oneA");
  const [errors,         setErrors]         = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [useCamera,      setUseCamera]      = useState(false);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  // ---------------- UTILS ----------------
  const formatDateForInput = (date) =>
    date ? new Date(date).toISOString().split("T")[0] : "";

  // ---------------- FETCH ADMIN ----------------
  const fetchDetail = async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await axios.get(`${API}/api/auth/details/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res?.data;

      setFormData({
        firstName:    data.firstName    || "",
        middleName:   data.middleName   || "",
        lastName:     data.lastName     || "",
        dob:          formatDateForInput(data.dob),
        contact:      data.contact      || "",
        gender:       data.gender       || "",
        address:      data.address      || "",
        nationalId:   data.nationalId   || "",
        email:        data.email        || "",
        maritalStatus: data.maritalStatus || "",
        role:         data.role         || "",
        photo:        null, // never put the existing URL back — only File objects go here
      });

      // Only show the existing photo if user hasn't picked a new one
      if (!isNewPhoto) {
        setPreviewImage(data.photo ? `${data.photo}?t=${Date.now()}` : null);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // ---------------- INPUT ----------------
  const handleChange = (e) => {
    const { id, value, files } = e.target;

    if (id === "photo" && files?.length) {
      const file = files[0];
      setFormData((p) => ({ ...p, photo: file }));
      setPreviewImage(URL.createObjectURL(file));
      setIsNewPhoto(true);
      setShowImageModal(false);
      return;
    }

    setFormData((p) => ({ ...p, [id]: value }));
  };

  // ---------------- CAMERA ----------------
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    videoRef.current.play();
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], "photo.png", { type: "image/png" });
      setFormData((p) => ({ ...p, photo: file }));
      setPreviewImage(URL.createObjectURL(blob));
      setIsNewPhoto(true);
      stopCamera();
      setUseCamera(false);
      setShowImageModal(false);
    });
  };

  // ---------------- VALIDATION ----------------
  const validateForm = () => {
    const newErrors = {};

    const requiredFields = [
      "firstName", "lastName", "dob", "contact", "gender",
      "address", "nationalId", "email", "maritalStatus", "role",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] = "This field is required";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.warning("Please fill in the highlighted fields.");
      return false; // ← was returning undefined before, which is falsy but breaks !validateForm() guard
    }

    if (formData.contact && !/^\d{10,15}$/.test(formData.contact)) {
      newErrors.contact = "Enter a valid phone number";
    }

    if (formData.nationalId && formData.nationalId.length < 5) {
      newErrors.nationalId = "Enter a valid ID";
      toast.warning("Enter a valid ID");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------- REFRESH LOGGED-IN USER ----------------
  const refreshLoggedInUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const freshUser = {
        ...res.data,
        photo: res.data?.photo ? `${res.data.photo}?t=${Date.now()}` : null,
      };
      localStorage.setItem("user", JSON.stringify(freshUser));
    } catch {
      // non-critical — don't block the flow
    }
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Build FormData — skip photo if null (no change), skip nothing else
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== null) payload.append(k, v);
      });

      const res = await axios.put(`${API}/api/auth/update/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        // Do NOT set Content-Type — axios sets multipart/form-data with boundary automatically
      });

      setIsNewPhoto(false);
      await refreshLoggedInUser();
      await fetchDetail();

      toast.success(res?.data?.message || "Record Updated Successfully!", {
        position: "top-right",
        onClose: () => navigate("/users"),
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message ||   // ← was err.res?.data?.error (wrong)
        err.response?.data?.error   ||
        "Record Updating Failed!",
        {
          position:        "top-right",
          autoClose:       3000,
          hideProgressBar: false,
          closeOnClick:    true,
          pauseOnHover:    true,
          draggable:       true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------- JSX ----------------
  return (
    <>
      {/* ================= Image Modal ================= */}
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
                    onClick={() => {
                      stopCamera();
                      setUseCamera(false);
                      setShowImageModal(false);
                    }}
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
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          id="photo"
                          onChange={handleChange}
                        />
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

      {/* ================= Form ================= */}
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

                    {/* ==== GENERAL ==== */}
                    <div className={`tab-pane ${activeTab === "oneA" ? "show active" : "d-none"}`}>
                      <div className="card mb-3">
                        <div className="card-header">
                          <h5 className="card-title">Personal Details</h5>
                        </div>
                        <div className="card-body row gx-3">
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
                            <input
                              type="date" id="dob"
                              className={`form-control ${errors.dob ? "is-invalid" : ""}`}
                              value={formData.dob} onChange={handleChange}
                            />
                            {errors.dob && <div className="invalid-feedback">{errors.dob}</div>}
                          </div>
                          <div className="col-6">
                            <label htmlFor="contact" className="form-label">Contact</label>
                            <input
                              id="contact"
                              className={`form-control ${errors.contact ? "is-invalid" : ""}`}
                              value={formData.contact} onChange={handleChange}
                            />
                            {errors.contact && <div className="invalid-feedback">{errors.contact}</div>}
                          </div>
                          <div className="col-6">
                            <label htmlFor="gender" className="form-label">Gender</label>
                            <select
                              id="gender"
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
                        <div className="d-flex gap-2 justify-content-end p-3">
                          <button type="button" className="btn btn-primary" onClick={() => setActiveTab("twoA")}>
                            Next <i className="bi bi-arrow-right-circle" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ==== OTHER INFO ==== */}
                    <div className={`tab-pane ${activeTab === "twoA" ? "show active" : "d-none"}`}>
                      <div className="card mb-3">
                        <div className="card-header">
                          <h5 className="card-title">Other Details</h5>
                        </div>
                        <div className="card-body row gx-3">
                          <div className="col-6">
                            <label htmlFor="address" className="form-label">Address</label>
                            <input
                              id="address"
                              className={`form-control ${errors.address ? "is-invalid" : ""}`}
                              value={formData.address} onChange={handleChange}
                            />
                            {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                          </div>
                          <div className="col-6">
                            <label htmlFor="nationalId" className="form-label">National ID</label>
                            <input
                              id="nationalId"
                              className={`form-control ${errors.nationalId ? "is-invalid" : ""}`}
                              value={formData.nationalId} onChange={handleChange}
                            />
                            {errors.nationalId && <div className="invalid-feedback">{errors.nationalId}</div>}
                          </div>
                          <div className="col-6">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input
                              type="email" id="email"
                              className={`form-control ${errors.email ? "is-invalid" : ""}`}
                              value={formData.email} onChange={handleChange}
                            />
                            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                          </div>
                          <div className="col-6">
                            <label htmlFor="maritalStatus" className="form-label">Marital Status</label>
                            <select
                              id="maritalStatus"
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

                    {/* ==== SECURITY & PHOTO ==== */}
                    <div className={`tab-pane ${activeTab === "threeA" ? "show active" : "d-none"}`}>
                      <div className="card mb-3">
                        <div className="card-header">
                          <h5 className="card-title">Security & Photo</h5>
                        </div>
                        <div className="card-body">
                          <div
                            className="profile-header mb-1"
                            style={{ padding: "5px", background: "#0073d8" }}
                          >
                            <div
                              className="camera-btn shadow"
                              onClick={() => setShowImageModal(true)}
                              style={{ cursor: "pointer" }}
                            >
                              <i className="bi bi-camera-fill text-black" style={{ fontSize: "1.5rem" }} />
                            </div>
                            <div className="d-flex align-items-center gap-4">
                              <img
                                src={previewImage || `${process.env.PUBLIC_URL}/assets/images/admin/avatar.webp`}
                                className="profile-img"
                                alt="Profile"
                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/admin/avatar.webp` }}
                              />
                              {errors.photo && <div className="text-danger">{errors.photo}</div>}
                            </div>
                          </div>
                          <hr />
                          <div className="row gx-3">
                            <div className="col-6">
                              <label htmlFor="role" className="form-label">Role</label>
                              <select
                                id="role"
                                className={`form-control ${errors.role ? "is-invalid" : ""}`}
                                value={formData.role} onChange={handleChange}
                              >
                                <option value="">-- Select Role --</option>
                                <option value="Staff">Staff</option>
                                <option value="Manager">Manager</option>
                              </select>
                              {errors.role && <div className="invalid-feedback">{errors.role}</div>}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2 justify-content-end p-3">
                          <button type="button" className="btn btn-success" disabled={loading} onClick={() => setActiveTab("twoA")}>
                            <i className="bi bi-arrow-left-circle" /> Prev
                          </button>
                          <button type="submit" className="btn btn-info" disabled={loading}>
                            {loading
                              ? <><span className="spinner-border spinner-border-sm me-2" /> Updating...</>
                              : <> Submit <i className="bi bi-cloud-arrow-up" /></>
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

export default Update;