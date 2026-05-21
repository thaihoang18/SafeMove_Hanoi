import { ChevronLeft, Star, Filter } from "lucide-react";
import { useState } from "react";
import "../styles/demo-reviews.css";

type Review = {
  id: number;
  author: string;
  rating: number;
  date: string;
  text: string;
  avatar?: string;
  helpful?: number;
};

type Props = {
  locationName: string;
  reviews: Review[];
  onBack: () => void;
};

export function ReviewsListView({ locationName, reviews, onBack }: Props) {
  const [sortBy, setSortBy] = useState<"recent" | "rating-high" | "rating-low">("recent");

  // Calculate statistics
  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const ratingDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  const maxCount = Math.max(...Object.values(ratingDistribution)) || 1;

  // Sort reviews
  let sortedReviews = [...reviews];
  if (sortBy === "rating-high") {
    sortedReviews.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === "rating-low") {
    sortedReviews.sort((a, b) => a.rating - b.rating);
  }

  return (
    <div className="demo-reviews-container">
      {/* Header */}
      <header className="reviews-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <h2 className="header-title">{locationName}</h2>
        <div className="header-spacer"></div>
      </header>

      {/* Main Content */}
      <main className="reviews-scrollable-content">
        {/* Rating Summary */}
        <div className="rating-summary-box">
          <div className="big-score">{averageRating}</div>
          <div className="stars-display">
            {Array(Math.round(Number(averageRating)))
              .fill(0)
              .map((_, i) => (
                <Star key={i} size={18} fill="#ffc107" color="#ffc107" />
              ))}
            {Array(5 - Math.round(Number(averageRating)))
              .fill(0)
              .map((_, i) => (
                <Star key={i + 5} size={18} color="#ddd" />
              ))}
          </div>
          <div className="total-reviews-count">Total {reviews.length} reviews</div>
        </div>

        {/* Distribution Graph */}
        <div className="distribution-graph-card">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="graph-row">
              <span className="star-label">{stars}</span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${(ratingDistribution[stars as keyof typeof ratingDistribution] / maxCount) * 100}%` }}
                />
              </div>
              <span className="bar-count">{ratingDistribution[stars as keyof typeof ratingDistribution]}</span>
            </div>
          ))}
        </div>

        {/* List Header with Sort */}
        <div className="list-header-row">
          <span className="list-title">Reviews</span>
          <select
            className="sort-dropdown-btn"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "recent" | "rating-high" | "rating-low")}
          >
            <option value="recent">📅 Recent</option>
            <option value="rating-high">⭐ Highest</option>
            <option value="rating-low">⭐ Lowest</option>
          </select>
        </div>

        {/* Reviews List */}
        <div className="all-reviews-list">
          {sortedReviews.length > 0 ? (
            sortedReviews.map((review) => (
              <div key={review.id} className="review-card-full">
                <div className="review-header-row">
                  <span className="review-avatar">{review.avatar || "👤"}</span>
                  <div className="review-meta">
                    <h5 className="review-author">{review.author}</h5>
                    <div className="review-rating">
                      {Array(review.rating)
                        .fill(0)
                        .map((_, i) => (
                          <Star key={i} size={12} fill="#ffc107" color="#ffc107" />
                        ))}
                      {Array(5 - review.rating)
                        .fill(0)
                        .map((_, i) => (
                          <Star key={i + 5} size={12} color="#ddd" />
                        ))}
                    </div>
                  </div>
                  <span className="review-date">{review.date}</span>
                </div>
                <p className="review-body">"{review.text}"</p>
                {review.helpful !== undefined && (
                  <div className="review-footer">
                    <button className="helpful-btn">👍 Helpful ({review.helpful})</button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-reviews-message">
              <p>No reviews yet</p>
              <small>Be the first to share your experience!</small>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
