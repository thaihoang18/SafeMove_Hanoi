import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  MapPin,
  Navigation,
  Plus,
  Search,
  Shield,
  Star,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import type { DashboardResponse, NotificationItem, ProfileResponse, RouteOption, User, GpsAqiMeasurement } from "@/lib/types";
import { featuredExercisePlaces } from "@/lib/guest-exercise-places";
import { RoutePlannerView } from "./RoutePlannerView";
import type { Role, View } from "./Shell";

type LocationItem = {
  id: string;
  name: string;
  location_type: string;
  address: string | null;
  city: string | null;
  district: string | null;
  lat: number;
  lng: number;
  rating?: number | null;
  reviews?: number | null;
  categories?: string | null;
  workday_timing?: string | null;
  website?: string | null;
  phone?: string | null;
  featured_image?: string | null;
  description?: string | null;
  source?: "backend" | "asset";
};

type Props = {
  role: Role;
  view: View;
  setView: (view: View) => void;
  user: User;
  dashboard: DashboardResponse | null;
  profile: ProfileResponse | null;
  notifications: NotificationItem[];
  advice: { severity: string; title: string; body: string } | null;
  locations: LocationItem[];
  routeHistory: Array<Record<string, unknown>>;
  maxRatio: number;
  setMaxRatio: (value: number) => void;
  routeSubmitting: boolean;
  profileSaving: boolean;
  gpsAqi: GpsAqiMeasurement | null;
  gpsCoords: { lat: number; lng: number } | null;
  gpsLoading: boolean;
  gpsError: string | null;
  onRefreshGpsAqi: () => void;
  onCreateRoute: (payload: {
    originLabel: string;
    originLat: number;
    originLng: number;
    destinationLabel: string;
    destinationLat: number;
    destinationLng: number;
    maxRatio: number;
    shortestDistanceM: number;
    shortestDurationS: number;
    options: RouteOption[];
  }) => Promise<void>;
  onSaveProfile: (payload: Record<string, unknown>) => Promise<void>;
  onMarkRead: (notificationId: string) => Promise<void>;
  onLogout: () => void;
};

const reviewCards = [
  { name: "Nguyễn Linh", time: "2 giờ trước", score: 5, body: "Không khí dễ chịu, đường đi thông thoáng và có nhiều cây xanh." },
  { name: "Marco", time: "1 ngày trước", score: 4, body: "Bãi tập rộng, AQI ổn định. Giá như có thêm nhiều ghế nghỉ hơn." },
  { name: "Hà My", time: "3 ngày trước", score: 5, body: "Giao diện rõ ràng, dễ hiểu, phù hợp để chọn điểm luyện tập ngoài trời." },
];

const violationCards = [
  {
    userId: "A9283",
    title: "Bình luận vi phạm số 3",
    content: "Nội dung báo cáo đang chờ xử lý để bảo vệ cộng đồng.",
    location: "Bách Thảo Park",
    createdAt: "2024/05/20 14:30",
    count: 3,
  },
  {
    userId: "B4410",
    title: "Đánh giá tiêu cực lặp lại",
    content: "Nội dung có dấu hiệu spam và cần kiểm duyệt lại.",
    location: "Công viên Thống Nhất",
    createdAt: "2024/05/18 09:15",
    count: 2,
  },
];

function getAqiAdvice(aqi: number, threshold: number) {
  const crossedThreshold = aqi >= threshold;

  if (aqi <= 50) {
    return {
      label: "Tốt",
      severity: "info",
      title: crossedThreshold ? "AQI tốt nhưng đã chạm ngưỡng cá nhân" : "Không khí đang tốt",
      body: crossedThreshold
        ? "Chỉ số chung vẫn ổn, nhưng ngưỡng cá nhân của bạn đang khá thấp. Nên giữ cường độ nhẹ."
        : "Có thể ra ngoài vận động, ưu tiên các tuyến xanh và theo dõi thay đổi thời tiết.",
      crossedThreshold,
    };
  }

  if (aqi <= 100) {
    return {
      label: "Trung bình",
      severity: "warn",
      title: crossedThreshold ? "Cần giảm cường độ vận động" : "Không khí ở mức chấp nhận được",
      body: crossedThreshold
        ? "Bạn đã tới vùng AQI cần thận trọng hơn. Hạn chế bài tập dài và ưu tiên khu vực nhiều cây xanh."
        : "Có thể tập nhẹ ngoài trời, nhưng nên rút ngắn thời lượng và theo dõi triệu chứng.",
      crossedThreshold,
    };
  }

  return {
    label: "Xấu",
    severity: "critical",
    title: crossedThreshold ? "Nên chuyển sang hoạt động trong nhà" : "AQI đang xấu",
    body: crossedThreshold
      ? "Chỉ số đã vượt ngưỡng cá nhân. Tốt nhất hãy chuyển sang không gian kín hoặc hoãn vận động ngoài trời."
      : "Hạn chế ra ngoài lâu. Nếu cần di chuyển, hãy chọn lộ trình ngắn và ít tiếp xúc không khí hơn.",
    crossedThreshold,
  };
}

