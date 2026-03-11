import axios from "axios";
import "../components/PreviewGuide.css";
import { useState, useRef, useEffect } from "react";
import { useParams,useNavigate } from "react-router-dom";
import {toast, ToastContainer} from 'react-toastify';

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
    photo: null,
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [isNewPhoto, setIsNewPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("oneA");
  const [errors, setErrors] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [useCamera, setUseCamera] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ---------------- UTILS ----------------
  const formatDateForInput = (date) =>
    date ? new Date(date).toISOString().split("T")[0] : "";

  // ---------------- FETCH ADMIN ----------------
  const fetchDetail = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/auth/details/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = res?.data;

      setFormData({
        firstName: data.firstName || "",
        middleName: data.middleName || "",
        lastName: data.lastName || "",
        dob: formatDateForInput(data.dob),
        contact: data.contact || "",
        gender: data.gender || "",
        address: data.address || "",
        nationalId: data.nationalId || "",
        email: data.email || "",
        maritalStatus: data.maritalStatus || "",
        role: data.role || "",
        photo: null,
      });

      if (!isNewPhoto && data.photo) {
        setPreviewImage(`${data.photo}?t=${Date.now()}`);
      }
      setIsNewPhoto(false);
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
    const video = videoRef.current;

    canvas.width = video.videoWidth;
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

   // ------------------- Form Validation -------------------
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "dob",
      "contact",
      "gender",
      "address",
      "nationalId",
      "email",
      "maritalStatus",
      "role",
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
    }


    // National ID simple validation
    if (formData.nationalId && formData.nationalId.length < 5) {
      newErrors.nationalId = "Enter a valid ID";
      toast.warning("Enter a valid ID ");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------- REFRESH LOGGED-IN USER ----------------
  const refreshLoggedInUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await axios.get(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const freshUser = {
      ...res.data,
      photo: res?.data?.photo ? `${res?.data?.photo}?t=${Date.now()}` : null,
    };

    localStorage.setItem("user", JSON.stringify(freshUser));
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== null) payload.append(k, v);
      });

   const res= await axios.put(`${API}/api/auth/update/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPreviewImage(null);
      setIsNewPhoto(false);
     await refreshLoggedInUser(); // 🔥 refresh logged-in user photo
      await fetchDetail();
      toast.success(res?.data?.message || "Record Updated Successfully!", {
        position: "top-right",
        onClose: ()=> window.location.href='/users',
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      toast.error( err.res?.data?.error ||"Record Updating Failed!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
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
                  ></button>
                </div>
                <div className="modal-body">
                  {!useCamera ? (
                    <>
                      <button
                        className="btn btn-outline-primary w-100 mb-2"
                        onClick={() => {
                          setUseCamera(true);
                          startCamera();
                        }}
                      >
                        <i className="bi bi-camera me-2" /> Open Camera
                      </button>
                      <label className="btn btn-outline-secondary w-100">
                        <i className="bi bi-upload me-2" /> Choose from device
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleChange}
                          id="photo"
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <div className="camera-preview-wrapper">
                        <video
                          ref={videoRef}
                          className="camera-video"
                          autoPlay
                          playsInline
                        />
                        <div className="face-guide"></div>
                      </div>
                      <canvas ref={canvasRef} hidden />
                      <button
                        className="btn btn-success w-100"
                        onClick={capturePhoto}
                      >
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
                      Other Info
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${activeTab === "threeA" ? "active" : ""}`}
                      onClick={() => setActiveTab("threeA")}
                    >
                      Security & Photo
                    </button>
                  </li>
                </ul>

                <form onSubmit={handleSubmit}>
                  <div className="tab-content">
                    {/* ==== GENERAL ==== */}
                    <div
                      className={`tab-pane ${activeTab === "oneA" ? "show active" : "d-none"}`}
                    >
                      <div className="card mb-3">
                        <div className="card-header">
                          <h5 className="card-title">Personal Details</h5>
                        </div>
                        <div className="card-body row gx-3">
                          <div className="col-6">
                            <label htmlFor="firstName" className="form-label">
                              First Name
                            </label>
                            <input
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
                          <div className="col-6">
                            <label htmlFor="lastName" className="form-label">
                              Last Name
                            </label>
                            <input
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
                          <div className="col-6">
                            <label htmlFor="middleName" className="form-label">
                              Other Name
                            </label>
                            <input
                              id="middleName"
                              className="form-control"
                              value={formData.middleName}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-6">
                            <label htmlFor="dob" className="form-label">
                              Date of Birth
                            </label>
                            <input
                              type="date"
                              id="dob"
                              className={`form-control ${errors.dob ? "is-invalid" : ""}`}
                              value={formData.dob}
                              onChange={handleChange}
                            />
                            {errors.dob && (
                              <div className="invalid-feedback">
                                {errors.dob}
                              </div>
                            )}
                          </div>
                          <div className="col-6">
                            <label htmlFor="contact" className="form-label">
                              Contact
                            </label>
                            <input
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
                            <label htmlFor="gender" className="form-label">
                              Gender
                            </label>
                            <select
                              id="gender"
                              className={`form-control ${errors.gender ? "is-invalid" : ""}`}
                              value={formData.gender}
                              onChange={handleChange}
                            >
                              <option value="">-- Select Gender --</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                            {errors.gender && (
                              <div className="invalid-feedback">
                                {errors.gender}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="d-flex gap-2 justify-content-end p-3">
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => setActiveTab("twoA")}
                          >
                            Next <i className="bi bi-arrow-right-circle" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ==== OTHER INFO ==== */}
                    <div
                      className={`tab-pane ${activeTab === "twoA" ? "show active" : "d-none"}`}
                    >
                      <div className="card mb-3">
                        <div className="card-header">
                          <h5 className="card-title">Other Details</h5>
                        </div>
                        <div className="card-body row gx-3">
                          <div className="col-6">
                            <label htmlFor="address" className="form-label">
                              Address
                            </label>
                            <input
                              id="address"
                              className={`form-control ${errors.address ? "is-invalid" : ""}`}
                              value={formData.address}
                              onChange={handleChange}
                            />
                            {errors.address && (
                              <div className="invalid-feedback">
                                {errors.address}
                              </div>
                            )}
                          </div>
                          <div className="col-6">
                            <label htmlFor="nationalId" className="form-label">
                              National ID
                            </label>
                            <input
                              id="nationalId"
                              className={`form-control ${errors.nationalId ? "is-invalid" : ""}`}
                              value={formData.nationalId}
                              onChange={handleChange}
                            />
                            {errors.nationalId && (
                              <div className="invalid-feedback">
                                {errors.nationalId}
                              </div>
                            )}
                          </div>
                          <div className="col-6">
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
                          <div className="col-6">
                            <label
                              htmlFor="maritalStatus"
                              className="form-label"
                            >
                              Marital Status
                            </label>
                            <select
                              id="maritalStatus"
                              className={`form-control ${errors.maritalStatus ? "is-invalid" : ""}`}
                              value={formData.maritalStatus}
                              onChange={handleChange}
                            >
                              <option value="">-- Select Status --</option>
                              <option value="Married">Married</option>
                              <option value="Single">Single</option>
                              <option value="Widow">Widow</option>
                              <option value="Divorced">Divorced</option>
                            </select>
                            {errors.maritalStatus && (
                              <div className="invalid-feedback">
                                {errors.maritalStatus}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="d-flex gap-2 justify-content-end p-3">
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => setActiveTab("oneA")}
                          >
                            <i className="bi bi-arrow-left-circle" />
                            Prev
                          </button>
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

                    {/* ==== SECURITY & PHOTO ==== */}
                    <div
                      className={`tab-pane ${activeTab === "threeA" ? "show active" : "d-none"}`}
                    >
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
                              <i
                                className="bi bi-camera-fill text-black"
                                style={{ fontSize: "1.5rem" }}
                              />
                            </div>
                            <div className="d-flex align-items-center gap-4">
                              <img
                                src={
                                  previewImage ||
                                  process.env.PUBLIC_URL +
                                    "/assets/images/admin/avatar.webp"
                                }
                                className="profile-img"
                                alt="Profile"
                              />
                              {errors.photo && (
                                <div className="text-danger">
                                  {errors.photo}
                                </div>
                              )}
                            </div>
                          </div>
                          <hr />
                          <div className="row gx-3">
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
                                <option value="Staff">Staff</option>
                                <option value="Manager">Manager</option>
                              </select>
                              {errors.role && (
                                <div className="invalid-feedback">
                                  {errors.role}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2 justify-content-end p-3">
                          <button
                            type="button"
                            className="btn btn-success"
                            disabled={loading}
                            onClick={() => setActiveTab("twoA")}
                          >
                            <i className="bi bi-arrow-left-circle" /> Prev
                          </button>
                          <button
                            type="submit"
                            className="btn btn-info"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                {" "}
                                <span className="spinner-border spinner-border-sm me-2" />{" "}
                                Updating...{" "}
                              </>
                            ) : (
                              <>
                                {" "}
                                Submit <i className="bi bi-cloud-arrow-up" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
                <ToastContainer/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Update;
