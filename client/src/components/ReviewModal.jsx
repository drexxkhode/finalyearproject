import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import StarRating from "./StarRating";
console.log("SystemReviewModal rendered");

const API = import.meta.env.VITE_API_URL; // Change if your project uses Vite

export default function SystemReviewModal({
  onClose,
  bookingRef,
}) {
  const sheetRef = useRef(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Prevent background scrolling
  useEffect(() => {
    const prev = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
        document.body.style.overflow = prev;
    };
}, []);

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
        onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}
        style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(10,10,20,.75)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "stretch",
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

                <div
                    className="tf-modal-handle"
                    style={{
                        width: 36,
                        height: 4,
                        borderRadius: 2,
                        background: "#dee2e6",
                        margin: "0 auto 18px",
                    }}
                />

                <div
                    style={{
                        fontSize: 34,
                        textAlign: "center",
                        marginBottom: 8,
                    }}
                >
                    ⭐
                </div>

                <h5 className="fw-bolder text-center mb-2">
                    Help Us Improve
                </h5>

                <p className="text-muted text-center mb-4">
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

            </div>

            <div
                className="d-flex gap-2"
                style={{
                    padding: "12px 20px 28px",
                    borderTop: "1px solid #f0f0f0",
                }}
            >

                <button
                    className="btn btn-outline-secondary fw-bold flex-grow-1"
                    onClick={onClose}
                    disabled={loading}
                >
                    Skip
                </button>

                <button
                    className="btn btn-primary fw-bold flex-grow-1"
                    onClick={submit}
                    disabled={loading || rating === 0}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Submitting...
                        </>
                    ) : (
                        "Submit"
                    )}
                </button>

            </div>
        </div>
    </div>,
    document.body
);
}