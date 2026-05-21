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
  const locationName = gpsAqi?.location_name ?? dashboard?.nearestAqi?.location_name ?? "Chưa có dữ liệu";
  const source = gpsAqi?.source ?? "system";
  const coordinates = gpsCoords ? `(${gpsCoords.lat.toFixed(3)}, ${gpsCoords.lng.toFixed(3)})` : "";

  const getAqiLabel = (value: number | null) => {
    if (value === null) return "N/A";
    if (value <= 50) return "Good";
    if (value <= 100) return "Moderate";
    if (value <= 150) return "Sensitive";
    return "Unhealthy";
  };

  const getAqiAdvice = (value: number | null) => {
    if (value === null) {
      return {
        title: "Chưa có AQI",
        body: advice?.body ?? "Hãy làm mới dữ liệu để nhận lời khuyên theo chất lượng không khí hiện tại.",
      };
    }

    if (value <= 50) {
      return {
        title: "AQI tốt",
        body: "Có thể hoạt động ngoài trời bình thường. Nếu tập luyện, vẫn nên khởi động và uống đủ nước.",
      };
    }

    if (value <= 100) {
      return {
        title: "AQI trung bình",
        body: "Bạn có thể ra ngoài, nhưng nên giảm cường độ hoạt động dài hơn bình thường và theo dõi triệu chứng hô hấp.",
      };
    }

    if (value <= 150) {
      return {
        title: "AQI kém cho nhóm nhạy cảm",
        body: "Người lớn tuổi, trẻ nhỏ và người có bệnh hô hấp nên hạn chế ra ngoài. Nếu cần đi lại, hãy chọn lộ trình ngắn hơn.",
      };
    }

    if (value <= 200) {
      return {
        title: "AQI xấu",
        body: "Nên hạn chế hoạt động ngoài trời, ưu tiên ở trong nhà và dùng khẩu trang lọc bụi nếu bắt buộc phải di chuyển.",
      };
    }

    return {
      title: "AQI rất xấu",
      body: "Tốt nhất ở trong nhà, đóng cửa sổ và chỉ ra ngoài khi thật sự cần thiết. Nếu phải đi, hãy giảm thời gian tiếp xúc tối đa.",
    };
  };

  const adviceContent = aqi === null ? { title: advice?.title ?? "Health Advice", body: advice?.body ?? "Keep profile updated for better recommendations" } : getAqiAdvice(aqi);

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
          <div className="aqi-label">AQI • {getAqiLabel(aqi)}</div>
        </div>
      </div>

      {/* Source Selector */}
      <div className="source-container">
        <button className="source-btn active" onClick={() => onRefreshGpsAqi()}>
          <span className="dot green"></span> Main source: IQAir
        </button>
        <button className="source-btn disabled">
          <span className="dot"></span> Backup source: Đang cập nhật
        </button>
      </div>

      {/* Air Quality Status */}
      <div className="status-box">
        <div className="status-headline">
          <h2>{getAqiLabel(aqi)} Air Quality</h2>
        </div>
        <p>{aqi === null ? "Unable to determine air quality" : aqi <= 50 ? "Ideal for outdoor activities" : "Consider limiting outdoor activities"}</p>
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
              <span className="humidity">Humidity {weather.humidity}%</span>
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
          <span className="info-label-small">Source:</span> {source} {coordinates}
        </div>
        {gpsError && <div className="error-text">{gpsError}</div>}
      </div>

    </div>
  );
}
