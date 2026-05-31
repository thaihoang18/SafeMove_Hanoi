import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, ChevronDown, CircleAlert, Edit3, MapPin, Plus, Trash2, Users } from "lucide-react";
import { fetchAdminDashboard, fetchAdminHiddenReviews, fetchIqAirAqiByCoordinates, updateReview } from "@/lib/api";
import { Shell, type View } from "./Shell";
import { createLocation, deleteLocation, fetchLocations, updateLocation } from "@/lib/api";
import type { GpsAqiMeasurement, LocationRecord } from "@/lib/types";

type Props = {
  userId: string;
  userName: string;
  onLogout: () => void;
};

type AdminOverview = {
  systemAqi: number;
  activeUsers: number;
  totalLocations: number;
  pendingModeration: number;
};

type LocationFormState = {
  name: string;
  locationType: string;
  city: string;
  district: string;
  address: string;
  lat: string;
  lng: string;
};

type ModerationStatus = "unprocessed" | "deleted";

type ModerationItem = {
  id: string;
  locationId: string;
  locationName: string;
  userId: string;
  author: string;
  violationCount: number;
  content: string;
  timestamp: string;
  status: ModerationStatus;
};

const emptyForm: LocationFormState = {
  name: "",
  locationType: "indoor_place",
  city: "",
  district: "",
  address: "",
  lat: "",
  lng: "",
};

// moderation items will be loaded from backend hidden reviews

function getAqiTone(value: number) {
  if (value <= 50) return { label: "良好", badgeClass: "bg-emerald-100 text-emerald-700" };
  if (value <= 100) return { label: "Trung bình", badgeClass: "bg-amber-100 text-amber-700" };
  if (value <= 150) return { label: "Kém", badgeClass: "bg-orange-100 text-orange-700" };
  return { label: "Xấu", badgeClass: "bg-rose-100 text-rose-700" };
}

