import "../components/PreviewGuide.css";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const Register = () => {
  const [activeTab, setActiveTab] = useState("oneA");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "Very Weak",
    color: "bg-danger",
    message: "Password is too weak",
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
    password: "",
    photo: null,
  });

  // ------------------- Camera Handling -------------------
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (err) {
      alert("Camera access denied or not available");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "profile-photo.png", { type: "image/png" });
      setFormData((prev) => ({ ...prev, photo: file }));
      setPreviewImage(URL.createObjectURL(blob));
      stopCamera();
      setUseCamera(false);
      setShowImageModal(false);
    });
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // ------------------- Password Strength -------------------
  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    let strength;
    switch (score) {
      case 0:
      case 1:
        strength = {
          label: "Very Weak",
          color: "bg-danger",
          message: "Use at least 8 characters, numbers, letters, and symbols.",
        };
        break;
      case 2:
        strength = {
          label: "Weak",
          color: "bg-warning",
          message: "Add uppercase letters, numbers, or symbols.",
        };
        break;
      case 3:
        strength = {
          label: "Medium",
          color: "bg-info",
          message: "Stronger, but could add symbols or numbers.",
        };
        break;
      case 4:
        strength = {
          label: "Strong",
          color: "bg-success",
          message: "Good password.",
        };
        break;
      case 5:
        strength = {
          label: "Very Strong",
          color: "bg-success",
          message: "Excellent password!",
        };
        break;
      default:
        strength = {
          label: "Very Weak",
          color: "bg-danger",
          message: "Password is too weak.",
        };
    }

    setPasswordStrength({ score, ...strength });
  };

  // ------------------- Input Change -------------------
  const handleChange = (e) => {
    const { id, value, files } = e.target;
    if (id === "photo" && files?.length > 0) {
      setFormData((prev) => ({ ...prev, photo: files[0] }));
      setPreviewImage(URL.createObjectURL(files[0]));
      setShowImageModal(false);
      return;
    }

    setFormData((prev) => ({ ...prev, [id]: value }));

    if (id === "password") checkPasswordStrength(value);
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
      "password",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] = "This field is required";
      }
    });

    // Contact number validation
    if (formData.contact && !/^\d{10,15}$/.test(formData.contact)) {
      newErrors.contact = "Enter a valid phone number";
    }

    // Password strength
    if (formData.password && passwordStrength.score < 3) {
      newErrors.password = "Password is too weak";
    }

    // National ID simple validation
    if (formData.nationalId && formData.nationalId.length < 5) {
      newErrors.nationalId = "Enter a valid ID";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ------------------- Submit -------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      console.log("Validation Errors:", errors);
      return;
    }

    try {
    
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("User registered:", response.data);
      toast.success("Login successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error(error.response?.data || error.message);
      toast.error("Registration failed!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

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
                    <i className="bi bi-camera-fill " />
                    Profile Photo
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
                        <i className="bi bi-camera me-2" />
                        Open Camera
                      </button>

                      <label className="btn btn-outline-secondary w-100">
                        <i className="bi bi-upload me-2" />
                        Choose from device
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
                        <i className="bi bi-camera-fill me-2" />
                        Capture Photo
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
                    {/* ================= GENERAL ================= */}
                    <div
                      className={`tab-pane ${activeTab === "oneA" ? "show active" : "d-none"}`}
                    >
                      <div className="card mb-3">
                        <div className="card-header">
                          <h5 className="card-title">Personal Details</h5>
                        </div>
                        <div className="card-body">
                          <div className="row gx-3">
                            {/** First Name */}
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

                            {/** Last Name */}
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

                            {/** Middle Name */}
                            <div className="col-6">
                              <label
                                htmlFor="middleName"
                                className="form-label"
                              >
                                Other Name
                              </label>
                              <input
                                id="middleName"
                                className="form-control"
                                value={formData.middleName}
                                onChange={handleChange}
                              />
                            </div>

                            {/** Date of Birth */}
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

                            {/** Contact */}
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

                            {/** Gender */}
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

                    {/* ================= OTHER INFO ================= */}
                    <div
                      className={`tab-pane ${activeTab === "twoA" ? "show active" : "d-none"}`}
                      id="twoA"
                    >
                      <div className="card mb-3">
                        <div className="card-header">
                          <h5 className="card-title">Other Details</h5>
                        </div>
                        <div className="card-body">
                          <div className="row gx-3">
                            {/** Address */}
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

                            {/** National ID */}
                            <div className="col-6">
                              <label
                                htmlFor="nationalId"
                                className="form-label"
                              >
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

                            {/** Next of Kin */}
                            <div className="col-6">
                              <label htmlFor="email" className="form-label">
                                Email
                              </label>
                              <input
                                id="email"
                                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                                value={formData.email}
                                onChange={handleChange}
                                type="email"
                              />
                              {errors.nextOfKin && (
                                <div className="invalid-feedback">
                                  {errors.email}
                                </div>
                              )}
                            </div>

                            {/** Marital Status */}
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
                              </select>
                              {errors.maritalStatus && (
                                <div className="invalid-feedback">
                                  {errors.maritalStatus}
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

                    {/* ================= SECURITY & PHOTO ================= */}
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
                              ></i>
                            </div>
                            <div className="d-flex align-items-center gap-4">
                              <img
                                src={
                                  previewImage ||
                                  "/assets/images/flowers/image4.jpg"
                                }
                                className={`profile-img ${errors.photo ? "is-invalid" : ""}`}
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
                            {/** Role */}
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
                                <option value="General">General</option>
                                <option value="Manager">Manager</option>
                              </select>
                              {errors.role && (
                                <div className="invalid-feedback">
                                  {errors.role}
                                </div>
                              )}
                            </div>

                            {/** Password */}
                            <div className="col-6">
                              <label htmlFor="password" className="form-label">
                                Password
                              </label>
                              <div className="input-group">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  id="password"
                                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                                  value={formData.password}
                                  onChange={handleChange}
                                />
                                <span
                                  className="input-group-text"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => setShowPassword((p) => !p)}
                                >
                                  <i
                                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                                  />
                                </span>
                                {errors.password && (
                                  <div className="invalid-feedback">
                                    {errors.password}
                                  </div>
                                )}
                              </div>

                              <div
                                className="progress mt-2"
                                style={{ height: "6px" }}
                              >
                                <div
                                  className={`progress-bar ${passwordStrength.color}`}
                                  style={{
                                    width: `${(passwordStrength.score / 5) * 100}%`,
                                  }}
                                />
                              </div>
                              <small className="text-muted">
                                <strong>{passwordStrength.label}:</strong>{" "}
                                {passwordStrength.message}
                              </small>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex gap-2 justify-content-end p-3">
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => setActiveTab("twoA")}
                          >
                            <i className="bi bi-arrow-left-circle" />
                            Prev
                          </button>
                          <button type="submit" className="btn btn-info">
                            Submit <i className="bi bi-cloud-arrow-up"></i>
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
