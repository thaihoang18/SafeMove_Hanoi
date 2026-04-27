import { useState } from "react";
import { MapPin, Navigation, Leaf, Clock, Route as RouteIcon, Wind, ArrowRight, Search, Plus, Minus, Layers, Locate, AlertTriangle, ArrowLeft, X, CornerUpRight, CornerUpLeft, ArrowUp, Volume2 } from "lucide-react";

type Stage = "form" | "results" | "navigating";

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
  d: string;
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
    tag: "Qua công viên Thống Nhất",
    best: true,
    d: "M 60 420 L 100 420 L 100 350 L 180 350 L 180 280 L 280 280 L 280 180 L 380 180 L 380 120 L 520 120 L 520 80",
  },
  {
    id: "balanced",
    name: "Cân bằng",
    color: "#0ea5e9",
    distance: 5.8,
    duration: 17,
    avgAqi: 102,
    exposure: "Trung bình",
    tag: "Qua Lê Duẩn - Trần Hưng Đạo",
    d: "M 60 420 L 200 420 L 200 320 L 340 320 L 340 200 L 460 200 L 460 120 L 520 120 L 520 80",
  },
  {
    id: "fastest",
    name: "Nhanh nhất",
    color: "#fb923c",
    distance: 5.1,
    duration: 14,
    avgAqi: 148,
    exposure: "Cao",
    tag: "Qua Nguyễn Trãi (đông xe)",
    d: "M 60 420 L 260 420 L 260 300 L 420 300 L 420 150 L 520 150 L 520 80",
  },
];

const streets = [
  { d: "M 0 120 L 600 120", name: "Đ. Hoàng Hoa Thám", pos: { x: 40, y: 113 } },
  { d: "M 0 200 L 600 200", name: "Đ. Kim Mã", pos: { x: 40, y: 193 } },
  { d: "M 0 280 L 600 280", name: "Đ. Trần Hưng Đạo", pos: { x: 40, y: 273 } },
  { d: "M 0 350 L 600 350", name: "Đ. Đại Cồ Việt", pos: { x: 40, y: 343 } },
  { d: "M 0 420 L 600 420", name: "Đ. Trường Chinh", pos: { x: 40, y: 413 } },
  { d: "M 100 0 L 100 500", name: "Đ. Láng", pos: { x: 105, y: 50 } },
  { d: "M 200 0 L 200 500", name: "", pos: { x: 0, y: 0 } },
  { d: "M 280 0 L 280 500", name: "Đ. Giải Phóng", pos: { x: 285, y: 50 } },
  { d: "M 380 0 L 380 500", name: "", pos: { x: 0, y: 0 } },
  { d: "M 460 0 L 460 500", name: "Đ. Nguyễn Trãi", pos: { x: 465, y: 50 } },
  { d: "M 520 0 L 520 500", name: "", pos: { x: 0, y: 0 } },
];

const minorStreets = [
  "M 0 70 L 600 70", "M 0 160 L 600 160", "M 0 240 L 600 240", "M 0 310 L 600 310", "M 0 390 L 600 390", "M 0 460 L 600 460",
  "M 50 0 L 50 500", "M 150 0 L 150 500", "M 330 0 L 330 500", "M 430 0 L 430 500",
];