export function AdminWorkspace({ userId, userName, onLogout }: Props) {
  const [view, setView] = useState<View>("dashboard");
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [systemAqi, setSystemAqi] = useState<GpsAqiMeasurement | null>(null);
  const [systemAqiLoading, setSystemAqiLoading] = useState(false);
  const [systemAqiError, setSystemAqiError] = useState<string | null>(null);
  const [demoActiveUsers] = useState(() => 16 + Math.floor(Math.random() * 35));
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [formState, setFormState] = useState<LocationFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [moderationLocation, setModerationLocation] = useState("all");
  const [moderationLocationMenuOpen, setModerationLocationMenuOpen] = useState(false);
  const [showAllModerationComments, setShowAllModerationComments] = useState(true);
  const [showUnprocessed, setShowUnprocessed] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [moderationStatusById, setModerationStatusById] = useState<Record<string, ModerationStatus>>({});
  const [moderationItemsList, setModerationItemsList] = useState<ModerationItem[]>([]);
  const [moderationUpdatingById, setModerationUpdatingById] = useState<Record<string, boolean>>({});

  const loadModerationItems = async () => {
    try {
      const resp = await fetchAdminHiddenReviews();
      const items: ModerationItem[] = (resp.reviews || []).map((r: any) => ({
        id: String(r.id),
        locationId: String(r.location_id || ""),
        locationName: r.location_name || r.location_id || "",
        userId: String(r.user_id || ""),
        author: String(r.author || r.full_name || r.user_id || "Ẩn danh"),
        violationCount: 1,
        content: String(r.content || ""),
        timestamp: r.created_at ? new Date(r.created_at).toLocaleString() : "",
        status: r.metadata && r.metadata.moderation && r.metadata.moderation.status === "deleted" ? "deleted" : "unprocessed",
      }));
      setModerationItemsList(items);
      // Initialize statuses only for items we just loaded, but preserve existing manual overrides
      setModerationStatusById((current) => {
        const next = { ...current } as Record<string, ModerationStatus>;
        for (const it of items) {
          if (!(it.id in next)) next[it.id] = it.status;
        }
        return next;
      });
    } catch (err) {
      // ignore
    }
  };

  const loadOverview = async () => {
    try {
      const response = await fetchAdminDashboard();
      setOverview(response.overview);
    } catch (error) {
      setOverview(null);
    }
  };

  const handleRefreshSystemAqi = async () => {
    if (!navigator.geolocation) {
      setSystemAqiError("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }

    try {
      const permission = await navigator.permissions?.query?.({ name: "geolocation" as PermissionName });
      if (permission?.state === "denied") {
        setSystemAqiError("Trình duyệt đã chặn vị trí GPS. Mở cài đặt trình duyệt để cho phép.");
        return;
      }
    } catch {
      // ignore unsupported permissions API
    }

    setSystemAqiLoading(true);
    setSystemAqiError(null);

    const getPosition = (options: PositionOptions) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

    try {
      const position = await getPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }).catch(async (error) => {
        const errorValue = error as GeolocationPositionError;
        if (errorValue.code === 3) {
          return await getPosition({ enableHighAccuracy: false, timeout: 18000, maximumAge: 0 });
        }
        throw error;
      });

      const { latitude, longitude } = position.coords;
      const data = await fetchIqAirAqiByCoordinates(latitude, longitude);
      setSystemAqi(data.measurement);
    } catch (error) {
      setSystemAqi(null);
      setSystemAqiError(error instanceof Error ? error.message : "Không thể tải AQI hệ thống từ IQAir.");
    } finally {
      setSystemAqiLoading(false);
    }
  };

  const refreshLocations = async () => {
    setLoadingLocations(true);
    setLocationsError(null);

    try {
      const response = await fetchLocations();
      setLocations(response.locations as LocationRecord[]);
    } catch (error) {
      setLocationsError(error instanceof Error ? error.message : "Không thể tải danh sách địa điểm.");
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    void refreshLocations();
    void loadOverview();
  }, []);

  useEffect(() => {
    if (view !== "dashboard") {
      return;
    }

    void handleRefreshSystemAqi();
  }, [view]);

  const moderationLocations = useMemo(() => {
    const entries = new Map<string, string>();
    for (const item of moderationItemsList) {
      if (!entries.has(item.locationId)) {
        entries.set(item.locationId, item.locationName.trim() || "Cơ sở chưa đặt tên");
      }
    }

    return [
      { id: "all", label: "Tất cả" },
      ...Array.from(entries.entries()).map(([id, label]) => ({ id, label })),
    ];
  }, [moderationItemsList]);

  const moderationItems = useMemo(() => {
    return moderationItemsList.filter((item) => {
      const status = moderationStatusById[item.id] ?? item.status;
      const locationMatch = moderationLocation === "all" ? true : item.locationId === moderationLocation;
      const statusMatch =
        showAllModerationComments || (status === "unprocessed" && showUnprocessed) || (status === "deleted" && showDeleted);

      return locationMatch && statusMatch;
    });
  }, [moderationLocation, moderationStatusById, showAllModerationComments, showDeleted, showUnprocessed, moderationItemsList]);

  const moderationLocationLabels = useMemo<Record<string, string>>(() => {
    return Object.fromEntries(
      moderationItemsList.map((item) => [item.locationId, item.locationName])
    );
  }, [moderationItemsList]);

  const moderationLocationLabel = moderationLocations.find((location) => location.id === moderationLocation)?.label ?? "Tất cả";

  function getModerationLocationImage(locationId: string) {
    const normalized = locationId.toLowerCase();

    if (/(bachthao|ba^ch th?o|bach thao|bach_thao)/.test(normalized)) {
      return "https://images.unsplash.com/photo-1542272201-b1ca555f8505?auto=format&fit=crop&w=400&q=80";
    }

    if (/(hoankiem|hoan kiem)/.test(normalized)) {
      return "https://images.unsplash.com/photo-1559592413-7cea4ee303e1?auto=format&fit=crop&w=400&q=80";
    }

    if (/(tayho|tay ho)/.test(normalized)) {
      return "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80";
    }

    return "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80";
  }

  function getModerationAvatarLabel(item: ModerationItem) {
    const base = item.author.trim() || item.userId.trim() || item.locationName.trim() || "A";
    const parts = base.split(/\s+/).filter(Boolean);
    const initials = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : base.slice(0, 1);
    return initials.toUpperCase();
  }

  function startEdit(location: LocationRecord) {
    setEditingLocationId(location.id);
    setActionMessage(null);
    setFormError(null);
    setFormState({
      name: location.name,
      locationType: location.location_type,
      city: location.city ?? "",
      district: location.district ?? "",
      address: location.address ?? "",
      lat: String(location.lat),
      lng: String(location.lng),
    });
    setView("facility-add");
  }

  function resetForm() {
    setEditingLocationId(null);
    setFormState(emptyForm);
    setFormError(null);
  }

  async function submitLocation() {
    if (!formState.name.trim()) {
      setFormError("Vui lòng nhập tên địa điểm.");
      return;
    }

    const payload = {
      name: formState.name.trim(),
      locationType: formState.locationType.trim(),
      city: formState.city.trim() || null,
      district: formState.district.trim() || null,
      address: formState.address.trim() || null,
      lat: Number(formState.lat),
      lng: Number(formState.lng),
    };

    if (Number.isNaN(payload.lat) || Number.isNaN(payload.lng)) {
      setFormError("Vui lòng nhập tọa độ hợp lệ.");
      return;
    }

    setSavingLocation(true);
    setFormError(null);
    setActionMessage(null);

    try {
      if (editingLocationId) {
        await updateLocation(editingLocationId, payload);
        setActionMessage("Đã cập nhật địa điểm.");
      } else {
        await createLocation(payload);
        setActionMessage("Đã tạo địa điểm mới.");
      }

      await refreshLocations();
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không thể lưu địa điểm.");
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleDelete(locationId: string) {
    if (!window.confirm("Xóa địa điểm này?")) {
      return;
    }

    setActionMessage(null);

    try {
      await deleteLocation(locationId);
      await refreshLocations();
      if (editingLocationId === locationId) {
        resetForm();
      }
      setActionMessage("Đã xóa địa điểm.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Không thể xóa địa điểm.");
    }
  }

  function setCommentStatus(commentId: string, status: ModerationStatus) {
    // mark local state immediately
    setModerationStatusById((current) => ({ ...current, [commentId]: status }));

    const payload: { is_hidden?: boolean; metadata?: Record<string, unknown> } = {};
    if (status === "deleted") {
      payload.is_hidden = true;
      payload.metadata = { moderation: { status: "deleted", processed_by: "admin", processed_at: new Date().toISOString() } };
    } else {
      payload.is_hidden = false;
      payload.metadata = { moderation: { status: "approved", processed_by: "admin", processed_at: new Date().toISOString() } };
    }

    setModerationUpdatingById((cur) => ({ ...cur, [commentId]: true }));

    updateReview(commentId, payload)
      .then((resp) => {
        // update local list based on result without full reload
        if (payload.is_hidden === false) {
          // approved/unhidden: remove from hidden list
          setModerationItemsList((cur) => cur.filter((it) => it.id !== commentId));
          setModerationStatusById((cur) => {
            const next = { ...cur };
            delete next[commentId];
            return next;
          });
        } else {
          // marked deleted: update item's status in list
          setModerationItemsList((cur) => cur.map((it) => (it.id === commentId ? { ...it, status: "deleted" } : it)));
          setModerationStatusById((cur) => ({ ...cur, [commentId]: "deleted" }));
        }
      })
      .catch((err) => {
        // revert status on error
        setModerationStatusById((cur) => ({ ...cur, [commentId]: status === "deleted" ? "unprocessed" : "deleted" }));
        window.alert(err instanceof Error ? err.message : "Không thể cập nhật bình luận.");
      })
      .finally(() => {
        setModerationUpdatingById((cur) => ({ ...cur, [commentId]: false }));
      });
  }

  useEffect(() => {
    if (view === "moderation") {
      void loadModerationItems();
    }
  }, [view]);

  return (
    <Shell
      role="admin"
      view={view}
      setView={setView}
      userName={userName}
      unreadCount={0}
      onRequireLogin={() => undefined}
      onLogout={onLogout}
    >
      {view === "dashboard" && (
        <div className="space-y-5">
          <section className="rounded-4xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">Chào mừng trở lại, quản trị viên</div>
                <h2 className="mt-1 text-2xl text-slate-900">Tổng quan hệ thống</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200">Admin</span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <article className="rounded-[1.7rem] bg-white p-5 ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CircleAlert className="h-4 w-4 text-emerald-600" />
                    AQI hệ thống
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${getAqiTone(systemAqi?.aqi ?? overview?.systemAqi ?? 42).badgeClass}`}>
                    {getAqiTone(systemAqi?.aqi ?? overview?.systemAqi ?? 42).label}
                  </span>
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <div className="text-5xl font-semibold text-slate-900">{systemAqiLoading ? "--" : systemAqi?.aqi ?? overview?.systemAqi ?? 42}</div>
                  <div className="pb-1 text-sm text-slate-500">AQI</div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{systemAqi?.source === "iqair" ? "Nguồn: IQAir" : "Nguồn: hệ thống / IQAir"}</span>
                    <span>{systemAqi?.location_name ?? "Hà Nội"}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min((((systemAqi?.aqi ?? overview?.systemAqi ?? 42) / 50) * 100), 100)}%` }}
                    />
                  </div>
                  {systemAqiError && <div className="mt-2 text-xs text-rose-600">{systemAqiError}</div>}
                </div>
              </article>

              <article className="rounded-[1.7rem] bg-emerald-50 p-5 ring-1 ring-emerald-100">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Users className="h-4 w-4 text-emerald-600" />
                  Hoạt động hệ thống
                </div>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-4xl font-semibold text-emerald-700">{demoActiveUsers}</div>
                    <div className="mt-1 text-xs text-slate-500">Người dùng hoạt động 7 ngày gần đây</div>
                  </div>
                  <div className="flex -space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-50 bg-white text-[10px] text-slate-500">A</div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-50 bg-white text-[10px] text-slate-500">B</div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-50 bg-white text-[10px] text-slate-500">C</div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-50 bg-emerald-600 text-[10px] text-white">+{demoActiveUsers - 3}</div>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="rounded-4xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-3 text-rose-600 ring-1 ring-rose-200">
                  <CircleAlert className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Có nội dung vi phạm cần xử lý</div>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  </p>
                </div>
              </div>
              <button onClick={() => setView("moderation")} className="rounded-[1.25rem] bg-rose-600 px-4 py-3 text-sm text-white shadow-sm shadow-rose-600/15">
                Kiểm duyệt nội dung vi phạm
              </button>
            </div>
          </section>
        </div>
      )}

      {view === "facilities" && (
        <div className="space-y-5">
          <section className="rounded-4xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">Screen 7</div>
                <h2 className="mt-1 text-2xl text-slate-900">CRUD địa điểm tập thể dục</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Thêm, sửa, xóa địa điểm trong DB. Màn này dùng dữ liệu thật từ bảng locations.
                </p>
              </div>
              <button onClick={() => { resetForm(); setView("facility-add"); }} className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white">
                <Plus className="mr-2 inline h-4 w-4" />
                Thêm địa điểm
              </button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.7rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Danh sách và quản lý địa điểm</div>
                <div className="mt-4 text-sm text-slate-600">Chọn một địa điểm để chỉnh sửa, hoặc bấm "Thêm địa điểm" để mở tab tạo mới.</div>
              </div>
              <div className="space-y-3">
                {loadingLocations ? (
                  <div className="rounded-[1.7rem] bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200">Đang tải địa điểm...</div>
                ) : locationsError ? (
                  <div className="rounded-[1.7rem] bg-rose-50 p-5 text-sm text-rose-700 ring-1 ring-rose-200">{locationsError}</div>
                ) : locations.length ? (
                  locations.map((location) => (
                    <article key={location.id} className="rounded-[1.7rem] bg-white p-4 ring-1 ring-slate-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-slate-500">{location.location_type}</div>
                          <div className="mt-1 text-lg text-slate-900">{location.name}</div>
                          <div className="mt-2 text-sm text-slate-600">{location.address ?? "Chưa có địa chỉ"}</div>
                          <div className="mt-2 text-xs text-slate-500">
                            {location.city ?? "-"} · {location.district ?? "-"}
                          </div>
                        </div>
                        <MapPin className="h-5 w-5 shrink-0 text-emerald-600" />
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button onClick={() => startEdit(location)} className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
                          <Edit3 className="mr-2 inline h-4 w-4" />
                          Sửa
                        </button>
                        <button onClick={() => void handleDelete(location.id)} className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
                          <Trash2 className="mr-2 inline h-4 w-4" />
                          Xóa
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[1.7rem] bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200">
                    Chưa có địa điểm nào trong DB.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {view === "facility-add" && (
        <div className="space-y-5">
          <section className="rounded-4xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">Thêm / Chỉnh sửa địa điểm</div>
                <h2 className="mt-1 text-2xl text-slate-900">Nhập thông tin địa điểm</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Sử dụng form này để tạo mới hoặc chỉnh sửa một địa điểm trong cơ sở dữ liệu.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { resetForm(); setView("facilities"); }} className="rounded-[1.25rem] bg-white px-4 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
                  Hủy
                </button>
                <button onClick={() => { resetForm(); setView("facilities"); }} className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200">Quay lại</button>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.7rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  {editingLocationId ? "Chỉnh sửa địa điểm" : "Tạo địa điểm mới"}
                </div>
                <div className="mt-4 grid gap-3">
                  <Field label="Tên địa điểm" value={formState.name} onChange={(value) => setFormState((current) => ({ ...current, name: value }))} />
                  <Field label="Loại địa điểm" value={formState.locationType} onChange={(value) => setFormState((current) => ({ ...current, locationType: value }))} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Thành phố" value={formState.city} onChange={(value) => setFormState((current) => ({ ...current, city: value }))} />
                    <Field label="Khu / quận" value={formState.district} onChange={(value) => setFormState((current) => ({ ...current, district: value }))} />
                  </div>
                  <Field label="Địa chỉ" value={formState.address} onChange={(value) => setFormState((current) => ({ ...current, address: value }))} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Lat" value={formState.lat} onChange={(value) => setFormState((current) => ({ ...current, lat: value }))} />
                    <Field label="Lng" value={formState.lng} onChange={(value) => setFormState((current) => ({ ...current, lng: value }))} />
                  </div>
                </div>

                {formError && <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{formError}</div>}
                {actionMessage && <div className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">{actionMessage}</div>}

                <div className="mt-4 flex gap-3">
                  <button onClick={() => void submitLocation()} disabled={savingLocation} className="flex-1 rounded-[1.2rem] bg-emerald-600 px-4 py-3 text-sm text-white disabled:opacity-60">
                    {savingLocation ? "Đang lưu..." : editingLocationId ? "Cập nhật" : "Tạo mới"}
                  </button>
                  <button onClick={() => { resetForm(); setView("facilities"); }} className="flex-1 rounded-[1.2rem] bg-white px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
                    Hủy
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {loadingLocations ? (
                  <div className="rounded-[1.7rem] bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200">Đang tải địa điểm...</div>
                ) : locationsError ? (
                  <div className="rounded-[1.7rem] bg-rose-50 p-5 text-sm text-rose-700 ring-1 ring-rose-200">{locationsError}</div>
                ) : locations.length ? (
                  locations.map((location) => (
                    <article key={location.id} className="rounded-[1.7rem] bg-white p-4 ring-1 ring-slate-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-slate-500">{location.location_type}</div>
                          <div className="mt-1 text-lg text-slate-900">{location.name}</div>
                          <div className="mt-2 text-sm text-slate-600">{location.address ?? "Chưa có địa chỉ"}</div>
                          <div className="mt-2 text-xs text-slate-500">
                            {location.city ?? "-"} · {location.district ?? "-"}
                          </div>
                        </div>
                        <MapPin className="h-5 w-5 shrink-0 text-emerald-600" />
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button onClick={() => startEdit(location)} className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
                          <Edit3 className="mr-2 inline h-4 w-4" />
                          Sửa
                        </button>
                        <button onClick={() => void handleDelete(location.id)} className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
                          <Trash2 className="mr-2 inline h-4 w-4" />
                          Xóa
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[1.7rem] bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200">Chưa có địa điểm nào trong DB.</div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {view === "moderation" && (
        <div className="space-y-5">
          <section className="rounded-4xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="mt-1 text-2xl text-slate-900">不適切なコメント管理</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Kiểm tra các bình luận vi phạm
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Bộ lọc theo cơ sở</h4>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Chọn cơ sở có bình luận bị blocklist để lọc nhanh.</p>
                </div>
              </div>
              <div className="relative mt-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setModerationLocationMenuOpen((current) => !current)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left text-sm text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="block text-xs uppercase tracking-[0.16em] text-slate-500">Cơ sở</span>
                    <span className="mt-1 block truncate font-medium text-slate-900">{moderationLocationLabel}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${moderationLocationMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {moderationLocationMenuOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-72 overflow-auto rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200">
                    {moderationLocations.map((location) => {
                      const active = moderationLocation === location.id;

                      return (
                        <button
                          key={location.id}
                          type="button"
                          onClick={() => {
                            setModerationLocation(location.id);
                            setModerationLocationMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                            active ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate">{location.label}</span>
                          {active && <span className="ml-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">Đang chọn</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showAllModerationComments}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setShowAllModerationComments(checked);
                      if (checked) {
                        setShowUnprocessed(true);
                        setShowDeleted(true);
                      } else {
                        setShowUnprocessed(true);
                        setShowDeleted(false);
                      }
                    }}
                    className="accent-emerald-600"
                  />
                  Tất cả bình luận
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showUnprocessed}
                    disabled={showAllModerationComments}
                    onChange={(event) => {
                      setShowUnprocessed(event.target.checked);
                      setShowAllModerationComments(event.target.checked && showDeleted);
                    }}
                    className="accent-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  Chưa xử lý
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showDeleted}
                    disabled={showAllModerationComments}
                    onChange={(event) => {
                      setShowDeleted(event.target.checked);
                      setShowAllModerationComments(showUnprocessed && event.target.checked);
                    }}
                    className="accent-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  Đã xóa
                </label>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {moderationItems.length ? (
                moderationItems.map((item) => {
                  const status = moderationStatusById[item.id] ?? item.status;

                  return (
                    <article key={item.id} className="overflow-hidden rounded-[1.2rem] bg-white shadow-sm ring-1 ring-slate-200">
                      <img
                        src={getModerationLocationImage(item.locationId)}
                        alt={item.locationName}
                        className="h-36 w-full object-cover"
                      />

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-1 items-start gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                              {getModerationAvatarLabel(item)}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.author}</div>
                              <div className="mt-1 text-base font-semibold text-slate-900">{item.locationName}</div>
                            </div>
                          </div>

                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status === "unprocessed" ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                            {status === "unprocessed" ? `Vi phạm ${item.violationCount} lần` : "Đã xóa"}
                          </span>
                        </div>

                        <p className="mt-3 rounded-[0.9rem] border-l-4 border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
                          {item.content}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">{moderationLocationLabels[item.locationId] ?? item.locationId}</span>
                          <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">{item.timestamp}</span>
                        </div>

                        <div className="mt-4 flex gap-3">
                          <button onClick={() => setCommentStatus(item.id, "deleted")} className="flex-1 rounded-[0.9rem] bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-rose-600/10">
                            Xóa
                          </button>
                          <button onClick={() => setCommentStatus(item.id, "unprocessed")} className="flex-1 rounded-[0.9rem] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                            Khôi phục
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-[1.2rem] bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200">
                  Không có bình luận nào khớp bộ lọc.
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {view === "admin-profile" && (
        <div className="mx-auto max-w-4xl space-y-5">
          <section className="rounded-4xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">Screen 14</div>
                <h2 className="mt-1 text-2xl text-slate-900">Hồ sơ quản trị viên</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200">smhn</span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-[1.8rem] bg-linear-to-br from-slate-900 to-slate-700 p-6 text-white">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/20">
                  <Building2 className="h-7 w-7" />
                </div>
                <div className="mt-4 text-2xl">{userName}</div>
                <div className="mt-1 text-sm text-white/70">Quản trị viên hệ thống</div>
                <div className="mt-6 rounded-2xl bg-white/12 p-4 text-sm ring-1 ring-white/15">
                  Tài khoản đăng nhập: <strong>admin</strong>
                  <br />
                  Mã bảo mật: <strong>smhn</strong>
                </div>
              </div>

              <div className="rounded-[1.8rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Tên hiển thị" value={userName} readOnly />
                  <Field label="Vai trò" value="admin" readOnly />
                  <Field label="Username" value="admin" readOnly />
                  <Field label="Security code" value="smhn" readOnly />
                </div>
                <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
                  Tab này dùng để mô phỏng màn hồ sơ quản trị như mẫu 14: chỉ hiển thị thông tin xác thực, quyền truy cập và trạng thái admin.
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </Shell>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</span>
      {onChange && !readOnly ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-2xl bg-white px-4 py-3 text-slate-900 ring-1 ring-slate-200 outline-none"
        />
      ) : (
        <div className="rounded-2xl bg-white px-4 py-3 text-slate-900 ring-1 ring-slate-200">
          {value || "-"}
        </div>
      )}
    </label>
  );
}
