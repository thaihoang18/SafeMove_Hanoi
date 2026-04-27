import { AlertTriangle, MapPin, Building2, Clock } from "lucide-react";

const alerts = [
  {
    level: "high",
    title: "AQI vượt ngưỡng 150 tại quận Đống Đa",
    time: "10 phút trước",
    desc: "Chỉ số PM2.5 đang ở mức 72 µg/m³. Hạn chế hoạt động ngoài trời trong 2 giờ tới.",
  },
  {
    level: "med",
    title: "Khung giờ cao điểm sắp tới",
    time: "17:00 - 19:30",
    desc: "Mật độ giao thông dự kiến tăng cao tại trục Nguyễn Trãi - Ngã Tư Sở. Tránh tuyến đường này.",
  },
  {
    level: "low",
    title: "Không khí đang cải thiện",
    time: "30 phút trước",
    desc: "AQI giảm còn 82 nhờ gió đông nam. Thời điểm tốt để đi dạo ngắn.",
  },
];

const indoor = [
  { name: "California Fitness - Hoàng Đạo Thúy", distance: "0.8 km", aqi: 42, tag: "Máy lọc HEPA" },
  { name: "Elite Fitness - Vincom Bà Triệu", distance: "1.2 km", aqi: 38, tag: "Không gian lớn" },
  { name: "Trung tâm Yoga Zenful", distance: "1.6 km", aqi: 45, tag: "Yên tĩnh" },
];

const levelMap = {
  high: "from-red-500 to-rose-600",
  med: "from-amber-400 to-orange-500",
  low: "from-emerald-400 to-teal-500",
};

export function AlertsPanel() {
  return (
    <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
      <div className="lg:col-span-3 space-y-3">
        <div className="bg-gradient-to-br from-red-500 via-rose-500 to-orange-400 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/15 blur-2xl" />
          <div className="flex items-center gap-3 mb-3 relative">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div>Cảnh báo AQI khẩn cấp</div>
              <div className="text-sm opacity-90">AQI hiện tại 168 · Khu vực Đống Đa</div>
            </div>
          </div>
          <div className="text-sm opacity-95 leading-relaxed relative">
            Ngưỡng cảnh báo 140 của bạn đã bị vượt. Hệ thống đề xuất các cơ sở tập luyện trong nhà gần bạn.
          </div>
        </div>

        {alerts.map((a, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 ring-1 ring-slate-200/70 shadow-sm flex gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${levelMap[a.level as keyof typeof levelMap]} flex items-center justify-center text-white shrink-0`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-slate-900 text-sm">{a.title}</div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {a.time}
                </div>
              </div>
              <div className="text-sm text-slate-600 mt-1 leading-relaxed">{a.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-3xl p-5 ring-1 ring-slate-200/70 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-900 text-sm">Cơ sở trong nhà gần bạn</div>
              <div className="text-xs text-slate-500">Không khí được kiểm soát</div>
            </div>
          </div>

          <div className="space-y-2.5">
            {indoor.map((s) => (
              <div key={s.name} className="p-3 rounded-2xl ring-1 ring-slate-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-emerald-50/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-900 truncate">{s.name}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {s.distance}
                    </div>
                    <div className="mt-1.5 text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full inline-block ring-1 ring-emerald-200">
                      {s.tag}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl text-emerald-600">{s.aqi}</div>
                    <div className="text-[10px] text-slate-500 -mt-1">AQI</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
