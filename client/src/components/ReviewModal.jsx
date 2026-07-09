import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import StarRating from "./StarRating";

const API = import.meta.env.VITE_API_URL; // Change if your project uses Vite

export default function SystemReviewModal({
  open,
  onClose,
  bookingRef,
}) {
  const sheetRef = useRef(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Prevent background scrolling
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!rating) {
      alert("Please select a rating.");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${API}/api/system-reviews`,
        {
          paystack_ref: bookingRef,
          rating,
          comment,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      onClose();
    } catch (err) {
      console.log(err);
      alert("Unable to submit review.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="tf-modal-overlay"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        className="tf-modal-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">

          <button
            className="btn-close float-end"
            onClick={onClose}
          />

          <h4 className="text-center mb-2">
            Help Us Improve
          </h4>

          <p className="text-center text-muted mb-4">
            How was your booking experience?
          </p>

          <div className="d-flex justify-content-center mb-4">
            <StarRating
              rating={rating}
              setRating={setRating}
            />
          </div>

          <textarea
            className="form-control"
            rows={4}
            placeholder="Tell us what can be improved (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="d-flex justify-content-end gap-2 mt-4">

            <button
              className="btn btn-outline-secondary"
              onClick={onClose}
            >
              Skip
            </button>

            <button
              className="btn btn-primary"
              disabled={loading || rating === 0}
              onClick={submit}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>

          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}