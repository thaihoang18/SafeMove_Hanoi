import { ArrowLeft, Lock, MapPin, Navigation } from "lucide-react";
import type { PlaceCatalogItem } from "@/lib/guest-exercise-places";
import "../styles/guest-route-preview.css";

type Props = {
  locations: PlaceCatalogItem[];
  onShowLogin: () => void;
  onBack: () => void;
};

export function GuestRoutePreview({ locations, onShowLogin, onBack }: Props) {
  const featured = locations.slice(0, 4);

  return (
    <div className="guest-route-preview">
      {/* Header */}
      <div className="grp-header">
        <button
          type="button"
          onClick={onBack}
          className="grp-back-btn"
          aria-label="戻る"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="grp-label">グリーンルート</div>
          <h2 className="grp-title">スマートにルート検索</h2>
        </div>
      </div>

      {/* Hero CTA */}
      <div className="grp-hero">
        <div className="grp-hero-icon">
          <Navigation size={32} />
        </div>
        <h3 className="grp-hero-heading">
          AQI に基づく会員向けルート
        </h3>
        <p className="grp-hero-body">
          ログインすると、運動先までの最適なグリーンルートを取得できます。汚染の少ない経路を選びましょう。
        </p>
        <button type="button" className="grp-cta-btn" onClick={onShowLogin}>
          <Lock size={15} />
          ログインして開始
        </button>
      </div>

      {/* Featured destinations preview */}
      <div className="grp-section-label">人気スポット</div>
      <div className="grp-cards">
        {featured.map((place, idx) => (
          <div key={place.id} className="grp-card">
            <div className="grp-card-icon">
              <MapPin size={16} />
            </div>
            <div className="grp-card-info">
              <div className="grp-card-name">{place.name}</div>
              <div className="grp-card-address">
                {place.address ?? place.district ?? "ハノイ"}
              </div>
              <div className="grp-card-meta">
                <span className={`grp-aqi-badge ${idx % 2 === 0 ? "good" : "moderate"}`}>
                  AQI {40 + idx * 8}
                </span>
                {place.rating != null && (
                  <span className="grp-rating">
                    ★ {place.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="grp-card-action"
              onClick={onShowLogin}
              aria-label={`${place.name} までのルートを取得`}
            >
              <Navigation size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Bottom reminder */}
      <div className="grp-footer-note">
        無料でログイン — 有料アカウントは不要です
      </div>
    </div>
  );
}
