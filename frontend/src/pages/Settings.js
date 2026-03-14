import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import '../components/Spinner.css';
import ClipLoader from "react-spinners/ClipLoader";

const API = process.env.REACT_APP_URL || "http://localhost:5000";

// ── Confirm modal (reusable) ──────────────────────────────────────────────
function ConfirmModal({ show, message, onConfirm, onCancel, loading }) {
  if (!show) return null;
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="card border-0 shadow-lg rounded-4 p-4 text-center"
        style={{ maxWidth: 360, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 44, lineHeight: 1 }} className="mb-3">🗑️</div>
        <h5 className="fw-bold mb-2">Are you sure?</h5>
        <p className="text-muted small mb-4">{message}</p>
        <div className="d-flex gap-2 justify-content-center">
          <button className="btn btn-outline-secondary px-4" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger px-4" onClick={onConfirm} disabled={loading}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" />Deleting…</>
              : <><i className="bi bi-trash me-1" />Yes, Delete</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

const Settings = () => {
  const [activeTab, setActiveTab]       = useState("oneA");
  const [oldPassword, setOldPassword]   = useState("");
  const [newPassword, setNewPassword]   = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdating, setIsUpdating]     = useState(false);
  const [errors, setErrors]             = useState({});

  // turf id — fetched once from turf-details
  const [turfId, setTurfId] = useState(null);

  const [formData, setFormData] = useState({
    turfName: "", location: "", district: "",
    longitude: "", latitude: "", email: "",
    contact: "", about: "", price: "",
  });

  // ── Gallery state ────────────────────────────────────────────────────────
  const [images,        setImages]        = useState([]);   // { id, url, public_id, is_cover, sort_order }
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [deletingId,    setDeletingId]    = useState(null); // id being deleted
  const [settingCoverId, setSettingCoverId] = useState(null);
  const [replacingId,    setReplacingId]    = useState(null); // id being replaced
  const replaceInputRef  = useRef(null);
  const replaceTargetId  = useRef(null);  // which image id is being replaced
  const [confirmModal,  setConfirmModal]  = useState({ show: false, imageId: null });
  const fileInputRef = useRef(null);

  // ── Validation ───────────────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ["turfName", "location", "district", "longitude", "latitude", "price"];
    let hasError = false;

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] = "This field is required";
        hasError = true;
      }
    });

    if (hasError) { toast.warning("Please fill in the highlighted fields."); }

    if (formData.contact && !/^\d{10,15}$/.test(formData.contact)) {
      newErrors.contact = "Enter a valid phone number";
      toast.warning("Please enter a valid phone number");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Fetch turf details (also gets turfId) ────────────────────────────────
  const fetchDetail = async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await axios.get(`${API}/api/turf/turf-details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTurfId(res.data.id);
      setFormData({
        turfName:  res.data.name           || "",
        email:     res.data.email          || "",
        district:  res.data.district       || "",
        latitude:  res.data.latitude       || "",
        longitude: res.data.longitude      || "",
        location:  res.data.location       || "",
        price:     res.data.price_per_hour || "",
        about:     res.data.about          || "",
        contact:   res.data.contact        || "",
      });
    } catch (err) {
      console.error("Fetch failed:", err);
      toast.error("Failed to fetch turf details!");
    }
  };

  // ── Fetch gallery images ─────────────────────────────────────────────────
  const fetchImages = async (id) => {
    if (!id) return;
    setLoadingImages(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await axios.get(`${API}/api/turf/${id}/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setImages(res.data.images ?? []);
    } catch (err) {
      console.error("fetchImages error:", err);
      toast.error("Failed to load gallery images.");
    } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => { fetchDetail(); }, []);

  // Fetch images once turfId is known
  useEffect(() => {
    if (turfId) fetchImages(turfId);
  }, [turfId]);

  // Also fetch images when switching to the gallery tab
  useEffect(() => {
    if (activeTab === "threeA" && turfId) fetchImages(turfId);
  }, [activeTab]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // ── Change password ──────────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const token    = localStorage.getItem("token");
      const response = await axios.put(
        `${API}/api/auth/change-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response?.data?.message || "Password updated!");
      setNewPassword(""); setOldPassword("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Password Update Failed!");
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Save turf details ────────────────────────────────────────────────────
  const handleTurfDetailSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const token   = localStorage.getItem("token");
      const payload = {
        name:          formData.turfName,
        email:         formData.email,
        contact:       formData.contact,
        district:      formData.district,
        latitude:      formData.latitude,
        longitude:     formData.longitude,
        location:      formData.location,
        price_per_hour: formData.price,
        about:         formData.about,
      };
      const res = await axios.put(`${API}/api/turf/update-turf`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(res.data.message || "Turf details updated successfully!");
    } catch (error) {
      toast.error("Update failed!");
    }
  };

  // ── Upload images ────────────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !turfId) return;

    setUploading(true);
    try {
      const token    = localStorage.getItem("token");
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));

      const res = await axios.post(
        `${API}/api/turf/${turfId}/images`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      toast.success(`${res.data.images.length} image(s) uploaded!`);
      // Merge new images into state
      setImages((prev) => [...prev, ...res.data.images]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed!");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Replace a single image ──────────────────────────────────────────────
  const openReplace = (imageId) => {
    replaceTargetId.current = imageId;
    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
      replaceInputRef.current.click();
    }
  };

  const handleImageReplace = async (e) => {
    const file    = e.target.files?.[0];
    const imageId = replaceTargetId.current;
    if (!file || !imageId || !turfId) return;

    setReplacingId(imageId);
    try {
      const token = localStorage.getItem("token");

      // 1. Upload new image
      const formData = new FormData();
      formData.append("images", file);
      const uploadRes = await axios.post(
        `${API}/api/turf/${turfId}/images`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      const newImage = uploadRes.data.images[0];

      // 2. If the replaced image was the cover, make the new image the cover
      const wascover = images.find((img) => img.id === imageId)?.is_cover;
      if (wascover) {
        await axios.put(
          `${API}/api/turf/${turfId}/images/${newImage.id}/cover`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        newImage.is_cover = 1;
      }

      // 3. Delete old image
      await axios.delete(
        `${API}/api/turf/${turfId}/images/${imageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 4. Swap in local state — keep same position in the list
      setImages((prev) =>
        prev.map((img) => {
          if (img.id === imageId) return { ...newImage, is_cover: wascover ? 1 : newImage.is_cover };
          if (wascover) return { ...img, is_cover: 0 }; // unset old cover on others
          return img;
        })
      );

      toast.success("Image replaced!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Replace failed.");
    } finally {
      setReplacingId(null);
      replaceTargetId.current = null;
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  };

  // ── Set cover ────────────────────────────────────────────────────────────
  const handleSetCover = async (imageId) => {
    if (!turfId) return;
    setSettingCoverId(imageId);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/api/turf/${turfId}/images/${imageId}/cover`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state — unset all covers, set new one
      setImages((prev) =>
        prev.map((img) => ({ ...img, is_cover: img.id === imageId ? 1 : 0 }))
      );
      toast.success("Cover image updated!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to set cover.");
    } finally {
      setSettingCoverId(null);
    }
  };

  // ── Delete image (opens modal) ───────────────────────────────────────────
  const openDeleteConfirm = (imageId) => {
    setConfirmModal({ show: true, imageId });
  };

  const confirmDelete = async () => {
    const imageId = confirmModal.imageId;
    setConfirmModal({ show: false, imageId: null });
    setDeletingId(imageId);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${API}/api/turf/${turfId}/images/${imageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Remove from local state and re-assign cover if needed
      setImages((prev) => {
        const filtered = prev.filter((img) => img.id !== imageId);
        const deletedWasCover = prev.find((img) => img.id === imageId)?.is_cover;
        if (deletedWasCover && filtered.length > 0) {
          filtered[0] = { ...filtered[0], is_cover: 1 };
        }
        return filtered;
      });
      toast.success("Image deleted.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <ConfirmModal
        show={confirmModal.show}
        message="This image will be permanently deleted from Cloudinary and cannot be recovered."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ show: false, imageId: null })}
        loading={!!deletingId}
      />

      <div className="row gx-3">
        <div className="col-xxl-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="custom-tabs-container">
                <ul className="nav nav-tabs">
                  <li className="nav-item">
                    <button type="button" className={`nav-link ${activeTab === "oneA" ? "active" : ""}`}
                      onClick={() => setActiveTab("oneA")}>General</button>
                  </li>
                  <li className="nav-item">
                    <button type="button" className={`nav-link ${activeTab === "twoA" ? "active" : ""}`}
                      onClick={() => setActiveTab("twoA")}>GIS & Other Info</button>
                  </li>
                  <li className="nav-item">
                    <button type="button" className={`nav-link ${activeTab === "threeA" ? "active" : ""}`}
                      onClick={() => setActiveTab("threeA")}>
                      Turf Photos
                      {images.length > 0 && (
                        <span className="badge bg-primary ms-2">{images.length}</span>
                      )}
                    </button>
                  </li>
                </ul>

                <div className="tab-content">

                  {/* ── General Tab ── */}
                  <div className={`tab-pane ${activeTab === "oneA" ? "show active" : "d-none"}`}>
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
                                    <label htmlFor="turfName" className="form-label">Astro Turf Name</label>
                                    <input type="text" className="form-control" id="turfName"
                                      value={formData.turfName} onChange={handleChange} />
                                  </div>
                                  <div className="mb-3">
                                    <label htmlFor="contact" className="form-label">Contact</label>
                                    <input type="text" className="form-control" id="contact"
                                      value={formData.contact} onChange={handleChange} />
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Email</label>
                                    <input type="text" className="form-control" id="email"
                                      value={formData.email} onChange={handleChange} />
                                  </div>
                                  <div className="mb-3">
                                    <label htmlFor="location" className="form-label">Location</label>
                                    <input type="text" className="form-control" id="location"
                                      value={formData.location} onChange={handleChange} />
                                  </div>
                                </div>
                                <div className="col-12">
                                  <div className="mb-2">
                                    <label className="form-label">About</label>
                                    <textarea className="form-control" rows="3" id="about"
                                      value={formData.about || ""} onChange={handleChange} />
                                  </div>
                                </div>
                                <div className="d-flex gap-2 mt-2 justify-content-end">
                                  <button type="button" className="btn btn-primary"
                                    onClick={handleTurfDetailSubmit}>Save Changes</button>
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
                                    <label htmlFor="Oldpassword" className="form-label">Current Password</label>
                                    <div className="input-group">
                                      <input type={showPassword ? "text" : "password"}
                                        id="Oldpassword" className="form-control"
                                        placeholder="Enter Current Password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)} required />
                                      <span className="input-group-text" style={{ cursor: "pointer" }}
                                        onClick={() => setShowPassword((p) => !p)}>
                                        <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mb-3">
                                    <label htmlFor="Newpassword" className="form-label">New Password</label>
                                    <div className="input-group">
                                      <input type={showNewPassword ? "text" : "password"}
                                        id="Newpassword" className="form-control"
                                        placeholder="Enter New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)} required />
                                      <span className="input-group-text" style={{ cursor: "pointer" }}
                                        onClick={() => setShowNewPassword((p) => !p)}>
                                        <i className={`bi ${showNewPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <button type="button" className="form-control col-12 btn btn-primary"
                                      onClick={handlePasswordChange} disabled={isUpdating}>
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

                  {/* ── GIS & Other Info Tab ── */}
                  <div className={`tab-pane ${activeTab === "twoA" ? "show active" : "d-none"}`} id="twoA">
                    <div className="card mb-3">
                      <div className="card-header">
                        <h5 className="card-title">GIS & Other Details</h5>
                      </div>
                      <div className="card-body">
                        <form>
                          <div className="row gx-3">
                            <div className="col-6">
                              <label htmlFor="longitude" className="form-label">Longitude</label>
                              <input id="longitude"
                                className={`form-control ${errors.longitude ? "is-invalid" : ""}`}
                                value={formData.longitude} onChange={handleChange} />
                              {errors.longitude && <div className="invalid-feedback">{errors.longitude}</div>}
                            </div>
                            <div className="col-6">
                              <label htmlFor="latitude" className="form-label">Latitude</label>
                              <input id="latitude"
                                className={`form-control ${errors.latitude ? "is-invalid" : ""}`}
                                value={formData.latitude} onChange={handleChange} />
                              {errors.latitude && <div className="invalid-feedback">{errors.latitude}</div>}
                            </div>
                            <div className="col-6 mt-3">
                              <label htmlFor="price" className="form-label">Price per hour</label>
                              <input id="price" type="text"
                                className={`form-control ${errors.price ? "is-invalid" : ""}`}
                                value={formData.price} onChange={handleChange} />
                              {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                            </div>
                            <div className="col-6 mt-3">
                              <label htmlFor="district" className="form-label">District</label>
                              <input id="district"
                                className={`form-control ${errors.district ? "is-invalid" : ""}`}
                                value={formData.district} onChange={handleChange} />
                              {errors.district && <div className="invalid-feedback">{errors.district}</div>}
                            </div>
                            <div className="col-6 mt-3">
                              <label htmlFor="district" className="form-label">District</label>
                              <input id="district"
                                className={`form-control ${errors.district ? "is-invalid" : ""}`}
                                value={formData.district} onChange={handleChange} />
                              {errors.district && <div className="invalid-feedback">{errors.district}</div>}
                            </div>
                            <div className="col-6 mt-3">
                              <label htmlFor="district" className="form-label">District</label>
                              <input id="district"
                                className={`form-control ${errors.district ? "is-invalid" : ""}`}
                                value={formData.district} onChange={handleChange} />
                              {errors.district && <div className="invalid-feedback">{errors.district}</div>}
                            </div>
                          </div>
                          <div className="d-flex gap-2 justify-content-end p-3">
                            <button type="button" className="btn btn-primary"
                              onClick={handleTurfDetailSubmit}>Save</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* ══════════════════════════════════════════════════════════
                      ── Turf Photos Tab (threeA) ──────────────────────────
                  ══════════════════════════════════════════════════════════ */}
                  <div className={`tab-pane ${activeTab === "threeA" ? "show active" : "d-none"}`}>
                    <div className="card mb-3">
                      <div className="card-header d-flex align-items-center justify-content-between">
                        <h5 className="card-title mb-0">Gallery</h5>
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-muted small">
                            {images.length} image{images.length !== 1 ? "s" : ""}
                          </span>
                          {/* Upload button */}
                          <button
                            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading || !turfId}
                          >
                            {uploading
                              ? <><span className="spinner-border spinner-border-sm" /> Uploading…</>
                              : <><i className="bi bi-cloud-upload" /> Upload Images</>
                            }
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            style={{ display: "none" }}
                            onChange={handleImageUpload}
                          />
                          {/* Hidden single-file input for replacing a specific image */}
                          <input
                            ref={replaceInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: "none" }}
                            onChange={handleImageReplace}
                          />
                        </div>
                      </div>

                      <div className="card-body">

                        {/* Loading */}
                        {loadingImages && (
                          <div className="text-center py-5">
                            <ClipLoader color="#1d20e0" size={40} />
                            <p className="text-muted mt-2 small">Loading images…</p>
                          </div>
                        )}

                        {/* Empty state */}
                        {!loadingImages && images.length === 0 && (
                          <div className="text-center py-5 text-muted">
                            <i className="bi bi-images" style={{ fontSize: 48, opacity: 0.3 }}></i>
                            <p className="mt-3 mb-1 fw-bold">No images yet</p>
                            <p className="small">Upload images using the button above. The first image automatically becomes the cover.</p>
                          </div>
                        )}

                        {/* Image grid */}
                        {!loadingImages && images.length > 0 && (
                          <div className="row g-3">
                            {images.map((img) => (
                              <div key={img.id} className="col-6 col-sm-4 col-md-3">
                                <div
                                  className="position-relative rounded-3 overflow-hidden"
                                  style={{
                                    aspectRatio: "1 / 1",
                                    background: "#f0f0f0",
                                    border: img.is_cover ? "3px solid #0d6efd" : "3px solid transparent",
                                    transition: "border .2s",
                                  }}
                                >
                                  <img
                                    src={img.url}
                                    alt="turf"
                                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                  />

                                  {/* Cover badge */}
                                  {img.is_cover ? (
                                    <span
                                      className="badge bg-primary position-absolute"
                                      style={{ top: 6, left: 6, fontSize: 10 }}
                                    >
                                      <i className="bi bi-star-fill me-1"></i>Cover
                                    </span>
                                  ) : null}

                                  {/* Action overlay — shows on hover via CSS class */}
                                  <div
                                    className="position-absolute bottom-0 start-0 end-0 d-flex gap-1 p-1 justify-content-center"
                                    style={{ background: "rgba(0,0,0,0.55)" }}
                                  >
                                    {/* Set cover (hidden if already cover) */}
                                    {!img.is_cover && (
                                      <button
                                        className="btn btn-sm btn-warning py-0 px-2"
                                        title="Set as cover"
                                        onClick={() => handleSetCover(img.id)}
                                        disabled={settingCoverId === img.id}
                                        style={{ fontSize: 11 }}
                                      >
                                        {settingCoverId === img.id
                                          ? <span className="spinner-border spinner-border-sm" style={{ width: 10, height: 10 }} />
                                          : <><i className="bi bi-star" /> Cover</>
                                        }
                                      </button>
                                    )}

                                    {/* Replace */}
                                    <button
                                      className="btn btn-sm btn-info py-0 px-2"
                                      title="Replace image"
                                      onClick={() => openReplace(img.id)}
                                      disabled={replacingId === img.id}
                                      style={{ fontSize: 11 }}
                                    >
                                      {replacingId === img.id
                                        ? <span className="spinner-border spinner-border-sm" style={{ width: 10, height: 10 }} />
                                        : <><i className="bi bi-arrow-repeat" /> Replace</>
                                      }
                                    </button>

                                    {/* Delete */}
                                    <button
                                      className="btn btn-sm btn-danger py-0 px-2"
                                      title="Delete image"
                                      onClick={() => openDeleteConfirm(img.id)}
                                      disabled={deletingId === img.id}
                                      style={{ fontSize: 11 }}
                                    >
                                      {deletingId === img.id
                                        ? <span className="spinner-border spinner-border-sm" style={{ width: 10, height: 10 }} />
                                        : <i className="bi bi-trash" />
                                      }
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* ── End threeA ── */}

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