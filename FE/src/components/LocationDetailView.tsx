import { MapPin, Star, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import type { PlaceCatalogItem } from "@/lib/guest-exercise-places";
import { fetchIqAirAqiByCoordinates } from "@/lib/api";
import type { GpsAqiMeasurement, LocationReview } from "@/lib/types";
import "../styles/demo-detail.css";

type Props = {
  location: PlaceCatalogItem | null;
  onOpenRoute: () => void;
  onOpenReviews?: () => void;
  isGuest: boolean;
  onRequireLogin?: () => void;
  reviews: LocationReview[];
  reviewsLoading?: boolean;
  reviewsError?: string | null;
  onSubmitReview: (payload: { rating: number; content: string }) => Promise<void>;
};

export function LocationDetailView({
  location,
  onOpenRoute,
  onOpenReviews,
  isGuest,
  onRequireLogin,
  reviews,
  reviewsLoading = false,
  reviewsError,
  onSubmitReview,
}: Props) {
  const [reviewText, setReviewText] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [aqiMeasurement, setAqiMeasurement] = useState<GpsAqiMeasurement | null>(null);
  const [aqiLoading, setAqiLoading] = useState(false);
  const [aqiError, setAqiError] = useState<string | null>(null);

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      alert("Please enter a review");
      return;
    }

    if (userRating < 1) {
      alert("Please choose a star rating");
      return;
    }

    if (isGuest) {
      onRequireLogin?.();
      return;
    }

    setSubmittingReview(true);

    try {
      await onSubmitReview({ rating: userRating, content: reviewText.trim() });
      setReviewText("");
      setUserRating(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not submit review.";
      alert(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!location) {
      setAqiMeasurement(null);
      setAqiError(null);
      return;
    }

    const controller = new AbortController();
    setAqiLoading(true);
    setAqiError(null);

    fetchIqAirAqiByCoordinates(location.lat, location.lng, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!controller.signal.aborted) {
          setAqiMeasurement(response.measurement);
        }
      })
      .catch((error) => {
        if (
          controller.signal.aborted ||
          (error instanceof Error && error.name === "AbortError") ||
          (typeof error === "object" && error !== null && "name" in error && (error as any).name === "AbortError")
        ) {
          return;
        }

        console.error("Failed to load IQAir AQI:", error);
        setAqiError("Không thể tải chỉ số AQI từ IQAir.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAqiLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [location]);

  if (!location) {
    return (
      <div className="demo-detail-container">
        <div className="empty-state">
          <MapPin size={48} className="empty-icon" />
          <p>No location selected</p>
        </div>
      </div>
    );
  }

  const safetyScore = location.aqi_level ? Math.max(0, 100 - location.aqi_level * 2) : 85;
  const apiAqi = aqiMeasurement?.aqi ?? null;
  const apiPm25 = apiAqi != null ? (apiAqi * 0.4).toFixed(1) : null;
  const smallCircleValue = apiAqi ?? Math.round(safetyScore);
  const smallCircleLabel = apiAqi != null ? "AQI" : "Safety";
  const pm25Value = apiPm25 ?? (location.aqi_level ? (location.aqi_level * 0.4).toFixed(1) : "15.5");

  return (
    <div className="demo-detail-container">
      {/* Header - Location Title */}
      <div className="detail-header">
        <span className="green-sub-badge">📍 Safe Spot</span>
        <h2 className="detail-title">{location.name}</h2>
        <p className="detail-location">
          <MapPin size={14} className="inline" />
          {location.address || "Hanoi, Vietnam"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-circle-box">
          <div className="small-aqi-circle">
            <div className="circle-value">{smallCircleValue}</div>
            <div className="circle-label">{smallCircleLabel}</div>
          </div>
          <span className="stat-desc">
            {apiAqi != null ? "Real-time AQI from IQAir" : "Safe Score"}
            <br />
            <small className="green-text">{apiAqi != null ? "Updated from API" : "Estimated"}</small>
          </span>
        </div>
        <div className="stat-pm25-box">
          <span className="pm25-title">🍃 PM2.5</span>
          <span className="pm25-value">{pm25Value} µg/m³</span>
          <p className="pm25-desc">Within WHO standards</p>
        </div>
      </div>

      {aqiLoading && !apiAqi && (
        <div className="aqi-loading-note">Đang tải chỉ số AQI...</div>
      )}
      {aqiError && (
        <div className="aqi-error-message">Lỗi AQI: {aqiError}</div>
      )}

      {/* Amenities */}
      {Array.isArray(location.amenities) && location.amenities.length > 0 && (
        <div className="amenities-section">
          <h4>Facilities</h4>
          <div className="amenities-tags">
            {location.amenities.map((amenity, idx) => (
              <span key={idx} className="amenity-tag">
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Introduction Card */}
      <div className="card intro-card">
        <h4>About</h4>
        <p>
          {location.description ||
            "Beautiful and safe outdoor space. Perfect for exercise and recreation with excellent air quality."}
        </p>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <div className="reviews-header-row">
          <h4>Reviews ({reviews.length})</h4>
          {onOpenReviews && (
            <button className="view-all-link" onClick={onOpenReviews}>
              View All
            </button>
          )}
        </div>

        {/* Review Input Box */}
        {!isGuest && (
          <div className="input-review-box">
            <textarea
              className="review-textarea"
              placeholder="Share your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
            <div className="review-footer">
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`star-btn ${star <= userRating ? "active" : ""}`}
                    onClick={() => setUserRating(star)}
                  >
                    <Star size={16} fill={star <= userRating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <button className="btn-submit-review" onClick={handleSubmitReview} disabled={submittingReview}>
                {submittingReview ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        )}

        {isGuest && (
          <div className="login-prompt">
            <p>Please login to write a review</p>
            <button className="btn-login" onClick={onRequireLogin}>
              Login
            </button>
          </div>
        )}

        {/* Reviews List */}
        <div className="reviews-list">
          {reviewsError && <p className="no-reviews">{reviewsError}</p>}
          {reviewsLoading ? (
            <p className="no-reviews">Loading reviews...</p>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="rev-user-info">
                  <span className="rev-avatar">{review.author.slice(0, 1).toUpperCase()}</span>
                  <div className="rev-user-details">
                    <h5>{review.author}</h5>
                    <span className="stars">
                      {Array(review.rating)
                        .fill(0)
                        .map((_, i) => (
                          <Star key={i} size={12} fill="#ffc107" color="#ffc107" />
                        ))}
                    </span>
                  </div>
                  <span className="rev-date">{formatRelativeTime(review.created_at)}</span>
                </div>
                <p className="rev-text">"{review.content}"</p>
              </div>
            ))
          ) : (
            <p className="no-reviews">No reviews yet. Be the first to review!</p>
          )}
        </div>
      </div>

      {/* Floating Route Button */}
      <button className="floating-route-btn" onClick={onOpenRoute} title="Find routes to this location">
        <Activity size={20} />
      </button>
    </div>
  );
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "Just now";
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return "Just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