export function WorkspaceScreens({
  role,
  view,
  setView,
  user,
  dashboard,
  profile,
  notifications,
  advice,
  locations,
  routeHistory,
  maxRatio,
  setMaxRatio,
  routeSubmitting,
  profileSaving,
  gpsAqi,
  gpsCoords,
  gpsLoading,
  gpsError,
  onRefreshGpsAqi,
  onCreateRoute,
  onSaveProfile,
  onLogout,
}: Props) {
  const [spotQuery, setSpotQuery] = useState("");
  const [spotCategory, setSpotCategory] = useState<"all" | "park" | "gym" | "favorite">("all");
  const [recentOnly, setRecentOnly] = useState(true);
  const [selectedSpotId, setSelectedSpotId] = useState<string>(locations[0]?.id ?? "");
  const [commentText, setCommentText] = useState("");
  const [commentSort, setCommentSort] = useState<"newest" | "highest">("newest");
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState("Bạn cần đăng nhập để tiếp tục.");
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [aqiThresholdInput, setAqiThresholdInput] = useState(140);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [mailEnabled, setMailEnabled] = useState(false);
  const [moderationLocation, setModerationLocation] = useState("all");
  const [showPending, setShowPending] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [moderationStatusById, setModerationStatusById] = useState<Record<string, "pending" | "deleted">>(() =>
    Object.fromEntries(violationCards.map((item) => [item.userId, "pending"])),
  );
  const [editFullName, setEditFullName] = useState(profile?.user.full_name ?? user.full_name ?? "");
  const [editPhone, setEditPhone] = useState("0900 000 000");
  const currentThreshold = profile?.profile?.alert_threshold ?? dashboard?.summary.alert_threshold ?? 140;
  const currentAqi = gpsAqi?.aqi ?? dashboard?.nearestAqi?.aqi ?? 42;
  const computedAdvice = getAqiAdvice(currentAqi, currentThreshold);
  useEffect(() => {
    setAqiThresholdInput(currentThreshold);
  }, [currentThreshold]);
  useEffect(() => {
    setEditFullName(profile?.user.full_name ?? user.full_name ?? "");
    setEditPhone("0900 000 000");
  }, [profile?.user.full_name, user.full_name]);

  const activeSpot = useMemo(
    () => locations.find((item) => item.id === selectedSpotId) ?? locations[0] ?? null,
    [locations, selectedSpotId],
  );

  const filteredSpots = useMemo(() => {
    const query = spotQuery.trim().toLowerCase();

    return locations.filter((item) => {
      const matchesCategory =
        spotCategory === "all"
          ? true
          : spotCategory === "park"
            ? item.location_type.toLowerCase().includes("park") || item.name.toLowerCase().includes("công viên")
            : spotCategory === "gym"
              ? item.location_type.toLowerCase().includes("gym") || item.name.toLowerCase().includes("gym")
              : Number(item.rating ?? 0) >= 4.5;

      const matchesQuery = [item.name, item.address, item.city, item.district].some((value) =>
        (value ?? "").toLowerCase().includes(query),
      );

      const matchesRecent = recentOnly ? (item.reviews ?? 0) >= 0 : true;

      return matchesCategory && matchesQuery && matchesRecent;
    });
  }, [locations, recentOnly, spotCategory, spotQuery]);

  const sortedReviews = useMemo(() => {
    if (commentSort === "highest") {
      return [...reviewCards].sort((a, b) => b.score - a.score);
    }
    return reviewCards;
  }, [commentSort]);

  const moderationLocations = useMemo(() => ["all", ...new Set(violationCards.map((item) => item.location))], []);

  const searchFilterItems = useMemo(() => {
    const query = spotQuery.trim().toLowerCase();

    const countMatches = (category: "all" | "park" | "gym" | "favorite") =>
      locations.filter((item) => {
        const matchesCategory =
          category === "all"
            ? true
            : category === "park"
              ? item.location_type.toLowerCase().includes("park") || item.name.toLowerCase().includes("công viên")
              : category === "gym"
                ? item.location_type.toLowerCase().includes("gym") || item.name.toLowerCase().includes("gym")
                : Number(item.rating ?? 0) >= 4.5;

        const matchesQuery = [item.name, item.address, item.city, item.district].some((value) =>
          (value ?? "").toLowerCase().includes(query),
        );

        return matchesCategory && matchesQuery;
      }).length;

    return [
      { id: "all" as const, label: "Tất cả", count: countMatches("all") },
      { id: "park" as const, label: "Công viên", count: countMatches("park") },
      { id: "gym" as const, label: "Gym", count: countMatches("gym") },
      { id: "favorite" as const, label: "Yêu thích", count: countMatches("favorite") },
    ];
  }, [locations, spotQuery]);

  const moderationItems = useMemo(() => {
    return violationCards.filter((item) => {
      const status = moderationStatusById[item.userId] ?? "pending";
      const locationMatch = moderationLocation === "all" ? true : item.location === moderationLocation;
      const statusMatch = (showPending && status === "pending") || (showDeleted && status === "deleted");
      return locationMatch && statusMatch;
    });
  }, [moderationLocation, moderationStatusById, showDeleted, showPending]);

  const selectedAqi = currentAqi;
  const aqiLabel = computedAdvice.label;
  function requireLogin(message: string) {
    if (role !== "guest") return;
    setPromptMessage(message);
    setShowPrompt(true);
  }

  function closePrompt() {
    setShowPrompt(false);
  }

  function guestGuard(action: () => void, message: string) {
    if (role === "guest") {
      requireLogin(message);
      return;
    }
    action();
  }

  const renderPrompt = showPrompt ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-4xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Shield className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-center text-2xl text-slate-900">Cần đăng nhập</h3>
        <p className="mt-2 text-center text-sm leading-6 text-slate-500">{promptMessage}</p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setView("home")} className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-white">
            Đăng nhập
          </button>
          <button onClick={closePrompt} className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-slate-600 ring-1 ring-slate-200">
            Hủy
          </button>
        </div>
      </div>
    </div>
  ) : null;

  let content: React.ReactElement | null = null;

  if (view === "home") {
    content = (
      <div className="space-y-5">
        <section className="rounded-4xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="mt-1 text-2xl text-emerald-600">Trang chủ</h2>
            </div>
            <Badge tone="green">{role === "admin" ? "Quản trị" : role === "guest" ? "Khách" : "Người dùng"}</Badge>
          </div>

          <div className="mt-5 flex flex-col items-center gap-4 rounded-[2.5rem] bg-[#f7fbf7] p-5 text-center shadow-[0_30px_60px_-45px_rgba(16,185,129,0.35)] ring-1 ring-emerald-100">
            <div className="flex h-48 w-48 items-center justify-center rounded-full border-8 border-emerald-500 bg-white text-slate-900 shadow-inner">
              <div>
                <div className="text-6xl font-semibold tracking-tight">{selectedAqi}</div>
                <div className="mt-2 text-sm uppercase tracking-[0.18em] text-emerald-700">AQI · {aqiLabel}</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <div className="text-sm text-slate-600">
                {gpsAqi?.location_name || "Chưa xác định vị trí"}
              </div>
              <button
                onClick={onRefreshGpsAqi}
                disabled={gpsLoading}
                className={`inline-flex items-center justify-center rounded-full p-1.5 transition ${gpsLoading ? "animate-spin" : "hover:bg-emerald-100"}`}
                title="Tải lại AQI"
              >
                <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <div className="grid w-full grid-cols-3 gap-2">
              <div className="rounded-[1.1rem] bg-emerald-50 px-2 py-2.5 text-center ring-1 ring-emerald-200">
                <div className="text-[10px] uppercase tracking-[0.14em] text-emerald-600">Nhiệt độ</div>
                <div className="mt-1 text-lg font-semibold text-emerald-700">
                  {gpsAqi?.temperature ?? "-"}°
                </div>
              </div>
              <div className="rounded-[1.1rem] bg-cyan-50 px-2 py-2.5 text-center ring-1 ring-cyan-200">
                <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-600">Độ ẩm</div>
                <div className="mt-1 text-lg font-semibold text-cyan-700">
                  {gpsAqi?.humidity ?? "-"}%
                </div>
              </div>
              <div className="rounded-[1.1rem] bg-blue-50 px-2 py-2.5 text-center ring-1 ring-blue-200">
                <div className="text-[10px] uppercase tracking-[0.14em] text-blue-600">Gió</div>
                <div className="mt-1 text-lg font-semibold text-blue-700">
                  {gpsAqi?.wind_speed ?? "-"} m/s
                </div>
              </div>
            </div>
          </div>

          {gpsError ? (
            <div className="rounded-[1.8rem] bg-rose-50 p-4 text-sm text-rose-700 ring-1 ring-rose-200">
              {gpsError}
            </div>
          ) : null}
        </section>

        <section className="grid gap-3">
          <div className="rounded-[1.8rem] bg-emerald-50 p-4 ring-1 ring-emerald-200">
            <div className="text-sm text-emerald-700">Lời khuyên sức khỏe</div>
            <div className="mt-1 text-lg text-slate-900">{computedAdvice.title}</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{computedAdvice.body}</p>
          </div>

          <div className="rounded-[1.8rem] bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">Thông báo gần đây</div>
                <div className="text-lg text-slate-900">Cập nhật mới</div>
              </div>
              <button onClick={() => setView("alert")} className="text-sm text-emerald-700">Xem tất cả</button>
            </div>
            <div className="mt-4 space-y-3">
              {(dashboard?.recentAdviceEvents ?? []).slice(0, 2).map((item) => (
                <button key={item.id} onClick={() => setView("alert")} className="w-full rounded-2xl bg-slate-50 p-4 text-left ring-1 ring-slate-200">
                  <div className="text-sm text-slate-900">{item.title}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">{item.body}</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }
  if (view === "search") {
    content = (
      <div className="mx-auto max-w-3xl space-y-3">
        <section className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="mt-1 text-xl text-slate-900">Tìm địa điểm</h2>
            </div>
            <Badge tone="green">{filteredSpots.length} kết quả</Badge>
          </div>

          <div className="mt-4 space-y-3 rounded-[1.5rem] bg-slate-50/80 p-3 ring-1 ring-slate-200 sm:p-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Từ khóa</label>
              <div className="mt-2 flex items-center gap-3 rounded-[1.2rem] bg-white px-3 py-3 ring-1 ring-slate-200">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={spotQuery}
                  onChange={(event) => setSpotQuery(event.target.value)}
                  placeholder="Tìm kiếm công viên, gym, khu tập ngoài trời..."
                  className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Bộ lọc</div>
                <button
                  onClick={() => setShowSearchFilters((value) => !value)}
                  className="mt-2 flex w-full items-center justify-between rounded-[1.2rem] bg-white px-3 py-3 text-left text-sm text-slate-700 ring-1 ring-slate-200"
                >
                  <span>{searchFilterItems.find((item) => item.id === spotCategory)?.label ?? "Tất cả"}</span>
                  <span className="text-xs text-slate-400">{showSearchFilters ? "Ẩn" : "Lọc"}</span>
                </button>

                {showSearchFilters ? (
                  <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-[1.2rem] bg-white shadow-lg ring-1 ring-slate-200">
                    {searchFilterItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSpotCategory(item.id);
                          setShowSearchFilters(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-3 text-sm transition ${
                          spotCategory === item.id ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className="text-xs text-slate-400">{item.count} kết quả</span>
                      </button>
                    ))}

                    <div className="border-t border-slate-100 px-3 py-2">
                      <button
                        onClick={() => setRecentOnly((value) => !value)}
                        className={`rounded-full px-3 py-1.5 text-xs ring-1 transition ${
                          recentOnly ? "bg-emerald-100 text-emerald-700 ring-emerald-300" : "bg-white text-slate-600 ring-slate-200"
                        }`}
                      >
                        {recentOnly ? "Gần đây" : "Tất cả thời điểm"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-start">
                <div className="rounded-full bg-white px-3 py-1.5 text-xs text-slate-500 ring-1 ring-slate-200">
                  {recentOnly ? "Đang lọc gần đây" : "Hiện tất cả"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Kết quả</div>
              <div className="text-base text-slate-900">Địa điểm phù hợp</div>
            </div>
            <div className="text-[11px] text-slate-500">Mobile-first</div>
          </div>

          {filteredSpots.length ? filteredSpots.map((spot, index) => (
            <button
              key={spot.id}
              onClick={() => {
                setSelectedSpotId(spot.id);
                setView("spot-detail");
              }}
              className="w-full rounded-[1.4rem] bg-white p-3.5 text-left shadow-sm ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1rem] bg-linear-to-br from-emerald-100 to-lime-100 text-emerald-700">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-base text-slate-900">{spot.name}</div>
                      <div className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{spot.address ?? spot.district ?? "Hà Nội"}</div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] ring-1 ${index % 2 === 0 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-sky-50 text-sky-700 ring-sky-200"}`}>
                        AQI {40 + index * 7}
                      </span>
                      {Number(spot.rating ?? 0) >= 4.5 ? <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700 ring-1 ring-emerald-200">Yêu thích</span> : null}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">{(0.8 + index * 0.2).toFixed(1)} km</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">{spot.location_type}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">{Number(spot.rating ?? 4.6).toFixed(1)} / 5</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap gap-1.5 text-[11px] text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">{spot.city ?? "Hà Nội"}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">{spot.district ?? "Khu trung tâm"}</span>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-emerald-700">Chi tiết</span>
                  </div>
                </div>
              </div>
            </button>
          )) : (
            <div className="rounded-[1.4rem] bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">
              Không có địa điểm phù hợp với bộ lọc hiện tại.
            </div>
          )}

          <div className="rounded-[1.4rem] bg-emerald-50 p-4 ring-1 ring-emerald-200">
            <div className="text-xs uppercase tracking-[0.18em] text-emerald-700">Gợi ý theo AQI</div>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              AQI hiện tại ở mức {selectedAqi}. Nên ưu tiên công viên nhiều cây xanh hoặc phòng tập kín nếu bạn muốn vận động lâu.
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (view === "spot-detail") {
    content = (
      <div className="space-y-5">
        <section className="rounded-4xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => setView("search")} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </button>
            <button onClick={() => guestGuard(() => setView("route"), "Lộ trình xanh cần đăng nhập.")} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm text-white">
              <Navigation className="h-4 w-4" />
              Lộ trình
            </button>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[1.8rem] bg-linear-to-br from-slate-900 to-slate-700 p-6 text-white">
              <div className="text-sm text-white/75">Màn hình chi tiết địa điểm và đánh giá</div>
              <h2 className="mt-2 text-3xl">{activeSpot?.name ?? "Bách Thảo Park"}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">Địa điểm được mô tả theo đúng layout tài liệu: hiển thị điểm an toàn, PM2.5, giới thiệu, và nút xem tất cả bình luận.</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <SmallStat label="Safety score" value="84" detail="0-100" dark />
                <SmallStat label="PM2.5" value="18 µg/m³" detail="Trạng thái tốt" dark />
                <SmallStat label="Facilities" value="4" detail="Nước · bóng râm" dark />
              </div>
            </div>

            <div className="space-y-3 rounded-[1.8rem] bg-slate-50 p-5 ring-1 ring-slate-200">
              <div className="text-sm text-slate-500">Tiện ích</div>
              <div className="flex flex-wrap gap-2">
                {["Nước", "Bóng râm", "Yoga", "HEPA"].map((item) => (
                  <span key={item} className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200">{item}</span>
                ))}
              </div>
              <div className="rounded-3xl bg-white p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
                Giới thiệu ngắn về địa điểm, các điều kiện tập luyện, và lời khuyên theo AQI hiện tại.
              </div>
              <button onClick={() => setView("comments")} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm text-white">Xem tất cả bình luận</button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (view === "comments") {
    content = (
      <div className="space-y-5">
        <section className="rounded-4xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setView("spot-detail")} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
              <ArrowLeft className="h-4 w-4" />
              Trở về
            </button>
            <select
              value={commentSort}
              onChange={(event) => setCommentSort(event.target.value as "newest" | "highest")}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200"
            >
              <option value="newest">Mới nhất</option>
              <option value="highest">Đánh giá cao nhất</option>
            </select>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[1.8rem] bg-slate-50 p-5 ring-1 ring-slate-200">
              <div className="text-sm text-slate-500">Tổng quan</div>
              <div className="mt-2 text-5xl text-slate-900">4.8</div>
              <div className="mt-1 text-sm text-slate-500">Đánh giá từ cộng đồng</div>
              <div className="mt-4 space-y-2 text-xs text-slate-600">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-4">{star}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${star * 16}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {sortedReviews.map((item) => (
                <article key={`${item.name}-${item.time}`} className="rounded-[1.6rem] bg-white p-4 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.time}</div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: item.score }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
                </article>
              ))}

              <div className="rounded-[1.6rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                <textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  disabled={role === "guest"}
                  placeholder={role === "guest" ? "Hãy đăng nhập để đăng bài đánh giá" : "Hãy nhập đánh giá của bạn"}
                  className="min-h-28 w-full rounded-2xl bg-white p-4 text-sm outline-none ring-1 ring-slate-200 disabled:cursor-not-allowed"
                />
                <button
                  onClick={() => (role === "guest" ? requireLogin("Cần đăng nhập để gửi bình luận.") : undefined)}
                  className="mt-3 rounded-2xl bg-emerald-600 px-4 py-3 text-sm text-white disabled:opacity-60"
                  disabled={role === "guest"}
                >
                  Gửi bình luận
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (view === "route") {
    content = role === "guest" ? (
      <div className="space-y-5">
        <section className="rounded-4xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-500">Guest preview</div>
              <h2 className="text-2xl text-slate-900">Bản đồ và tìm đường dành cho người dùng đăng nhập</h2>
            </div>
            <button onClick={() => setView("home")} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
              <ArrowLeft className="mr-2 inline h-4 w-4" />
              Quay lại
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {featuredExercisePlaces.slice(0, 3).map((place) => (
              <article key={place.id} className="rounded-[1.7rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="text-sm text-slate-500">Địa điểm tập luyện</div>
                <div className="mt-1 text-lg text-slate-900">{place.name}</div>
                <div className="mt-2 text-sm text-slate-600">{place.address}</div>
                <div className="mt-3 text-xs text-slate-500">{place.rating?.toFixed(1) ?? "-"}★ · {place.workday_timing ?? "Mở cửa"}</div>
              </article>
            ))}
          </div>
        </section>
      </div>
    ) : (
      <div className="space-y-5">
        <RoutePlannerView
          locations={locations}
          maxRatio={maxRatio}
          setMaxRatio={setMaxRatio}
          onSubmit={onCreateRoute}
          routeHistory={routeHistory}
          loading={routeSubmitting}
        />
      </div>
    );
  }

  if (view === "alert") {
    content = (
      <div className="space-y-5">
        <section className="rounded-4xl bg-linear-to-br from-rose-600 via-orange-500 to-amber-400 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setView("home")} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm ring-1 ring-white/20">
              <ArrowLeft className="h-4 w-4" />
              Home
            </button>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs ring-1 ring-white/20">Health warning</span>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[1.8rem] bg-white/15 p-5 ring-1 ring-white/20">
              <div className="text-sm text-white/80">AQI</div>
              <div className="mt-2 text-6xl font-semibold">{selectedAqi}</div>
              <div className="mt-2 text-lg">{aqiLabel}</div>
              <div className="mt-3 text-sm leading-6 text-white/85">Cảnh báo sức khỏe hiện tại dựa trên chỉ số AQI và điều kiện thời tiết.</div>
            </div>
            <div className="rounded-[1.8rem] bg-white p-5 text-slate-900 ring-1 ring-white/20">
              <div className="text-sm text-slate-500">Phản hồi chuyên gia</div>
              <div className="mt-2 text-2xl">{advice?.title ?? "Hạn chế vận động cường độ cao"}</div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{advice?.body ?? "Ưu tiên tuyến đường xanh và cân nhắc không gian trong nhà nếu cảm thấy khó chịu."}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {featuredExercisePlaces.slice(0, 3).map((spot) => (
            <article key={spot.name} className="rounded-[1.7rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-500">Safety spot</div>
                  <div className="mt-1 text-lg text-slate-900">{spot.name}</div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200">{spot.rating?.toFixed(1) ?? "-"}★</span>
              </div>
              <div className="mt-4 text-4xl text-slate-900">AQI {Math.max(30, 120 - (spot.rating ?? 0) * 15)}</div>
              <div className="mt-2 text-sm text-slate-500">{spot.address}</div>
              <button onClick={() => setView("spot-detail")} className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-700">
                Chi tiết <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          ))}
        </section>
      </div>
    );
  }

  if (view === "profile") {
    content = (
      <div className="mx-auto max-w-3xl space-y-3">
        <section className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl text-slate-900">Hồ sơ và cài đặt</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200">Role 1</span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-[1.6rem] bg-linear-to-br from-emerald-700 to-emerald-500 p-4 text-white">
              <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-18 w-18 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/20">
                    <UserRound className="h-8 w-8" />
                  </div>
                </div>
                <div className="min-w-0 text-center sm:text-left">
                  <div className="text-lg">{profile?.user.full_name ?? user.full_name ?? "Người dùng"}</div>
                  <div className="mt-1 truncate text-xs text-white/80">{profile?.user.email ?? user.email}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/70">Thành viên SafeMove</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-white/85">
                <div className="rounded-2xl bg-white/12 p-2.5 text-center ring-1 ring-white/15">
                  <div className="text-white/70">AQI</div>
                  <div className="mt-1 text-sm font-medium">{profile?.profile?.alert_threshold ?? 140}</div>
                </div>
                <div className="rounded-2xl bg-white/12 p-2.5 text-center ring-1 ring-white/15">
                  <div className="text-white/70">Route</div>
                  <div className="mt-1 text-sm font-medium">x {Number(profile?.profile?.default_max_route_ratio ?? 1.5).toFixed(1)}</div>
                </div>
                <div className="rounded-2xl bg-white/12 p-2.5 text-center ring-1 ring-white/15">
                  <div className="text-white/70">Push</div>
                  <div className="mt-1 text-sm font-medium">{pushEnabled ? "ON" : "OFF"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.4rem] bg-emerald-50 p-4 ring-1 ring-emerald-200">
              <div className="text-xs uppercase tracking-[0.18em] text-emerald-700">Tình trạng sức khỏe</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(profile?.conditions ?? []).length ? (
                  (profile?.conditions ?? []).map((item) => (
                    <Badge key={item.id} tone="green">{item.name}</Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Chưa có dữ liệu tình trạng sức khỏe.</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-[1.4rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Thông tin cá nhân</div>
                <div className="mt-3 grid gap-3">
                  <ProfileField label="Họ và tên" value={editFullName} onChange={setEditFullName} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <ProfileField label="Email" value={profile?.user.email ?? user.email} />
                    <ProfileField label="Số điện thoại" value={editPhone} onChange={setEditPhone} />
                  </div>
                </div>
              </div>

              <div className="rounded-[1.4rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Ngưỡng AQI</div>
                    <div className="mt-1 text-2xl text-slate-900">{aqiThresholdInput}</div>
                  </div>
                  <Badge tone="green">{computedAdvice.label}</Badge>
                </div>
                <input
                  type="range"
                  min={50}
                  max={200}
                  value={aqiThresholdInput}
                  onChange={(event) => setAqiThresholdInput(Number(event.target.value))}
                  className="mt-4 w-full accent-emerald-600"
                />
                <div className="mt-2 text-xs leading-5 text-slate-500">
                  Khi AQI vượt ngưỡng này, ứng dụng sẽ ưu tiên cảnh báo sớm và gợi ý tuyến ít phơi nhiễm hơn.
                </div>
              </div>

              <div className="rounded-[1.4rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Thông báo</div>
                <div className="mt-3 space-y-2">
                  <ToggleRow label="Thông báo đẩy" checked={pushEnabled} onToggle={() => setPushEnabled((value) => !value)} />
                  <ToggleRow label="Cập nhật qua email" checked={mailEnabled} onToggle={() => setMailEnabled((value) => !value)} />
                </div>
              </div>

              <button
                onClick={() =>
                  void onSaveProfile({
                    fullName: editFullName,
                    phone: editPhone,
                    alertThreshold: aqiThresholdInput,
                    defaultMaxRouteRatio: maxRatio,
                    pushEnabled,
                    mailEnabled,
                  })
                }
                disabled={profileSaving}
                className="w-full rounded-[1.2rem] bg-emerald-600 px-5 py-3 text-sm text-white shadow-lg shadow-emerald-600/15 disabled:opacity-60"
              >
                {profileSaving ? "Đang lưu..." : "Lưu cài đặt"}
              </button>

              <button
                onClick={onLogout}
                className="w-full rounded-[1.2rem] bg-rose-50 px-5 py-3 text-sm text-rose-700 ring-1 ring-rose-200"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (view === "dashboard") {
    content = (
      <div className="space-y-5">
        <section className="rounded-4xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-500">System admin dashboard</div>
              <h2 className="text-2xl text-slate-900">Bảng điều khiển quản trị hệ thống</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView("facilities")} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">Quản lý cơ sở</button>
              <button onClick={() => setView("moderation")} className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white">Quản lý vi phạm</button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <SmallStat label="AQI trung bình" value={String(dashboard?.nearestAqi?.aqi ?? 42)} detail="Hà Nội" />
            <SmallStat label="Người dùng hoạt động" value="1,284" detail="+8.2%" />
            <SmallStat label="Cảnh báo" value={String(notifications.length || 12)} detail="Đang chờ xử lý" />
            <SmallStat label="Cơ sở" value={String(featuredExercisePlaces.length)} detail="Đang hoạt động" />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.8rem] bg-white p-5 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-slate-900">
              <CircleAlert className="h-5 w-5 text-rose-500" />
              <h3>Khẩn cấp</h3>
            </div>
            <div className="mt-4 space-y-3">
              {violationCards.map((item) => (
                <article key={item.userId} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-slate-900">{item.title}</div>
                      <div className="mt-1 text-xs text-slate-500">User ID: {item.userId} · {item.location}</div>
                    </div>
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700 ring-1 ring-rose-200">Vi phạm {item.count} lần</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.content}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] bg-slate-900 p-5 text-white">
            <div className="flex items-center gap-2 text-white/80">
              <Users className="h-5 w-5" />
              <h3>Thống kê nhanh</h3>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SmallStat label="Active users" value="1,284" detail="Online now" dark />
              <SmallStat label="Avg AQI" value="42" detail="Trung bình thành phố" dark />
              <SmallStat label="Reports" value="12" detail="Cần kiểm duyệt" dark />
              <SmallStat label="Facilities" value="3" detail="Đã đăng ký" dark />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (view === "facilities") {
    content = (
      <div className="space-y-5">
        <section className="rounded-4xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-500">Facility management</div>
              <h2 className="text-2xl text-slate-900">Màn hình quản lý thông tin cơ sở</h2>
            </div>
            <button onClick={() => setView("facility-add")} className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white">
              <Plus className="mr-2 inline h-4 w-4" />
              Thêm cơ sở mới
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {featuredExercisePlaces.map((spot) => (
              <article key={spot.name} className="rounded-[1.7rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-500">{spot.location_type}</div>
                    <div className="mt-1 text-lg text-slate-900">{spot.name}</div>
                  </div>
                  <button className="rounded-xl bg-white p-2 text-slate-500 ring-1 ring-slate-200">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 text-sm text-slate-600">{spot.address}</div>
                <div className="mt-3 text-xs text-slate-500">AQI: {Math.max(30, 120 - (spot.rating ?? 0) * 15)}</div>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (view === "facility-add") {
    content = (
      <div className="space-y-5">
        <section className="rounded-4xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <button onClick={() => setView("facilities")} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
            <ArrowLeft className="h-4 w-4" />
            Trở về
          </button>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.8rem] bg-slate-50 p-5 ring-1 ring-slate-200">
              <div className="text-sm text-slate-500">Màn hình thêm cơ sở mới</div>
              <div className="mt-4 flex min-h-72 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-slate-500">
                Map placeholder with draggable pin
              </div>
            </div>

            <div className="space-y-3 rounded-[1.8rem] bg-slate-50 p-5 ring-1 ring-slate-200">
              {[
                ["Tên cơ sở", "Hoàn Kiếm Gym"],
                ["Địa chỉ", "Hoàn Kiếm, Hà Nội"],
                ["Mô tả", "Không gian xanh, có HEPA"],
              ].map(([label, value]) => (
                <ProfileField key={label} label={label} value={value} />
              ))}
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div className="text-sm text-slate-600">Japan-friendly</div>
                <div className="mt-2 flex gap-2">
                  <Badge tone="green">ON</Badge>
                  <Badge>HEPA</Badge>
                  <Badge>Yoga</Badge>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-white">Lưu</button>
                <button onClick={() => setView("facilities")} className="flex-1 rounded-2xl bg-white px-4 py-3 text-slate-600 ring-1 ring-slate-200">Hủy</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (view === "moderation") {
    content = (
      <div className="space-y-5">
        <section className="rounded-4xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-500">Comment moderation</div>
              <h2 className="text-2xl text-slate-900">Màn hình quản lý bình luận vi phạm</h2>
            </div>
            <button onClick={() => setView("dashboard")} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
              <ArrowLeft className="mr-2 inline h-4 w-4" />
              Dashboard
            </button>
          </div>

          <div className="mt-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="text-xs text-slate-500">Lọc theo địa điểm</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {moderationLocations.map((item) => (
                <button
                  key={item}
                  onClick={() => setModerationLocation(item)}
                  className={`rounded-full px-3 py-1.5 text-xs ring-1 ${
                    moderationLocation === item
                      ? "bg-emerald-600 text-white ring-emerald-600"
                      : "bg-white text-slate-600 ring-slate-200"
                  }`}
                >
                  {item === "all" ? "Tất cả" : item}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-4 text-xs text-slate-600">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={showPending} onChange={(event) => setShowPending(event.target.checked)} className="accent-emerald-600" />
                Chưa xử lý
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} className="accent-emerald-600" />
                Đã xóa
              </label>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {moderationItems.map((item) => {
              const status = moderationStatusById[item.userId] ?? "pending";

              return (
              <article key={item.userId} className="rounded-[1.7rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-500">User ID: {item.userId}</div>
                    <div className="mt-1 text-lg text-slate-900">{item.title}</div>
                    <div className="mt-2 text-sm text-slate-600">{item.content}</div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ring-1 ${status === "pending" ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-sky-50 text-sky-700 ring-sky-200"}`}>
                    {status === "pending" ? `Vi phạm ${item.count} lần` : "Đã xóa"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{item.location}</span>
                  <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{item.createdAt}</span>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setModerationStatusById((prev) => ({ ...prev, [item.userId]: "deleted" }))}
                    className="rounded-2xl bg-rose-600 px-4 py-2 text-sm text-white"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => setModerationStatusById((prev) => ({ ...prev, [item.userId]: "pending" }))}
                    className="rounded-2xl bg-emerald-100 px-4 py-2 text-sm text-emerald-700"
                  >
                    Khôi phục
                  </button>
                </div>
              </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  if (view === "admin-profile") {
    content = (
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-4xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-500">Admin profile</div>
              <h2 className="text-2xl text-slate-900">Màn hình hồ sơ quản trị viên</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200">Xác thực</span>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[1.8rem] bg-linear-to-br from-slate-900 to-slate-700 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/20">
                  <Shield className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-lg">Lê Minh Anh</div>
                  <div className="text-sm text-white/80">Quản trị viên hệ thống</div>
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-white/12 p-4 text-sm ring-1 ring-white/15">
                Trạng thái xác thực: <strong>Đã xác nhận</strong>
              </div>
            </div>

            <div className="rounded-[1.8rem] bg-slate-50 p-5 ring-1 ring-slate-200">
              <ProfileField label="Họ tên" value="Lê Minh Anh" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ProfileField label="Email" value="minhanh.le@email.com" />
                <ProfileField label="Số điện thoại" value="0900 000 000" />
              </div>
              <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div className="text-sm text-slate-600">Quyền truy cập</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="green">Dashboard</Badge>
                  <Badge tone="green">Facilities</Badge>
                  <Badge tone="green">Moderation</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {content}
      {renderPrompt}
    </div>
  );
}

function SmallStat({ label, value, detail, dark = false }: { label: string; value: string; detail: string; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ring-1 ${dark ? "bg-white/10 ring-white/10 text-white" : "bg-slate-50 ring-slate-200"}`}>
      <div className={`text-xs ${dark ? "text-white/70" : "text-slate-500"}`}>{label}</div>
      <div className="mt-2 text-3xl">{value}</div>
      <div className={`mt-1 text-xs ${dark ? "text-white/70" : "text-slate-500"}`}>{detail}</div>
    </div>
  );
}

function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "green" | "rose" | "blue" }) {
  const className =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "rose"
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : tone === "blue"
          ? "bg-sky-50 text-sky-700 ring-sky-200"
          : "bg-slate-100 text-slate-600 ring-slate-200";

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs ring-1 ${className}`}>{children}</span>;
}

function ProfileField({ label, value, onChange }: { label: string; value: string; onChange?: (value: string) => void }) {
  if (onChange) {
    return (
      <label className="block">
        <div className="mb-1.5 text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-[1rem] bg-white px-3 py-2.5 text-sm text-slate-800 ring-1 ring-slate-200"
        />
      </label>
    );
  }
  return (
    <label className="block">
      <div className="mb-1.5 text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="rounded-[1rem] bg-white px-3 py-2.5 text-sm text-slate-800 ring-1 ring-slate-200">{value || "—"}</div>
    </label>
  );
}


function ToggleRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex w-full items-center justify-between rounded-[1rem] bg-white px-3 py-2.5 text-sm text-slate-700 ring-1 ring-slate-200">
      <span>{label}</span>
      <span className={`inline-flex h-6 w-11 items-center rounded-full p-1 transition ${checked ? "bg-emerald-600" : "bg-slate-300"}`}>
        <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </button>
  );
}