export function RealisticMap() {
  const [stage, setStage] = useState<Stage>("form");
  const [selected, setSelected] = useState("green");
  const [from, setFrom] = useState("Hồ Hoàn Kiếm");
  const [to, setTo] = useState("Công viên Thống Nhất");
  const [maxRatio, setMaxRatio] = useState(1.5);

  const selRoute = routes.find((r) => r.id === selected)!;

  // Sub-tabs (stepper)
  const steps: { id: Stage; label: string }[] = [
    { id: "form", label: "Điểm đi & đến" },
    { id: "results", label: "Chọn lộ trình" },
  ];

  if (stage === "navigating") {
    return <NavigationView route={selRoute} from={from} to={to} onExit={() => setStage("results")} />;
  }

  return (
    <div className="space-y-4">
      {/* Stepper tabs */}
      <div className="bg-white rounded-full ring-1 ring-slate-200 p-1 inline-flex gap-1 shadow-sm">
        {steps.map((s, i) => {
          const active = stage === s.id;
          const done = stage === "results" && i === 0;
          return (
            <button
              key={s.id}
              onClick={() => setStage(s.id)}
              disabled={s.id === "results" && stage === "form"}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-sm transition-all flex items-center gap-2 ${
                active
                  ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow"
                  : done
                  ? "text-emerald-600"
                  : "text-slate-500 disabled:opacity-50"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                active ? "bg-white/20" : done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}>
                {done ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.label.length > 10 ? s.label.slice(0, 10) + "…" : s.label}</span>
            </button>
          );
        })}
      </div>

      {stage === "form" && (
        <FormPanel
          from={from} setFrom={setFrom}
          to={to} setTo={setTo}
          maxRatio={maxRatio} setMaxRatio={setMaxRatio}
          onSubmit={() => setStage("results")}
        />
      )}

      {stage === "results" && (
        <ResultsPanel
          from={from} to={to}
          selected={selected} setSelected={setSelected}
          onBack={() => setStage("form")}
          onStart={() => setStage("navigating")}
        />
      )}
    </div>
  );
}

/* --------------------- FORM --------------------- */

function FormPanel({
  from, setFrom, to, setTo, maxRatio, setMaxRatio, onSubmit,
}: {
  from: string; setFrom: (v: string) => void;
  to: string; setTo: (v: string) => void;
  maxRatio: number; setMaxRatio: (v: number) => void;
  onSubmit: () => void;
}) {
  const suggestions = ["Hồ Tây", "Công viên Yên Sở", "Hồ Gươm", "Phố cổ Hà Nội", "Công viên Thống Nhất"];

  const swap = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-900">Tìm lộ trình</div>
              <div className="text-xs text-slate-500">Nhập điểm đi và điểm đến để bắt đầu</div>
            </div>
          </div>

          <div className="relative space-y-2.5">
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100 shrink-0" />
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Điểm đi"
                className="flex-1 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 min-w-0"
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
              <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0" />
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Điểm đến"
                className="flex-1 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 min-w-0"
              />
            </div>

            <button
              onClick={swap}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full ring-1 ring-slate-200 shadow flex items-center justify-center hover:bg-slate-50 text-slate-500"
              title="Đổi điểm đi/đến"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 10l5-5 5 5M7 14l5 5 5-5" opacity="0.5" />
                <path d="M12 5v14" />
              </svg>
            </button>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-700">Độ dài tối đa cho phép</span>
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
            <div className="text-xs text-slate-500 mt-1.5">
              Chấp nhận đường dài hơn tối đa <span className="text-slate-700">{((maxRatio - 1) * 100).toFixed(0)}%</span> so với đường ngắn nhất để đổi lấy không khí sạch hơn.
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { label: "Tránh đường đông xe", on: true },
              { label: "Qua công viên/hồ", on: true },
              { label: "Ưu tiên vỉa hè", on: false },
            ].map((p) => (
              <div
                key={p.label}
                className={`text-xs px-3 py-2 rounded-xl ring-1 text-center leading-snug ${
                  p.on
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-slate-50 text-slate-500 ring-slate-200"
                }`}
              >
                {p.label}
              </div>
            ))}
          </div>

          <button
            onClick={onSubmit}
            className="mt-6 w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-xl transition-all"
          >
            <Search className="w-4 h-4" />
            Tìm lộ trình xanh
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-blue-600 via-sky-500 to-emerald-500 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/15 blur-2xl" />
          <Leaf className="w-6 h-6 mb-2 relative" />
          <div className="relative">Mẹo di chuyển xanh</div>
          <div className="text-sm opacity-90 mt-2 leading-relaxed relative">
            Chọn khung giờ <span className="underline decoration-white/50">5:30 - 7:30</span> sáng sẽ giảm tiếp xúc PM2.5 tới 40% so với giờ cao điểm.
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 ring-1 ring-slate-200/70 shadow-sm">
          <div className="text-sm text-slate-700 mb-3">Gợi ý địa điểm</div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setTo(s)}
                className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-full ring-1 ring-slate-200 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------- RESULTS --------------------- */

