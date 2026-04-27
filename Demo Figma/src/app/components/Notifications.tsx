import { useState } from "react";
import { Bell, AlertTriangle, Leaf, MessageCircle, MapPin, Activity, CheckCheck, Settings, Clock, Trash2, X } from "lucide-react";

type Notif = {
  id: string;
  type: "alert" | "route" | "tip" | "social" | "system";
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  pinned?: boolean;
};

const initial: Notif[] = [
  {
    id: "1",
    type: "alert",
    title: "⚠️ AQI 168 tại quận Đống Đa",
    desc: "Đã vượt ngưỡng 140 bạn cài đặt. Hạn chế ra ngoài trong 2 giờ tới. Xem cơ sở trong nhà gần bạn.",
    time: "5 phút trước",
    unread: true,
    pinned: true,
  },
  {
    id: "2",
    type: "tip",
    title: "Khung giờ tập lý tưởng hôm nay",
    desc: "5:30 - 7:30 sáng tại công viên Thống Nhất. AQI dự báo ~62 — phù hợp chạy bộ với tình trạng hen suyễn của bạn.",
    time: "1 giờ trước",
    unread: true,
  },
  {
    id: "3",
    type: "route",
    title: "Lộ trình xanh mới được gợi ý",
    desc: "Đi làm sáng nay qua Phan Đình Phùng - Điện Biên Phủ giảm 42% phơi nhiễm PM2.5 (chỉ dài thêm 6 phút).",
    time: "3 giờ trước",
    unread: true,
  },
  {
    id: "4",
    type: "social",
    title: "Minh Tú đã đánh giá công viên Thống Nhất",
    desc: "\"Không khí sáng sớm rất dễ chịu, có nhiều máy tập thể dục công cộng...\" — 5★",
    time: "Hôm qua",
    unread: false,
  },
  {
    id: "5",
    type: "alert",
    title: "Cảnh báo thời tiết: gió mùa về",
    desc: "Gió đông bắc mạnh lên tối nay. AQI dự kiến giảm còn 70-80 vào sáng mai.",
    time: "Hôm qua",
    unread: false,
  },
  {
    id: "6",
    type: "system",
    title: "Hồ sơ sức khỏe đã được cập nhật",
    desc: "Bạn đã thêm \"Dị ứng\" vào tình trạng sức khỏe. Các gợi ý sẽ điều chỉnh phù hợp.",
    time: "2 ngày trước",
    unread: false,
  },
  {
    id: "7",
    type: "tip",
    title: "Báo cáo tuần: không khí bạn hít thở",
    desc: "Tuần này bạn đã đi 38km bằng lộ trình xanh, tránh được 12g khói bụi so với tuyến ngắn nhất.",
    time: "3 ngày trước",
    unread: false,
  },
];

const typeMap = {
  alert: { icon: AlertTriangle, grad: "from-red-500 to-orange-500", chip: "bg-red-50 text-red-700 ring-red-200", label: "Cảnh báo" },
  route: { icon: MapPin, grad: "from-blue-500 to-sky-600", chip: "bg-blue-50 text-blue-700 ring-blue-200", label: "Lộ trình" },
  tip: { icon: Leaf, grad: "from-emerald-500 to-teal-600", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "Gợi ý" },
  social: { icon: MessageCircle, grad: "from-violet-500 to-fuchsia-500", chip: "bg-violet-50 text-violet-700 ring-violet-200", label: "Cộng đồng" },
  system: { icon: Activity, grad: "from-slate-500 to-slate-700", chip: "bg-slate-100 text-slate-700 ring-slate-200", label: "Hệ thống" },
};

const filters = [
  { id: "all", label: "Tất cả" },
  { id: "unread", label: "Chưa đọc" },
  { id: "alert", label: "Cảnh báo" },
  { id: "tip", label: "Gợi ý" },
  { id: "route", label: "Lộ trình" },
] as const;

