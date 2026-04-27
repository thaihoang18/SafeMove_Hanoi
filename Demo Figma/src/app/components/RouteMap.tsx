import { useState } from "react";
import { MapPin, Navigation, Leaf, Clock, Route as RouteIcon, Wind, ArrowRight, Search } from "lucide-react";

type RouteT = {
  id: string;
  name: string;
  color: string;
  distance: number;
  duration: number;
  avgAqi: number;
  exposure: string;
  tag: string;
  best?: boolean;
  path: string;
};

const routes: RouteT[] = [
  {
    id: "green",
    name: "Lộ trình XANH",
    color: "#10b981",
    distance: 7.2,
    duration: 22,
    avgAqi: 68,
    exposure: "Thấp",
    tag: "Ít ô nhiễm nhất",
    best: true,
    path: "M 40 240 Q 120 80, 240 140 T 460 60",
  },
  {
    id: "balanced",
    name: "Cân bằng",
    color: "#0ea5e9",
    distance: 5.8,
    duration: 17,
    avgAqi: 102,
    exposure: "Trung bình",
    tag: "Nhanh vừa phải",
    path: "M 40 240 Q 180 180, 280 200 T 460 60",
  },
  {
    id: "fastest",
    name: "Nhanh nhất",
    color: "#f59e0b",
    distance: 5.1,
    duration: 14,
    avgAqi: 148,
    exposure: "Cao",
    tag: "Qua đường đông xe",
    path: "M 40 240 L 160 220 L 300 180 L 460 60",
  },
];

export function RouteMap() {
  const [selected, setSelected] = useState("green");
  const [from, setFrom] = useState("Hồ Hoàn Kiếm");
  const [to, setTo] = useState("Công viên Thống Nhất");
  const [maxRatio, setMaxRatio] = useState(1.5);

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm ring-1 ring-slate-200/70">
          <div className="text-slate-900 mb-4">Tìm lộ trình</div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 ring-1 ring-slate-200">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100" />
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Điểm đi"
                className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 ring-1 ring-slate-200">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Điểm đến"
                className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Độ dài tối đa cho phép</span>
              <span className="text-blue-600">× {maxRatio.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={1}
              max={2}
              step={0.1}
              value={maxRatio}
              onChange={(e) => setMaxRatio(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="text-xs text-slate-500 mt-1">
              Chấp nhận đường dài hơn tối đa {((maxRatio - 1) * 100).toFixed(0)}% so với đường ngắn nhất để đổi lấy không khí sạch hơn.
            </div>
          </div>

          <button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-emerald-500 text-white rounded-xl py-3 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-xl transition-shadow">
            <Search className="w-4 h-4" />
            Tìm lộ trình xanh
          </button>
        </div>

        <div className="space-y-2.5">
          {routes.map((r) => {
            const isSel = selected === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`w-full text-left rounded-2xl p-4 ring-1 transition-all ${
                  isSel ? "bg-white ring-2 shadow-md" : "bg-white/60 ring-slate-200 hover:bg-white"
                }`}
                style={isSel ? { borderColor: r.color, boxShadow: `0 0 0 2px ${r.color}33` } : undefined}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ background: `linear-gradient(135deg, ${r.color}, ${r.color}bb)` }}
                    >
                      {r.best ? <Leaf className="w-4 h-4" /> : <RouteIcon className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-sm text-slate-900">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.tag}</div>
                    </div>
                  </div>
                  {r.best && (
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Đề xuất</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-slate-600">
                    <RouteIcon className="w-3 h-3" /> {r.distance} km
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-3 h-3" /> {r.duration} phút
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <Wind className="w-3 h-3" /> AQI {r.avgAqi}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="relative rounded-3xl overflow-hidden ring-1 ring-slate-200/70 shadow-sm bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 h-full min-h-[520px]">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 300" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="500" height="300" fill="url(#grid)" />

            {/* pollution heat zones */}
            <circle cx="200" cy="190" r="55" fill="#ef4444" opacity="0.18" />
            <circle cx="330" cy="160" r="45" fill="#f59e0b" opacity="0.18" />
            <circle cx="130" cy="110" r="40" fill="#10b981" opacity="0.18" />

            {/* routes */}
            {routes.map((r) => (
              <path
                key={r.id}
                d={r.path}
                fill="none"
                stroke={r.color}
                strokeWidth={selected === r.id ? 5 : 2.5}
                strokeDasharray={selected === r.id ? "0" : "6 6"}
                strokeLinecap="round"
                opacity={selected === r.id ? 1 : 0.45}
              />
            ))}

            {/* endpoints */}
            <circle cx="40" cy="240" r="8" fill="#2563eb" />
            <circle cx="40" cy="240" r="14" fill="#2563eb" opacity="0.25" />
            <circle cx="460" cy="60" r="8" fill="#10b981" />
            <circle cx="460" cy="60" r="14" fill="#10b981" opacity="0.25" />
          </svg>

          {/* Labels over map */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-xl px-3 py-2 ring-1 ring-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-700">{from}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-700">{to}</span>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-2xl p-4 ring-1 ring-slate-200 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-slate-900 text-sm">{routes.find((r) => r.id === selected)?.name}</div>
                  <div className="text-xs text-slate-500">
                    Phơi nhiễm: {routes.find((r) => r.id === selected)?.exposure} · Tiết kiệm 38% PM2.5 so với đường ngắn nhất
                  </div>
                </div>
              </div>
              <button className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white rounded-xl px-4 py-2 text-sm flex items-center gap-1.5 shadow-md">
                <Navigation className="w-4 h-4" /> Bắt đầu
              </button>
            </div>
          </div>

          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-xl p-2.5 ring-1 ring-slate-200 space-y-1 text-xs">
            <div className="text-slate-500 mb-1">Mức ô nhiễm</div>
            {[
              { c: "#10b981", l: "Tốt" },
              { c: "#f59e0b", l: "Trung bình" },
              { c: "#ef4444", l: "Xấu" },
            ].map((x) => (
              <div key={x.l} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: x.c }} />
                <span className="text-slate-700">{x.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
