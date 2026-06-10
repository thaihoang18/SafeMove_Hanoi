import { MapPin, Star, Activity, ArrowLeft, Languages } from "lucide-react";
import { useState } from "react";
import type { PlaceCatalogItem } from "@/lib/guest-exercise-places";
import { translateReviewContent } from "@/lib/api";
import type { GpsAqiMeasurement, LocationReview } from "@/lib/types";
import { getAvatarPreset, getAvatarSelectionStyle, type AvatarSelection } from "@/lib/avatar-presets";
import "../styles/demo-detail.css";

type Props = {
  location: PlaceCatalogItem | null;
  onOpenRoute: () => void;
  onOpenReviews?: () => void;
  onBack?: () => void;
  isGuest: boolean;
  onRequireLogin?: () => void;
  onShowLogin?: () => void;
  reviews: LocationReview[];
  reviewsLoading?: boolean;
  reviewsError?: string | null;
  aqiMeasurement: GpsAqiMeasurement | null;
  aqiLoading?: boolean;
  aqiError?: string | null;
  onSubmitReview: (payload: { rating: number; content: string }) => Promise<void>;
  currentUserId: string;
  currentUserAvatarSelection: AvatarSelection;
};

export function LocationDetailView({
  location,
  onOpenRoute,
  onOpenReviews,
  onBack,
  isGuest,
  onRequireLogin,
  onShowLogin,
  reviews,
  reviewsLoading = false,
  reviewsError,
  aqiMeasurement,
  aqiLoading = false,
  aqiError,
  onSubmitReview,
  currentUserId,
  currentUserAvatarSelection,
}: Props) {
  const [reviewText, setReviewText] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  // Translate state: reviewId -> { translated, loading, shown }
  const [translateMap, setTranslateMap] = useState<Record<string, { text: string; loading: boolean; shown: boolean }>>({});

  async function handleTranslateReview(review: LocationReview) {
    const existing = translateMap[review.id];
    // Toggle off if already shown
    if (existing?.shown) {
      setTranslateMap((prev) => ({ ...prev, [review.id]: { ...existing, shown: false } }));
      return;
    }
    // If already fetched, just show it
    if (existing?.text) {
      setTranslateMap((prev) => ({ ...prev, [review.id]: { ...existing, shown: true } }));
      return;
    }
    // Fetch translation
    setTranslateMap((prev) => ({ ...prev, [review.id]: { text: "", loading: true, shown: false } }));
    try {
      const result = await translateReviewContent(review.content, "JA");
      setTranslateMap((prev) => ({
        ...prev,
        [review.id]: { text: result.translated, loading: false, shown: true },
      }));
    } catch {
      setTranslateMap((prev) => ({ ...prev, [review.id]: { text: "", loading: false, shown: false } }));
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      alert("コメントを入力してください。");
      return;
    }

    if (userRating < 1) {
      alert("星評価を選択してください。");
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
      const message = error instanceof Error ? error.message : "コメントを送信できませんでした。";
      alert(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!location) {
    return (
      <div className="demo-detail-container">
        <div className="empty-state">
          <MapPin size={48} className="empty-icon" />
          <p>スポットが選択されていません</p>
        </div>
      </div>
    );
  }

  const apiAqi = aqiMeasurement?.aqi ?? null;
  const apiPm25 = apiAqi != null ? (apiAqi * 0.4).toFixed(1) : null;
  const smallCircleValue = apiAqi ?? (aqiLoading ? null : "--");
  const smallCircleLabel = apiAqi != null ? "AQI" : aqiLoading ? "取得中" : "未取得";
  const pm25Value = apiPm25 ?? "--";

  return (
    <div className="demo-detail-container">
      {/* Header - Location Title */}
      <div className="detail-header">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-slate-100/90 text-slate-900 ring-1 ring-white/10 transition hover:bg-slate-100"
          aria-label="戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="detail-header-main">
          <h2 className="detail-title">{location.name}</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <span className="green-sub-badge" style={{ margin: 0 }}>📍 安全スポット</span>
          </div>
          <p className="detail-location">
            <MapPin size={14} className="inline" />
            {location.address || "ハノイ、ベトナム"}
          </p>
        </div>
        {!isGuest && (
          <div className="detail-actions">
            <button
              type="button"
              className="btn-directions"
              onClick={() => onOpenRoute?.()}
            >
              ルート案内
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-circle-box">
          <div className={`small-aqi-circle ${getAqiColorClass(apiAqi)}`}>
            <div className="circle-value">{smallCircleValue ?? "..."}</div>
            <div className="circle-label">{smallCircleLabel}</div>
          </div>
          <span className="stat-desc">
            {apiAqi != null ? "IQAir の AQI" : aqiLoading ? "AQI を取得中" : "AQI 未取得"}
            <br />
            <small className="green-text">{apiAqi != null ? "リアルタイム更新済み" : aqiLoading ? "しばらくお待ちください" : "推定値"}</small>
          </span>
        </div>
        <div className="stat-pm25-box">
          <span className="pm25-title">🍃 PM2.5</span>
          <span className="pm25-value">{pm25Value} µg/m³</span>
          <p className="pm25-desc">WHO の推奨範囲内</p>
        </div>
      </div>

      {aqiError && <div className="aqi-error-message">AQI エラー: {aqiError}</div>}

      {/* Amenities */}
      {Array.isArray(location.amenities) && location.amenities.length > 0 && (
        <div className="amenities-section">
          <h4>設備</h4>
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
        <h4>概要</h4>
        <p>
          {location.description ||
            "屋外環境が良く、安全に利用できます。空気の質が良好で、運動やリフレッシュに適しています。"}
        </p>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <div className="reviews-header-row">
          <h4>レビュー ({reviews.length})</h4>
          {onOpenReviews && (
            <button className="view-all-link" onClick={onOpenReviews}>
              すべて表示
            </button>
          )}
        </div>

        {/* Review Input Box */}
        {!isGuest && (
          <div className="input-review-box">
            <textarea
              className="review-textarea"
              placeholder="体験を共有してください..."
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
                {submittingReview ? "送信中..." : "送信"}
              </button>
            </div>
          </div>
        )}

        {isGuest && (
          <div className="login-prompt">
            <p>レビューを書くにはログインしてください</p>
            <button
              className="btn-login"
              onClick={() => {
                if (onShowLogin) {
                  onShowLogin();
                } else {
                  onRequireLogin?.();
                }
              }}
            >
              ログイン
            </button>
          </div>
        )}

        {/* Reviews List */}
        <div className="reviews-list">
          {reviewsError && <p className="no-reviews">{reviewsError}</p>}
          {reviewsLoading ? (
            <p className="no-reviews">レビューを読み込み中...</p>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="rev-user-info">
                  {review.user_id === currentUserId ? (
                    <span className="rev-avatar rev-avatar-custom" style={getAvatarSelectionStyle(currentUserAvatarSelection)}>
                      <img
                        src={getAvatarPreset(currentUserAvatarSelection.avatarId).src}
                        alt="あなたのアバター"
                        onError={(event) => {
                          event.currentTarget.src = getAvatarPreset(currentUserAvatarSelection.avatarId).fallbackSrc;
                        }}
                      />
                    </span>
                  ) : (
                    <span className="rev-avatar">{review.author.slice(0, 1).toUpperCase()}</span>
                  )}
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
                {/* Translate button */}
                <div className="rev-translate-row">
                  <button
                    type="button"
                    className="rev-translate-btn"
                    onClick={() => handleTranslateReview(review)}
                    disabled={translateMap[review.id]?.loading}
                  >
                    <Languages size={13} />
                    {translateMap[review.id]?.loading
                      ? "翻訳中..."
                      : translateMap[review.id]?.shown
                      ? "翻訳を非表示"
                      : "翻訳"}
                  </button>
                </div>
                {translateMap[review.id]?.shown && translateMap[review.id]?.text && (
                  <p className="rev-translated-text">🌐 {translateMap[review.id].text}</p>
                )}
              </div>
            ))
          ) : (
            <p className="no-reviews">レビューはまだありません。最初の投稿者になりましょう。</p>
          )}
        </div>
      </div>

      {/* Floating Route Button */}
      <button className="floating-route-btn" onClick={onOpenRoute} title="このスポットへのルートを検索">
        <Activity size={20} />
      </button>
    </div>
  );
}

function getAqiColorClass(value: number | null): string {
  if (value === null) return "aqi-unknown";
  if (value <= 50) return "aqi-good";
  if (value <= 100) return "aqi-moderate";
  if (value <= 150) return "aqi-sensitive";
  if (value <= 200) return "aqi-bad";
  return "aqi-very-bad";
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "たった今";
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return "たった今";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} 分前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} 時間前`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} 日前`;
}
