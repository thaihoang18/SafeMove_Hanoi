import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const data = [
  { h: "00", aqi: 78, pm25: 32 },
  { h: "03", aqi: 92, pm25: 40 },
  { h: "06", aqi: 115, pm25: 52 },
  { h: "09", aqi: 143, pm25: 68 },
  { h: "12", aqi: 128, pm25: 58 },
  { h: "15", aqi: 98, pm25: 44 },
  { h: "18", aqi: 132, pm25: 62 },
  { h: "21", aqi: 108, pm25: 48 },
];

export function AQIChart() {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-slate-900">Diễn biến AQI 24 giờ</div>
          <div className="text-sm text-slate-500 mt-0.5">Nguồn: AQICN · IQAir (trung bình có trọng số)</div>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full ring-1 ring-emerald-200">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Tốt cho tập luyện
          </span>
        </div>
      </div>

      <div style={{ width: "100%", height: 224, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.5} />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="h" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}
              labelFormatter={(v) => `${v}:00`}
            />
            <ReferenceLine key="ref-warn" y={100} stroke="#fb923c" strokeDasharray="4 4" ifOverflow="extendDomain" />
            <ReferenceLine key="ref-danger" y={150} stroke="#ef4444" strokeDasharray="4 4" ifOverflow="extendDomain" />
            <Area type="monotone" dataKey="aqi" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#aqiGrad)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { t: "5-8h", s: "Tốt", c: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
          { t: "9-11h", s: "Xấu", c: "bg-orange-50 text-orange-700 ring-orange-200" },
          { t: "15-17h", s: "Khá", c: "bg-teal-50 text-teal-700 ring-teal-200" },
          { t: "20-22h", s: "Trung bình", c: "bg-sky-50 text-sky-700 ring-sky-200" },
        ].map((t) => (
          <div key={t.t} className={`rounded-xl px-3 py-2 ring-1 ${t.c}`}>
            <div className="text-xs opacity-80">{t.t}</div>
            <div className="text-sm">{t.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
