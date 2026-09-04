// components/common/ReviewSection.js
// Reusable reviews block for the hostel and kitchen detail pages.
// - Shows the average rating + the list of real reviews (public).
// - If the logged-in student has actually booked this hostel / ordered from
//   this kitchen, shows a small form so they can leave (or edit) a review.
// Styling matches the existing dark theme used across the detail pages
// (#1E201E cards, #59636e borders, #3C3D37 / #697565 buttons, white text).
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { FaStar } from "react-icons/fa";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const StarRow = ({ value }) => (
  <span className="inline-flex items-center">
    {[...Array(5)].map((_, i) => (
      <FaStar key={i} color={i < Math.round(value) ? "#FFD700" : "#6b7280"} />
    ))}
  </span>
);

const ReviewSection = ({ targetType, targetId }) => {
  const [data, setData] = useState({ average: 0, count: 0, reviews: [] });
  const [eligible, setEligible] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const token = Cookies.get("token");

  const loadReviews = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/reviews/${targetType}/${targetId}`
      );
      setData(res.data || { average: 0, count: 0, reviews: [] });
    } catch (e) {
      // Leave the default empty state on error.
    }
  }, [targetType, targetId]);

  const loadEligibility = useCallback(async () => {
    if (!token) {
      setEligible(false);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/reviews/eligibility`, {
        params: { target_type: targetType, target_id: targetId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setEligible(!!res.data.eligible);
      if (res.data.myReview) {
        setMyReview(res.data.myReview);
        setRating(res.data.myReview.rating || 0);
        setText(res.data.myReview.review_text || "");
      }
    } catch (e) {
      setEligible(false);
    }
  }, [token, targetType, targetId]);

  useEffect(() => {
    if (targetId) {
      loadReviews();
      loadEligibility();
    }
  }, [targetId, loadReviews, loadEligibility]);

  const handleSubmit = async () => {
    setMessage("");
    if (!rating) {
      setMessage("Please pick a star rating first.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/reviews`,
        {
          target_type: targetType,
          target_id: targetId,
          rating,
          review_text: text,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(myReview ? "Your review was updated." : "Thanks for your review!");
      setMyReview({ rating, review_text: text });
      await loadReviews();
    } catch (err) {
      setMessage(
        err?.response?.data?.message || "Could not submit your review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 mb-16 rounded overflow-hidden shadow-lg bg-[#1E201E] border border-[#59636e] text-white">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-2xl">Reviews</h3>
          {data.count > 0 && (
            <div className="flex items-center gap-2">
              <StarRow value={data.average} />
              <span className="text-sm">
                {data.average} ({data.count})
              </span>
            </div>
          )}
        </div>

        {/* Review form — only for students who booked/ordered here */}
        {eligible && (
          <div className="mb-6 p-4 rounded border border-[#59636e] bg-[#25292e]">
            <p className="font-semibold mb-2">
              {myReview ? "Update your review" : "Leave a review"}
            </p>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="text-2xl leading-none focus:outline-none"
                  aria-label={`${n} star`}
                >
                  <FaStar color={(hover || rating) >= n ? "#FFD700" : "#6b7280"} />
                </button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Share your experience (optional)"
              className="w-full p-2 rounded bg-[#1E201E] border border-[#59636e] text-white text-sm focus:outline-none"
            />
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#3C3D37] hover:bg-[#697565] text-white px-4 py-2 rounded disabled:opacity-60"
              >
                {submitting ? "Saving..." : myReview ? "Update Review" : "Submit Review"}
              </button>
              {message && <span className="text-sm text-[#a5b68d]">{message}</span>}
            </div>
          </div>
        )}

        {/* Reviews list */}
        {data.reviews.length === 0 ? (
          <p className="text-sm text-gray-300">
            No reviews yet{eligible ? " — be the first to leave one!" : "."}
          </p>
        ) : (
          <div className="space-y-4">
            {data.reviews.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 p-3 rounded border border-[#59636e] bg-[#25292e]"
              >
                <img
                  src={r.image}
                  alt={r.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{r.name}</p>
                    <StarRow value={r.rating} />
                  </div>
                  {r.review && <p className="text-sm mt-1 text-gray-200">{r.review}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
