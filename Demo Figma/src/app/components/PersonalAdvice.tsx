import { Heart, Activity, Shield, CheckCircle2, AlertTriangle } from "lucide-react";

export function PersonalAdvice({ conditions, activity }: { conditions: string[]; activity: string }) {
  const hasAsthma = conditions.includes("Hen suyễn");
  const hasHeart = conditions.includes("Tim mạch");

  const recommendations = [
    {
      icon: Shield,
      title: "Đeo khẩu trang N95",
      desc: "Khi đi qua các tuyến đường đông xe như Nguyễn Trãi, Trường Chinh — nồng độ PM2.5 có thể tăng 40%.",
      level: hasAsthma ? "critical" : "warn",
    },
    {
      icon: Activity,
      title: `Thời điểm tập ${activity.toLowerCase()} lý tưởng`,
      desc: "5:30 - 7:30 sáng tại công viên Thống Nhất. AQI trung bình khoảng 62 — an toàn cho vận động cường độ vừa.",
      level: "good",
    },
    {
      icon: Heart,
      title: hasHeart ? "Theo dõi nhịp tim cẩn thận" : "Giữ đủ nước & nghỉ ngơi hợp lý",
      desc: hasHeart
        ? "Với chỉ số AQI hiện tại, tránh hoạt động cường độ cao ngoài trời. Chọn bơi trong nhà hoặc yoga."
        : "Uống nước mỗi 15-20 phút khi tập ngoài trời. Dừng lại nếu thấy khó thở.",
      level: hasHeart ? "critical" : "info",
    },
  ];

  const styleMap = {
    critical: "from-red-50 to-rose-50 ring-red-200 text-red-700 [&_.ico]:bg-red-500",
    warn: "from-orange-50 to-amber-50 ring-orange-200 text-orange-700 [&_.ico]:bg-orange-400",
    good: "from-emerald-50 to-teal-50 ring-emerald-200 text-emerald-700 [&_.ico]:bg-emerald-500",
    info: "from-sky-50 to-blue-50 ring-sky-200 text-sky-700 [&_.ico]:bg-sky-500",
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-slate-900">Lời khuyên cá nhân hóa</div>
          <div className="text-xs text-slate-500">Dựa trên hồ sơ sức khỏe & vị trí của bạn</div>
        </div>
      </div>

      {conditions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {conditions.map((c) => (
            <span key={c} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full ring-1 ring-blue-200">
              {c}
            </span>
          ))}
          <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full ring-1 ring-emerald-200">
            {activity}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {recommendations.map((r, i) => (
          <div
            key={i}
            className={`bg-gradient-to-r ${styleMap[r.level as keyof typeof styleMap]} ring-1 rounded-2xl p-4 flex gap-3`}
          >
            <div className="ico w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0">
              <r.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                {r.level === "good" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <div className="text-slate-900">{r.title}</div>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed">{r.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