export function Notifications({ compact = false, onClose }: { compact?: boolean; onClose?: () => void } = {}) {
  const [items, setItems] = useState<Notif[]>(initial);
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");

  const filtered = items.filter((n) =>
    filter === "all" ? true : filter === "unread" ? n.unread : n.type === filter
  );
  const unreadCount = items.filter((n) => n.unread).length;

  const markAllRead = () => setItems(items.map((n) => ({ ...n, unread: false })));
  const remove = (id: string) => setItems(items.filter((n) => n.id !== id));
  const toggleRead = (id: string) => setItems(items.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n)));

  const listPanel = (
    <div className={`bg-white ${compact ? "" : "rounded-3xl ring-1 ring-slate-200/70 shadow-sm"} overflow-hidden`}>
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 p-5 text-white overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
            <div className="relative flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div>Thông báo</div>
                  <div className="text-sm opacity-90">
                    {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : "Bạn đã đọc hết thông báo 🎉"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllRead}
                  className="bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl px-3 py-1.5 text-sm flex items-center gap-1.5 ring-1 ring-white/20"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
                </button>
                {compact && onClose ? (
                  <button onClick={onClose} className="w-8 h-8 bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl flex items-center justify-center ring-1 ring-white/20">
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button className="w-8 h-8 bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl flex items-center justify-center ring-1 ring-white/20">
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 pt-4 flex gap-1.5 overflow-x-auto">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  filter === f.id
                    ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
                {f.id === "unread" && unreadCount > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === f.id ? "bg-white/25" : "bg-blue-600 text-white"}`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="p-4 space-y-2">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">Không có thông báo nào.</div>
            )}
            {filtered.map((n) => {
              const t = typeMap[n.type];
              return (
                <div
                  key={n.id}
                  className={`group relative rounded-2xl p-4 transition-all flex gap-3 ${
                    n.unread
                      ? "bg-gradient-to-r from-blue-50/60 to-emerald-50/40 ring-1 ring-blue-100"
                      : "bg-white ring-1 ring-slate-100 hover:bg-slate-50"
                  }`}
                >
                  {n.unread && <div className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.grad} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                    <t.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ring-1 ${t.chip}`}>
                        {t.label}
                      </span>
                      {n.pinned && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                          Ghim
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
                        <Clock className="w-3 h-3" />
                        {n.time}
                      </span>
                    </div>
                    <div className="text-sm text-slate-900">{n.title}</div>
                    <div className="text-sm text-slate-600 mt-0.5 leading-relaxed">{n.desc}</div>

                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => toggleRead(n.id)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-white ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        {n.unread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
                      </button>
                      <button
                        onClick={() => remove(n.id)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-white ring-1 ring-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
    </div>
  );

  if (compact) return listPanel;

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3">{listPanel}</div>

      {/* Right — preferences */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-3xl p-5 ring-1 ring-slate-200/70 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-slate-600" />
            <div className="text-slate-900 text-sm">Tùy chọn thông báo</div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Cảnh báo AQI vượt ngưỡng", desc: "Khi AQI khu vực bạn ở vượt mức cài đặt", on: true },
              { label: "Gợi ý khung giờ tập luyện", desc: "Hàng ngày lúc 6:00 sáng", on: true },
              { label: "Lộ trình xanh mới", desc: "Khi có đường sạch hơn cho tuyến quen thuộc", on: true },
              { label: "Đánh giá & bình luận", desc: "Người dùng khác tương tác với bài của bạn", on: false },
              { label: "Email tóm tắt tuần", desc: "Báo cáo không khí bạn đã hít thở", on: true },
            ].map((p, i) => (
              <Toggle key={i} label={p.label} desc={p.desc} on={p.on} />
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 via-sky-500 to-emerald-500 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/15 blur-2xl" />
          <div className="relative">
            <div className="text-sm opacity-90 mb-1">Tổng kết tuần này</div>
            <div className="text-3xl tracking-tight mb-3">38 km xanh</div>
            <div className="text-sm opacity-90 leading-relaxed">
              Bạn đã tránh được khoảng <span className="underline decoration-white/50">12g bụi mịn PM2.5</span> nhờ chọn lộ trình xanh thay vì đường ngắn nhất.
            </div>
            <div className="mt-4 flex items-center gap-2">
              {[82, 45, 90, 60, 75, 50, 95].map((v, i) => (
                <div key={i} className="flex-1 bg-white/20 rounded-full h-14 flex items-end overflow-hidden">
                  <div className="w-full bg-white/70 rounded-full" style={{ height: `${v}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[10px] opacity-70">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                <div key={d} className="flex-1 text-center">{d}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, desc, on: initial }: { label: string; desc: string; on: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-800">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
          on ? "bg-gradient-to-r from-blue-600 to-emerald-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            on ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