function ResultsPanel({
  from, to, selected, setSelected, onBack, onStart,
}: {
  from: string; to: string;
  selected: string; setSelected: (v: string) => void;
  onBack: () => void; onStart: () => void;
}) {
  const selRoute = routes.find((r) => r.id === selected)!;

  return (
    <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
      {/* Map - large */}
      <div className="lg:col-span-3 order-1">
        <div className="relative rounded-3xl overflow-hidden ring-1 ring-slate-200/70 shadow-sm h-[420px] sm:h-[560px] lg:h-[680px] bg-[#e8f0e4]">
          <MapSVG selected={selected} />

          {/* Map controls - top right */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <div className="bg-white rounded-xl ring-1 ring-slate-200 shadow-md overflow-hidden">
              <button className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 text-slate-700"><Plus className="w-4 h-4" /></button>
              <div className="h-px bg-slate-200" />
              <button className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 text-slate-700"><Minus className="w-4 h-4" /></button>
            </div>
            <button className="w-9 h-9 bg-white rounded-xl ring-1 ring-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 text-blue-600"><Locate className="w-4 h-4" /></button>
          </div>

          {/* Route summary - bottom */}
          <div className="absolute bottom-3 left-3 right-3 bg-white rounded-2xl p-3 ring-1 ring-slate-200 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${selRoute.color}, ${selRoute.color}cc)` }}
                >
                  <Leaf className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-slate-900 truncate">{selRoute.name}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {selRoute.distance} km · {selRoute.duration} phút · AQI {selRoute.avgAqi}
                  </div>
                </div>
              </div>
              <button
                onClick={onStart}
                className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm flex items-center gap-1.5 shadow-md whitespace-nowrap"
              >
                <Navigation className="w-4 h-4" /> Bắt đầu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:col-span-2 space-y-3 order-2">
        <div className="bg-white rounded-2xl p-3 ring-1 ring-slate-200 shadow-sm flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 text-sm">
            <div className="flex items-center gap-1.5 text-slate-700 truncate">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{from}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 truncate mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{to}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {routes.map((r) => {
            const isSel = selected === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`w-full text-left rounded-2xl p-3.5 ring-1 transition-all ${
                  isSel ? "bg-white ring-2 shadow-md" : "bg-white/70 ring-slate-200 hover:bg-white"
                }`}
                style={isSel ? { borderColor: r.color, boxShadow: `0 0 0 2px ${r.color}33` } : undefined}
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ background: `linear-gradient(135deg, ${r.color}, ${r.color}bb)` }}
                    >
                      {r.best ? <Leaf className="w-4 h-4" /> : <RouteIcon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-slate-900 truncate">{r.name}</div>
                      <div className="text-xs text-slate-500 truncate">{r.tag}</div>
                    </div>
                  </div>
                  {r.best && (
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full shrink-0">Đề xuất</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-slate-600"><RouteIcon className="w-3 h-3" /> {r.distance} km</div>
                  <div className="flex items-center gap-1 text-slate-600"><Clock className="w-3 h-3" /> {r.duration} phút</div>
                  <div className="flex items-center gap-1 text-slate-600"><Wind className="w-3 h-3" /> {r.avgAqi}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-3.5 ring-1 ring-emerald-100 flex items-start gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <div className="text-slate-700 leading-relaxed">
            Tránh qua <span className="text-slate-900">Ngã Tư Sở</span> — AQI đang 168, đông xe tải vào 17h-19h.
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------- MAP SVG (shared) --------------------- */

function MapSVG({ selected }: { selected: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 500" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#d4ddc9" strokeWidth="0.3" />
        </pattern>
        <radialGradient id="poll-high">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="poll-med">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="poll-low">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="600" height="500" fill="#f3f5ec" />
      <rect width="600" height="500" fill="url(#mapGrid)" />

      <path d="M 140 250 Q 120 270 140 310 L 230 310 Q 250 290 230 250 Z" fill="#c6e2b1" />
      <path d="M 290 380 L 370 380 L 370 450 L 290 450 Z" fill="#c6e2b1" />
      <text x="160" y="285" fontSize="9" fill="#4d6b3b">CV Thống Nhất</text>

      <circle cx="380" cy="180" r="28" fill="#a7d3ec" />
      <text x="360" y="185" fontSize="8" fill="#3b6a87">Hồ Gươm</text>
      <ellipse cx="90" cy="90" rx="70" ry="40" fill="#a7d3ec" />
      <text x="70" y="95" fontSize="9" fill="#3b6a87">Hồ Tây</text>

      <circle cx="460" cy="300" r="90" fill="url(#poll-high)" />
      <circle cx="420" cy="150" r="70" fill="url(#poll-med)" />
      <circle cx="180" cy="280" r="80" fill="url(#poll-low)" />
      <circle cx="100" cy="100" r="70" fill="url(#poll-low)" />

      {minorStreets.map((d, i) => (
        <path key={`m-${i}`} d={d} stroke="#ffffff" strokeWidth="3" opacity="0.9" />
      ))}

      {streets.map((s, i) => (
        <path key={`sc-${i}`} d={s.d} stroke="#e5c76b" strokeWidth="9" opacity="0.35" />
      ))}
      {streets.map((s, i) => (
        <path key={`sf-${i}`} d={s.d} stroke="#ffffff" strokeWidth="7" />
      ))}

      {streets.filter(s => s.name).map((s, i) => (
        <text key={`sl-${i}`} x={s.pos.x} y={s.pos.y} fontSize="8" fill="#6b7280" fontFamily="sans-serif">{s.name}</text>
      ))}

      {routes.filter(r => r.id !== selected).map((r) => (
        <path
          key={`rb-${r.id}`} d={r.d} fill="none" stroke={r.color} strokeWidth="4"
          strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 6" opacity="0.55"
        />
      ))}

      {routes.filter(r => r.id === selected).map((r) => (
        <g key={`rs-${r.id}`}>
          <path d={r.d} fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d={r.d} fill="none" stroke={r.color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}

      <g transform="translate(60 420)">
        <circle r="14" fill="#2563eb" opacity="0.2" />
        <circle r="7" fill="#ffffff" />
        <circle r="5" fill="#2563eb" />
      </g>
      <g transform="translate(520 80)">
        <path d="M 0 -20 C -9 -20 -14 -12 -14 -6 C -14 2 0 10 0 10 C 0 10 14 2 14 -6 C 14 -12 9 -20 0 -20 Z" fill="#10b981" stroke="white" strokeWidth="1.5" />
        <circle cy="-8" r="4" fill="white" />
      </g>
    </svg>
  );
}

/* --------------------- NAVIGATION --------------------- */

function NavigationView({ route, from, to, onExit }: { route: RouteT; from: string; to: string; onExit: () => void }) {
  const [muted, setMuted] = useState(false);

  // Simulated current step
  const steps = [
    { icon: ArrowUp, instr: "Đi thẳng về phía bắc trên Đ. Trường Chinh", dist: "200 m" },
    { icon: CornerUpLeft, instr: "Rẽ trái vào Đ. Láng", dist: "450 m" },
    { icon: ArrowUp, instr: "Tiếp tục đi thẳng qua cầu vượt", dist: "800 m" },
    { icon: CornerUpRight, instr: "Rẽ phải vào Đ. Kim Mã", dist: "1.2 km" },
  ];

  return (
    <div className="relative h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] min-h-[520px] rounded-3xl overflow-hidden ring-1 ring-slate-200 shadow-lg bg-[#e8f0e4]">
      {/* Zoomed map - focus on current position */}
      <svg className="absolute inset-0 w-full h-full" viewBox="100 200 320 280" preserveAspectRatio="xMidYMid slice">
        <rect x="100" y="200" width="320" height="280" fill="#f3f5ec" />

        {/* Parks / hotspots */}
        <path d="M 140 250 Q 120 270 140 310 L 230 310 Q 250 290 230 250 Z" fill="#c6e2b1" />
        <path d="M 290 380 L 370 380 L 370 450 L 290 450 Z" fill="#c6e2b1" />

        {/* Streets */}
        {minorStreets.map((d, i) => (
          <path key={`nm-${i}`} d={d} stroke="#ffffff" strokeWidth="4" opacity="0.9" />
        ))}
        {streets.map((s, i) => (
          <g key={`ns-${i}`}>
            <path d={s.d} stroke="#e5c76b" strokeWidth="12" opacity="0.35" />
            <path d={s.d} stroke="#ffffff" strokeWidth="9" />
          </g>
        ))}
        {streets.filter(s => s.name).map((s, i) => (
          <text key={`nl-${i}`} x={s.pos.x} y={s.pos.y} fontSize="9" fill="#6b7280">{s.name}</text>
        ))}

        {/* Active route */}
        <path d={route.d} fill="none" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        <path d={route.d} fill="none" stroke={route.color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />

        {/* Traveled portion - darker */}
        <path d="M 60 420 L 100 420 L 100 380" fill="none" stroke="#64748b" strokeWidth="9" strokeLinecap="round" opacity="0.6" />

        {/* Current position - animated arrow */}
        <g transform="translate(180 350) rotate(-45)">
          <circle r="22" fill="#2563eb" opacity="0.15">
            <animate attributeName="r" values="18;30;18" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle r="14" fill="#2563eb" opacity="0.25" />
          <circle r="10" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
          <path d="M 0 -5 L 4 3 L 0 1 L -4 3 Z" fill="#2563eb" />
        </g>
      </svg>

      {/* Top instruction card - Google Maps style */}
      <div className="absolute top-3 left-3 right-3">
        <div className="bg-gradient-to-br from-blue-700 to-blue-600 text-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 flex items-center gap-3">
            <button
              onClick={onExit}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <CornerUpLeft className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/80">Sau 450 m</div>
              <div className="leading-snug truncate">Rẽ trái vào Đ. Láng</div>
            </div>
            <button
              onClick={() => setMuted(!muted)}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${muted ? "bg-white/10 text-white/60" : "bg-white/15"}`}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom sheet - ETA + controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] p-4 pt-3">
        <div className="mx-auto w-10 h-1 bg-slate-200 rounded-full mb-3" />
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-2xl tracking-tight text-slate-900">{route.duration} phút</div>
            <div className="text-xs text-slate-500">
              {route.distance} km · Đến lúc {new Date(Date.now() + route.duration * 60000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-full ring-1 ring-emerald-200">
            <Leaf className="w-3.5 h-3.5" /> AQI TB {route.avgAqi}
          </div>
        </div>

        {/* Next few turns */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`shrink-0 rounded-xl px-3 py-2 flex items-center gap-2 ring-1 ${
                i === 0 ? "bg-blue-50 ring-blue-200 text-blue-700" : "bg-slate-50 ring-slate-200 text-slate-600"
              }`}
            >
              <s.icon className="w-4 h-4 shrink-0" />
              <div className="text-xs whitespace-nowrap">{s.dist}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onExit}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-2.5 text-sm"
          >
            Kết thúc
          </button>
          <button className="w-11 h-11 bg-white ring-1 ring-slate-200 rounded-xl flex items-center justify-center text-blue-600">
            <Locate className="w-4 h-4" />
          </button>
          <button className="w-11 h-11 bg-white ring-1 ring-slate-200 rounded-xl flex items-center justify-center text-slate-600">
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* Route name badge */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 justify-center">
          <div className="w-2 h-2 rounded-full" style={{ background: route.color }} />
          Đang đi theo <span className="text-slate-700">{route.name}</span> — tránh khu vực ô nhiễm cao
        </div>
      </div>
    </div>
  );
}
