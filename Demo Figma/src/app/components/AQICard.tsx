import { MapPin, TrendingDown, TrendingUp, Droplets, Thermometer, Eye } from "lucide-react";

export function AQICard({ aqi, location }: { aqi: number; location: string }) {
  const level =
    aqi <= 50 ? { label: "Tốt", color: "from-emerald-400 to-green-500", text: "text-emerald-50", advice: "Chất lượng không khí tuyệt vời. Hãy tận hưởng các hoạt động ngoài trời!" } :
    aqi <= 100 ? { label: "Trung bình", color: "from-teal-400 via-cyan-500 to-sky-500", text: "text-sky-50", advice: "Chấp nhận được. Người nhạy cảm nên cân nhắc giảm hoạt động mạnh kéo dài." } :
    aqi <= 150 ? { label: "Không lành mạnh (nhóm nhạy cảm)", color: "from-amber-400 to-orange-500", text: "text-orange-50", advice: "Người có bệnh hô hấp nên hạn chế ra ngoài và đeo khẩu trang N95." } :
    aqi <= 200 ? { label: "Không lành mạnh", color: "from-red-400 to-red-600", text: "text-red-50", advice: "Mọi người nên giảm hoạt động ngoài trời. Đeo khẩu trang khi ra ngoài." } :
    { label: "Rất nguy hiểm", color: "from-purple-500 to-fuchsia-700", text: "text-fuchsia-50", advice: "Nên ở trong nhà, đóng cửa sổ và bật máy lọc không khí." };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${level.color} p-5 sm:p-8 shadow-xl ${level.text}`}>
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full bg-white/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2 text-sm opacity-90 mb-2">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
          <span className="opacity-60">• Cập nhật 2 phút trước</span>
        </div>

        <div className="flex items-end gap-4 sm:gap-6 mb-5 sm:mb-6 flex-wrap">
          <div>
            <div className="text-5xl sm:text-7xl tracking-tight leading-none">{aqi}</div>
            <div className="text-xs sm:text-sm opacity-90 mt-1">Chỉ số AQI</div>
          </div>
          <div className="flex-1 min-w-[140px] sm:min-w-[180px]">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm ring-1 ring-white/30">
              {aqi < 100 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
              {aqi < 100 ? "Giảm 12 so với hôm qua" : "Tăng 8 so với hôm qua"}
            </div>
            <div className="mt-3 text-lg">{level.label}</div>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur rounded-2xl p-4 ring-1 ring-white/20 mb-5">
          <div className="text-sm leading-relaxed">{level.advice}</div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { icon: Droplets, label: "Độ ẩm", value: "72%" },
            { icon: Thermometer, label: "Nhiệt độ", value: "29°C" },
            { icon: Eye, label: "Tầm nhìn", value: "6 km" },
          ].map((s) => (
            <div key={s.label} className="bg-white/15 backdrop-blur rounded-xl p-2.5 sm:p-3 ring-1 ring-white/20">
              <s.icon className="w-4 h-4 mb-1.5 opacity-80" />
              <div className="text-xs opacity-80">{s.label}</div>
              <div>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
