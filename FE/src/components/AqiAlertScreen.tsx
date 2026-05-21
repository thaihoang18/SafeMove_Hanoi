import { ArrowLeft } from "lucide-react";
import type { PlaceCatalogItem } from "@/lib/guest-exercise-places";
import type { GpsAqiMeasurement } from "@/lib/types";
import "../styles/demo-alert.css";

type Props = {
  gpsAqi: GpsAqiMeasurement | null;
  gpsCoords: { lat: number; lng: number } | null;
  locations: PlaceCatalogItem[];
  onBack: () => void;
  onOpenRoute: () => void;
};

export function AqiAlertScreen({ gpsAqi, gpsCoords, locations, onBack, onOpenRoute }: Props) {
  const aqiValue = gpsAqi?.aqi ?? null;
  const aqiLabel = aqiValue === null ? "--" : `${aqiValue}`;
  const aqiStatus =
    aqiValue === null
      ? "Không xác định"
      : aqiValue <= 50
      ? "Tốt"
      : aqiValue <= 100
      ? "Trung bình"
      : aqiValue <= 150
      ? "Nhạy cảm"
      : "Nguy hiểm";
  const alertText =
    aqiValue === null
      ? "Không có dữ liệu AQI hiện tại. Hãy thử lại sau." 
      : aqiValue > 150
      ? "Ô nhiễm đang ở mức rất cao. Hạn chế ra ngoài, ưu tiên tập trong nhà và đeo khẩu trang chuẩn." 
      : aqiValue > 100
      ? "Chất lượng không khí đang kém. Giảm cường độ hoạt động ngoài trời và chọn địa điểm sạch hơn." 
      : "Không khí đang ở mức chấp nhận được. Bạn có thể cân nhắc tới nơi tập an toàn hơn nếu cần.";

  const suggestion = locations
    .filter((location) => typeof location.aqi_level === "number")
    .sort((a, b) => (a.aqi_level ?? 999) - (b.aqi_level ?? 999))[0] ?? locations[0];

  const distanceText = suggestion?.distance_km ? `${suggestion.distance_km.toFixed(1)} km` : "0.8 km";

  return (
    <div className="demo-alert-container">
      <header className="alert-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={18} /> Home
        </button>
      </header>

      <main className="alert-content">
        <section className="health-alert-zone">
          <span className="alert-label">⚠️ Cảnh báo sức khỏe</span>
          <h1 className="huge-aqi-value">{aqiLabel}</h1>
          <div className="aqi-level-badge">{aqiStatus}</div>
          <p className="alert-message-text">{alertText}</p>
        </section>

        <div className="suggestion-header-row">
          <h3 className="section-title-alert">Địa điểm tập an toàn</h3>
          <span className="recommend-tag">Đề xuất</span>
        </div>

        <div className="spot-suggestion-card">
          {suggestion?.featured_image ? (
            <img src={suggestion.featured_image} alt={suggestion.name} className="spot-card-img" />
          ) : (
            <div className="spot-card-img placeholder">Ảnh</div>
          )}

          <div className="spot-card-body">
            <div className="spot-card-info">
              <h4 className="spot-title">{suggestion?.name ?? "Khuyến nghị địa điểm"}</h4>
              <p className="spot-meta">📍 khoảng {distanceText}</p>
              <div className="spot-amenities-badges">
                <span className="amenity-mini">Không khí sạch</span>
                <span className="amenity-mini">Không gian thoáng</span>
              </div>
            </div>
            <div className="spot-card-rating">
              <span className="rating-num">{suggestion?.rating ?? 4.8}</span>
            </div>
          </div>

          <button className="btn-route-guidance" onClick={onOpenRoute}>
            💚 Tìm lộ trình
          </button>
        </div>

        <div className="card expert-advice-card">
          <div className="expert-header">
            <span className="expert-icon">👨‍⚕️</span>
            <h4>Chuyên gia khuyên</h4>
          </div>
          <p className="expert-text">
            Nếu phải ra ngoài, hãy dùng khẩu trang N95 và chọn nơi có hệ thống lọc không khí. Tập trong nhà là lựa chọn an toàn nhất khi AQI trên 150.
          </p>
        </div>
      </main>
    </div>
  );
}
