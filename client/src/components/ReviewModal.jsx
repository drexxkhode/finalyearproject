import { useState } from "react";
import axios from "axios";
import StarRating from "./StarRating";

const API = import.meta.env.VITE_API_URL;

export default function SystemReviewModal({
    show,
    onClose,
    bookingRef
}) {

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    if (!show) return null;

    const submit = async () => {

        try {

            await axios.post(
                `${API}/reviews/system-reviews`,
                {
                    paystack_ref: bookingRef,
                    rating,
                    comment
                },
                {
                    headers:{
                        Authorization:`Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            onClose();

        } catch(err){
            console.log(err);
        }

    };

    return (
        <>
            <div
                className="modal-backdrop fade show"
                onClick={onClose}
            />

            <div className="review-modal">

                <div className="review-modal-content">

                    <button
                        className="btn-close float-end"
                        onClick={onClose}
                    />

                    <h4>Help us improve</h4>

                    <p>
                        How was your booking experience?
                    </p>

                    <StarRating
                        rating={rating}
                        setRating={setRating}
                    />

                    <textarea
                        className="form-control mt-3"
                        rows={4}
                        placeholder="Tell us what can be improved..."
                        value={comment}
                        onChange={(e)=>setComment(e.target.value)}
                    />

                    <div className="d-flex justify-content-end gap-2 mt-3">

                        <button
                            className="btn btn-outline-secondary"
                            onClick={onClose}
                        >
                            Skip
                        </button>

                        <button
                            className="btn btn-primary"
                            disabled={rating===0}
                            onClick={submit}
                        >
                            Submit
                        </button>

                    </div>

                </div>

            </div>

        </>
    );

}