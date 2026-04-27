import { useState } from "react";
import { AlertTriangle, Leaf, MessageCircle, MapPin, Activity, MoreHorizontal } from "lucide-react";

type Notif = {
  id: string;
  type: "alert" | "route" | "tip" | "social" | "system";
  title: string;
  time: string;
  unread: boolean;
};

const items: Notif[] = [
  { id: "1", type: "alert", title: "AQI 168 tại Đống Đa — đã vượt ngưỡng 140 bạn cài đặt.", time: "5 phút", unread: true },
  { id: "2", type: "tip", title: "Khung giờ tập lý tưởng: 5:30 - 7:30 sáng tại CV Thống Nhất.", time: "1 giờ", unread: true },
  { id: "3", type: "route", title: "Lộ trình xanh mới giảm 42% PM2.5 cho tuyến đi làm.", time: "3 giờ", unread: true },
  { id: "4", type: "social", title: "Minh Tú đã đánh giá CV Thống Nhất — 5★.", time: "Hôm qua", unread: false },
  { id: "5", type: "alert", title: "Gió đông bắc mạnh tối nay, AQI dự giảm còn 70-80.", time: "Hôm qua", unread: false },
];

const typeMap = {
  alert: { icon: AlertTriangle, grad: "from-red-500 to-orange-500" },
  route: { icon: MapPin, grad: "from-blue-500 to-sky-600" },
  tip: { icon: Leaf, grad: "from-emerald-500 to-teal-600" },
  social: { icon: MessageCircle, grad: "from-violet-500 to-fuchsia-500" },
  system: { icon: Activity, grad: "from-slate-500 to-slate-700" },
};

export function NotifPopup({ onOpenCenter }: { onOpenCenter: () => void }) {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const shown = tab === "all" ? items : items.filter((i) => i.unread);

  return (
    <div className="flex flex-col max-h-[min(560px,calc(100vh-120px))]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="text-slate-900 text-lg tracking-tight">Thông báo</div>
          <button className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1.5 mt-2">
          <button
            onClick={() => setTab("all")}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              tab === "all" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setTab("unread")}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              tab === "unread" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Chưa đọc
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2">
        {shown.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">Không có thông báo.</div>
        )}
        {shown.map((n) => {
          const t = typeMap[n.type];
          return (
            <button
              key={n.id}
              className="w-full text-left flex items-start gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.grad} flex items-center justify-center text-white shrink-0`}>
                <t.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm leading-snug ${n.unread ? "text-slate-900" : "text-slate-600"}`}>
                  {n.title}
                </div>
                <div className={`text-xs mt-0.5 ${n.unread ? "text-blue-600" : "text-slate-400"}`}>
                  {n.time}
                </div>
              </div>
              {n.unread && <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-4 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 p-2">
        <button
          onClick={onOpenCenter}
          className="w-full text-center py-2.5 rounded-xl hover:bg-slate-50 text-sm text-blue-600 transition-colors"
        >
          Xem trung tâm thông báo
        </button>
      </div>
    </div>
  );
}
