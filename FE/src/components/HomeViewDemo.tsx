import { RefreshCw, MapPin } from "lucide-react";
import type { DashboardResponse, GpsAqiMeasurement } from "@/lib/types";
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
  const aqi = gpsAqi?.aqi ?? dashboard?.nearestAqi?.aqi ?? null;
  const locationName = gpsAqi?.location_name ?? dashboard?.nearestAqi?.location_name ?? "データなし";
  const source = gpsAqi?.source ?? "system";
  const coordinates = gpsCoords ? `(${gpsCoords.lat.toFixed(3)}, ${gpsCoords.lng.toFixed(3)})` : "";

  const getAqiLabel = (value: number | null) => {
    if (value === null) return "データなし";
    if (value <= 50) return "良好";
    if (value <= 100) return "普通";
    if (value <= 150) return "敏感な人には不向き";
    return "健康に良くない";
  };

  const getAqiAdvice = (value: number | null) => {
    if (value === null) {
      return {
        title: "AQIは未取得です",
        body: advice?.body ?? "データを更新すると、現在の空気品質に合わせたアドバイスを表示できます。",
      };
    }

    if (value <= 50) {
      return {
        title: "AQIは良好です",
        body: "屋外で通常どおり活動できます。運動する場合も、準備運動と十分な水分補給を忘れないでください。",
      };
    }

    if (value <= 100) {
      return {
        title: "AQIは普通です",
        body: "外出は可能ですが、強度の高い長時間の活動は控えめにし、呼吸器症状に注意してください。",
      };
    }

    if (value <= 150) {
      return {
        title: "敏感な人には不向きです",
        body: "高齢者、子ども、呼吸器疾患のある方は外出を控えめにしてください。移動が必要な場合は、短いルートを選びましょう。",
      };
    }

    if (value <= 200) {
      return {
        title: "AQIが悪化しています",
        body: "屋外活動は控え、屋内を優先してください。移動が必要な場合は、粒子ろ過マスクの使用をおすすめします。",
      };
    }

    return {
      title: "AQIが非常に悪いです",
      body: "できるだけ屋内に留まり、窓を閉め、必要な場合のみ外出してください。移動時は暴露時間を最小限にしましょう。",
    };
  };

  const adviceContent = aqi === null ? { title: advice?.title ?? "健康アドバイス", body: advice?.body ?? "プロフィールを更新すると、より適切なアドバイスを受け取れます。" } : getAqiAdvice(aqi);

  const weather = {
    temp: (gpsAqi as GpsAqiMeasurement | null)?.temperature ?? "-",
    humidity: (gpsAqi as GpsAqiMeasurement | null)?.humidity ?? "-",
    location: gpsAqi?.location_name ?? "Hanoi",
  };

  return (
    <div className="demo-home-container">
      {/* AQI Circle Section */}
      <div className="aqi-section">
        <div className="aqi-circle-border" onClick={onOpenAqiAlert}>
          <div className="aqi-value">{aqi ?? "--"}</div>
          <div className="aqi-label">AQI・{getAqiLabel(aqi)}</div>
        </div>
      </div>

      {/* Source Selector */}
      <div className="source-container">
        <button className="source-btn active" onClick={() => onRefreshGpsAqi()}>
          <span className="dot green"></span> 主な情報源: IQAir
        </button>
        <button className="source-btn disabled">
          <span className="dot"></span> 代替情報源: 更新中
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
          <button className="refresh-btn" onClick={onRefreshGpsAqi} disabled={gpsLoading}>
            <RefreshCw size={18} />
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
        {gpsError && <div className="error-text">{gpsError}</div>}
      </div>

    </div>
  );
}
