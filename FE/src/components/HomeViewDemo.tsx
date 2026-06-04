import { RefreshCw, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import type { DashboardResponse, GpsAqiMeasurement } from "@/lib/types";
import { fetchAqicnAqi } from "@/lib/api";
import "../styles/demo-home.css";

type Props = {
  dashboard: DashboardResponse | null;
  advice: { severity: string; title: string; body: string } | null;
  onOpenAqiAlert: () => void;
  gpsAqi: GpsAqiMeasurement | null;
  gpsCoords: { lat: number; lng: number } | null;
  gpsLoading: boolean;
  gpsError: string | null;
  onRefreshGpsAqi: () => void;
};

type AqiSource = "iqair" | "aqicn";

function getAqiLabel(value: number | null): string {
  if (value === null) return "データなし";
  if (value <= 50) return "良好";
  if (value <= 100) return "普通";
  if (value <= 150) return "敏感な人には不向き";
  if (value <= 200) return "健康に良くない";
  return "危険";
}

function getAqiColorClass(value: number | null): string {
  if (value === null) return "aqi-unknown";
  if (value <= 50) return "aqi-good";
  if (value <= 100) return "aqi-moderate";
  if (value <= 150) return "aqi-sensitive";
  if (value <= 200) return "aqi-bad";
  return "aqi-very-bad";
}

function getAqiAdvice(value: number | null): { title: string; body: string } {
  if (value === null) return { title: "AQIは未取得です", body: "データを更新すると、現在の空気品質に合わせたアドバイスを表示できます。" };
  if (value <= 50) return { title: "AQIは良好です", body: "屋外で通常どおり活動できます。運動する場合も、準備運動と十分な水分補給を忘れないでください。" };
  if (value <= 100) return { title: "AQIは普通です", body: "外出は可能ですが、強度の高い長時間の活動は控えめにし、呼吸器症状に注意してください。" };
  if (value <= 150) return { title: "敏感な人には不向きです", body: "高齢者、子ども、呼吸器疾患のある方は外出を控えめにしてください。移動が必要な場合は、短いルートを選びましょう。" };
  if (value <= 200) return { title: "AQIが悪化しています", body: "屋外活動は控え、屋内を優先してください。移動が必要な場合は、粒子ろ過マスクの使用をおすすめします。" };
  return { title: "AQIが非常に悪いです", body: "できるだけ屋内に留まり、窓を閉め、必要な場合のみ外出してください。移動時は暴露時間を最小限にしましょう。" };
}

/** Generate recommended exercise time slots based on current AQI */
function getRecommendedSlots(aqi: number | null): Array<{ time: string; label: string; safe: boolean; icon: string }> {
  const now = new Date();
  const hour = now.getHours();

  // Base slots: early morning, late afternoon, evening (Hanoi pattern)
  const slots = [
    { time: "05:00 – 07:00", label: "早朝", safe: true, icon: "🌅" },
    { time: "16:30 – 18:00", label: "夕方", safe: true, icon: "🌤" },
    { time: "19:00 – 20:30", label: "夜", safe: true, icon: "🌙" },
  ];

  if (aqi === null) {
    return slots.map(s => ({ ...s, safe: true }));
  }

  if (aqi > 150) {
    // Dangerous — no outdoor slots safe
    return [
      { time: "05:00 – 07:00", label: "早朝", safe: false, icon: "⛔" },
      { time: "16:30 – 18:00", label: "夕方", safe: false, icon: "⛔" },
      { time: "屋内施設", label: "終日推奨", safe: true, icon: "🏋️" },
    ];
  }

  if (aqi > 100) {
    // Moderate risk — only early morning marginally OK
    return [
      { time: "05:00 – 06:30", label: "早朝（短時間）", safe: true, icon: "🌅" },
      { time: "16:30 – 18:00", label: "夕方", safe: false, icon: "⚠️" },
      { time: "19:00 – 20:30", label: "夜", safe: false, icon: "⚠️" },
    ];
  }

  // Good / moderate AQI — all slots safe, highlight best one
  // Avoid midday heat (10–14h) in Hanoi
  if (hour >= 10 && hour < 16) {
    return [
      { time: "05:00 – 07:00", label: "早朝（最適）", safe: true, icon: "⭐" },
      { time: "16:30 – 18:00", label: "夕方", safe: true, icon: "🌤" },
      { time: "19:00 – 20:30", label: "夜", safe: true, icon: "🌙" },
    ];
  }

  return slots;
}

export function HomeViewDemo({
  dashboard,
  advice,
  onOpenAqiAlert,
  gpsAqi,
  gpsCoords,
  gpsLoading,
  gpsError,
  onRefreshGpsAqi,
}: Props) {
  const [activeSource, setActiveSource] = useState<AqiSource>("iqair");
  const [aqicnData, setAqicnData] = useState<GpsAqiMeasurement | null>(null);
  const [aqicnLoading, setAqicnLoading] = useState(false);
  const [aqicnError, setAqicnError] = useState<string | null>(null);

  const handleSwitchToAqicn = async () => {
    setActiveSource("aqicn");
    if (aqicnData) return; // already loaded

    const lat = gpsCoords?.lat ?? 21.0041;
    const lng = gpsCoords?.lng ?? 105.8428;
    setAqicnLoading(true);
    setAqicnError(null);
    try {
      const res = await fetchAqicnAqi(lat, lng);
      setAqicnData(res.measurement);
    } catch (err) {
      setAqicnError(err instanceof Error ? err.message : "AQICN データ取得失敗");
    } finally {
      setAqicnLoading(false);
    }
  };

  const handleSwitchToIqair = () => {
    setActiveSource("iqair");
    onRefreshGpsAqi();
  };

  const displayedMeasurement = activeSource === "aqicn" && aqicnData ? aqicnData : gpsAqi;

  const aqi = displayedMeasurement?.aqi ?? dashboard?.nearestAqi?.aqi ?? null;
  const locationName = displayedMeasurement?.location_name ?? dashboard?.nearestAqi?.location_name ?? "データなし";
  const source = displayedMeasurement?.source ?? "system";
  const coordinates = gpsCoords ? `(${gpsCoords.lat.toFixed(3)}, ${gpsCoords.lng.toFixed(3)})` : "";

  const adviceContent = aqi === null
    ? { title: advice?.title ?? "健康アドバイス", body: advice?.body ?? "プロフィールを更新すると、より適切なアドバイスを受け取れます。" }
    : getAqiAdvice(aqi);

  const weather = {
    temp: (displayedMeasurement as GpsAqiMeasurement | null)?.temperature ?? "-",
    humidity: (displayedMeasurement as GpsAqiMeasurement | null)?.humidity ?? "-",
  };

  const recommendedSlots = getRecommendedSlots(aqi);
  const isLoading = activeSource === "iqair" ? gpsLoading : aqicnLoading;
  const error = activeSource === "iqair" ? gpsError : aqicnError;

  return (
    <div className="demo-home-container">
      {/* AQI Circle */}
      <div className="aqi-section">
        <div className={`aqi-circle-border ${getAqiColorClass(aqi)}`} onClick={onOpenAqiAlert}>
          <div className="aqi-value">{aqi ?? "--"}</div>
          <div className="aqi-label">AQI・{getAqiLabel(aqi)}</div>
        </div>
      </div>

      {/* Source Selector */}
      <div className="source-container">
        <button
          className={`source-btn ${activeSource === "iqair" ? "active" : ""}`}
          onClick={handleSwitchToIqair}
          disabled={isLoading}
        >
          <span className={`dot ${activeSource === "iqair" ? "green" : ""}`} />
          主な情報源: IQAir
          {activeSource === "iqair" && gpsLoading && <span className="source-loading">更新中...</span>}
        </button>
        <button
          className={`source-btn ${activeSource === "aqicn" ? "active" : ""}`}
          onClick={handleSwitchToAqicn}
          disabled={aqicnLoading}
        >
          <span className={`dot ${activeSource === "aqicn" ? "green" : ""}`} />
          代替情報源: AQICN
          {aqicnLoading && <span className="source-loading">取得中...</span>}
          {aqicnData && activeSource !== "aqicn" && <span className="source-loaded-badge">取得済</span>}
        </button>
      </div>

      {/* Air Quality Status */}
      <div className="status-box">
        <div className="status-headline">
          <h2>{getAqiLabel(aqi)} - 空気品質</h2>
        </div>
        <p>{aqi === null ? "空気品質を判定できません" : aqi <= 50 ? "屋外活動に適しています" : "屋外活動は控えめにすることをおすすめします"}</p>
      </div>

      {/* Advice Card */}
      <div className="advice-card">
        <div className="card-icon">💚</div>
        <div className="advice-content">
          <h3>{adviceContent.title}</h3>
          <p>{adviceContent.body}</p>
        </div>
      </div>

      {/* Recommended Exercise Time Slots */}
      <div className="time-slots-card">
        <div className="time-slots-header">
          <Clock size={16} className="time-slots-icon" />
          <h3>今日のおすすめ運動時間帯</h3>
        </div>
        <div className="time-slots-list">
          {recommendedSlots.map((slot, i) => (
            <div key={i} className={`time-slot-item ${slot.safe ? "safe" : "unsafe"}`}>
              <span className="slot-icon">{slot.icon}</span>
              <div className="slot-info">
                <span className="slot-time">{slot.time}</span>
                <span className="slot-label">{slot.label}</span>
              </div>
              <span className={`slot-badge ${slot.safe ? "badge-safe" : "badge-unsafe"}`}>
                {slot.safe ? "推奨" : "注意"}
              </span>
            </div>
          ))}
        </div>
        {aqi !== null && aqi > 100 && (
          <p className="time-slots-note">⚠️ 現在 AQI が高いため、屋内施設の利用をおすすめします。</p>
        )}
      </div>

      {/* Weather Info */}
      <div className="weather-row">
        <div className="weather-box">
          <div className="weather-summary">
            <span className="weather-icon">☀️</span>
            <div className="weather-text">
              <span className="temp">{weather.temp}°C</span>
              <span className="humidity">湿度 {weather.humidity}%</span>
            </div>
          </div>
          <button className="refresh-btn" onClick={activeSource === "iqair" ? onRefreshGpsAqi : handleSwitchToAqicn} disabled={isLoading}>
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Location Info */}
      <div className="location-info">
        <div className="info-item">
          <MapPin size={16} className="icon" />
          <span>{locationName}</span>
        </div>
        <div className="info-item">
          <span className="info-label-small">情報源:</span> {source} {coordinates}
        </div>
      </div>
    </div>
  );
}
