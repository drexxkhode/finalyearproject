import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import StarRating from "./StarRating";

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export default function TurfReviewModal({
  turfId,
  bookingDate,
  turfName,
  onClose,
}) {
  const [rating, setRating]   = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const submit = async () => {
    if (!rating) {
      alert("Please select a rating.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${API}/reviews/create`,
        {
          turf_id: turfId,
          booking_date: bookingDate,
          message: message.trim() || 'No comment provided.',
          rating,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      alert("Thank you for your review!");
      onClose();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Unable to submit review.");
    } finally {
      setLoading(false);
    }
  };

  const skip = async () => {
    try {
      setDismissing(true);
      await axios.post(
        `${API}/reviews/dismiss`,
        { turf_id: turfId, booking_date: bookingDate },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
    } catch (err) {
      console.log(err);
      // fail silently — worst case it re-prompts next load, not worth blocking the user over
    } finally {
      setDismissing(false);
      onClose();
    }
  };

  return createPortal(
    <div
      className="tf-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) skip(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(10,10,20,.75)",
        display: "flex", flexDirection: "column",
        justifyContent: "flex-end", alignItems: "stretch",
      }}
    >
      <div
        className="tf-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 32px rgba(0,0,0,.22)",
          animation: "tfSlideUp .28s cubic-bezier(.32,1,.32,1)",
        }}
      >
        <div style={{ padding: "12px 20px 4px" }}>
          <div className="tf-modal-handle" style={{
            width: 36, height: 4, borderRadius: 2,
            background: "#dee2e6", margin: "0 auto 18px",
          }} />

          <div style={{ fontSize: 34, textAlign: "center", marginBottom: 8 }}>⭐</div>

          <h5 className="fw-bolder text-center mb-2">How was your visit?</h5>

          <p className="text-muted text-center mb-4">
            Tell us about your experience at <strong>{turfName}</strong>
          </p>

          <div className="d-flex justify-content-center mb-4">
            <StarRating rating={rating} setRating={setRating} />
          </div>

          <textarea
            className="form-control"
            rows={4}
            placeholder="Any comments? (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="d-flex gap-2" style={{ padding: "12px 20px 28px", borderTop: "1px solid #f0f0f0" }}>
          <button
            className="btn btn-outline-secondary fw-bold flex-grow-1"
            onClick={skip}
            disabled={loading || dismissing}
          >
            {dismissing ? <><span className="spinner-border spinner-border-sm me-2" />Skipping…</> : "Skip"}
          </button>
          <button
            className="btn btn-primary fw-bold flex-grow-1"
            onClick={submit}
            disabled={loading || dismissing || rating === 0}
          >
            {loading ? <><span className="spinner-border spinner-border-sm me-2" />Submitting…</> : "Submit"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}