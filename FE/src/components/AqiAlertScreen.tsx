import { ArrowLeft } from "lucide-react";
import type { PlaceCatalogItem } from "@/lib/guest-exercise-places";
import type { GpsAqiMeasurement } from "@/lib/types";
import "../styles/demo-alert.css";

type Props = {
  gpsAqi: GpsAqiMeasurement | null;
  gpsCoords: { lat: number; lng: number } | null;
  locations: PlaceCatalogItem[];
  onBack: () => void;
  onOpenSuggestion: (location: PlaceCatalogItem) => void;
};

export function AqiAlertScreen({ gpsAqi, gpsCoords, locations, onBack, onOpenSuggestion }: Props) {
  const aqiValue = gpsAqi?.aqi ?? null;
  const aqiLabel = aqiValue === null ? "--" : `${aqiValue}`;
  const aqiStatus =
    aqiValue === null
      ? "未取得"
      : aqiValue <= 50
      ? "良好"
      : aqiValue <= 100
      ? "普通"
      : aqiValue <= 150
      ? "注意"
      : "危険";
  const alertText =
    aqiValue === null
      ? "現在のAQIデータはありません。後でもう一度お試しください。"
      : aqiValue > 150
      ? "汚染レベルが非常に高いです。外出を控え、屋内運動を優先し、標準的なマスクを着用してください。"
      : aqiValue > 100
      ? "空気の質が悪化しています。屋外活動の強度を下げ、より清潔な場所を選びましょう。"
      : "空気の状態は許容範囲です。必要に応じて、より安全な運動場所を検討できます。";

  const expertAdviceText =
    aqiValue === null
      ? "AQIデータを取得できません。後ほど再試行してください。"
      : aqiValue > 150
      ? "外出が必要な場合はN95マスクを使用し、空気清浄設備のある場所を選んでください。AQIが150を超えるときは屋内運動が最も安全です。"
      : aqiValue > 100
      ? "長時間の激しい屋外運動は避けてください。特に呼吸器系に敏感な方は、屋内のスポーツ施設を利用することをお勧めします。"
      : aqiValue > 50
      ? "空気の質は概ね良好ですが、敏感な方は異常を感じた場合、運動の強度を下げてください。"
      : "空気の質は非常に良好です。屋外での運動やアクティビティを最大限に楽しむことができます。";

  const isIndoor = (loc: PlaceCatalogItem) => 
    loc.filter_type === "gym" || 
    loc.location_type === "indoor_place" || 
    (loc.categories || "").toLowerCase().includes("gym");

  const indoorLocations = locations.filter(isIndoor);
  const candidateList = indoorLocations.length > 0 ? indoorLocations : locations;

  const suggestion = [...candidateList].sort((a, b) => {
    // 1. Nearest (bucketed by 0.1km ~ 100m)
    const distDiff = Math.round((a.distance_km ?? 999) * 10) - Math.round((b.distance_km ?? 999) * 10);
    if (distDiff !== 0) return distDiff;

    // 2. Cleanest (lowest AQI)
    const aqiDiff = (a.aqi_level ?? 999) - (b.aqi_level ?? 999);
    if (aqiDiff !== 0) return aqiDiff;

    // 3. Highest rating
    const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
    if (ratingDiff !== 0) return ratingDiff;

    // 4. JP friendly
    const aJp = a.is_japan_friendly ? 1 : 0;
    const bJp = b.is_japan_friendly ? 1 : 0;
    return bJp - aJp;
  })[0] ?? locations[0];

  const distanceText = suggestion?.distance_km ? `${suggestion.distance_km.toFixed(1)} km` : "0.8 km";

  return (
    <div className="demo-alert-container">
      <header className="alert-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={16} /> ホーム
        </button>
      </header>

      <main className="alert-content">
        {/* add zone class to control color based on AQI */}
        <section
          className={`health-alert-zone ${
            aqiValue === null
              ? "zone-unknown"
              : aqiValue <= 50
              ? "zone-good"
              : aqiValue <= 100
              ? "zone-moderate"
              : aqiValue <= 150
              ? "zone-sensitive"
              : "zone-danger"
          }`}
        >
          <span className="alert-label">⚠️ 健康警告</span>
          <h1 className="huge-aqi-value">{aqiLabel}</h1>
          <div className="aqi-level-badge">{aqiStatus}</div>
          <p className="alert-message-text">{alertText}</p>
        </section>

        <div className="suggestion-header-row">
          <h3 className="section-title-alert">安全な運動スポット</h3>
          <span className="recommend-tag">おすすめ</span>
        </div>

        <div className="spot-suggestion-card">
          {(() => {
            const haystack = [
              suggestion?.name,
              suggestion?.location_type,
              suggestion?.categories,
              suggestion?.description
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            
            let fallbackImg = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80"; // gym
            if (/(cong vien|park|garden|outdoor)/.test(haystack)) {
              fallbackImg = "https://static.vinwonders.com/production/cong-vien-1.jpg";
            } else if (/(stadium|court|track|arena|sports complex|sport|gymnastics|boxing|martial arts|badminton|tennis|basketball|football|futsal|swimming|pool)/.test(haystack)) {
              fallbackImg = "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=600&q=80";
            }

            const imgSrc = suggestion?.featured_image || fallbackImg;

            return (
              <img
                src={imgSrc}
                alt={suggestion?.name || "spot"}
                className="spot-card-img"
                onError={(e) => {
                  e.currentTarget.src = fallbackImg;
                }}
              />
            );
          })()}

          <div className="spot-card-body">
            <div className="spot-card-info">
              <h4 className="spot-title">{suggestion?.name ?? "おすすめスポット"}</h4>
              <p className="spot-meta">📍 約 {distanceText}</p>
              <div className="spot-amenities-badges">
                <span className="amenity-mini">きれいな空気</span>
                <span className="amenity-mini">開放的な空間</span>
              </div>
            </div>
            <div className="spot-card-rating">
              <span className="rating-num">{suggestion?.rating ?? 4.8}</span>
            </div>
          </div>

          <button
            className="btn-route-guidance"
            onClick={() => suggestion && onOpenSuggestion(suggestion)}
            disabled={!suggestion}
          >
            💚 詳細を見る
          </button>
        </div>

        <div className="expert-advice-card">
          <div className="expert-header">
            <span className="expert-icon">👨‍⚕️</span>
            <h4>専門家のアドバイス</h4>
          </div>
          <p className="expert-text">
            {expertAdviceText}
          </p>
        </div>
      </main>
    </div>
  );
}
