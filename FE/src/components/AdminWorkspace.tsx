import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, CircleAlert, Edit3, MapPin, Plus, Trash2, Users } from "lucide-react";
import { fetchAdminHiddenReviews, updateReview } from "@/lib/api";
import { Shell, type View } from "./Shell";
import { createLocation, deleteLocation, fetchLocations, updateLocation } from "@/lib/api";
import type { LocationRecord } from "@/lib/types";

type Props = {
  userName: string;
  onLogout: () => void;
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

export function AdminWorkspace({ userName, onLogout }: Props) {
  const [view, setView] = useState<View>("dashboard");
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [formState, setFormState] = useState<LocationFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [moderationLocation, setModerationLocation] = useState("all");
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
  }, []);

  const dashboardStats = useMemo(() => {
    const indoorPlaces = locations.filter((location) => location.location_type === "indoor_place").length;
    const uniqueCities = new Set(locations.map((location) => location.city).filter(Boolean));
    const uniqueDistricts = new Set(locations.map((location) => location.district).filter(Boolean));

    return [
      { label: "Tổng địa điểm", value: String(locations.length), detail: "Đang quản lý" },
      { label: "Indoor places", value: String(indoorPlaces), detail: "Phù hợp tập luyện" },
      { label: "Thành phố", value: String(uniqueCities.size), detail: "Có dữ liệu" },
      { label: "Quận / khu", value: String(uniqueDistricts.size), detail: "Đã nhập" },
    ];
  }, [locations]);

  const moderationLocations = useMemo(() => ["all", ...new Set(moderationItemsList.map((item) => item.locationId))], [moderationItemsList]);

  const moderationItems = useMemo(() => {
    return moderationItemsList.filter((item) => {
      const status = moderationStatusById[item.id] ?? item.status;
      const locationMatch = moderationLocation === "all" ? true : item.locationId === moderationLocation;
      const statusMatch = (status === "unprocessed" && showUnprocessed) || (status === "deleted" && showDeleted);

      return locationMatch && statusMatch;
    });
  }, [moderationLocation, moderationStatusById, showDeleted, showUnprocessed, moderationItemsList]);

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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">Screen 9</div>
                <h2 className="mt-1 text-2xl text-slate-900">Bảng điều khiển quản trị hệ thống</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Home page của admin hiển thị tổng quan dữ liệu địa điểm và các hành động nhanh để vào CRUD location.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200">Admin</span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {dashboardStats.map((item) => (
                <div key={item.label} className="rounded-[1.4rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
                  <div className="mt-2 text-3xl text-slate-900">{item.value}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-4xl bg-white p-5 ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">Kiểm duyệt nội dung vi phạm</div>
                <h3 className="text-lg text-slate-900">Mở màn kiểm duyệt giống screen 10</h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  Chuyển sang màn riêng để lọc, xem và xử lý các bình luận vi phạm thay cho khối lối tắt / trạng thái đồng bộ.
                </p>
              </div>
              <button onClick={() => setView("moderation")} className="rounded-[1.25rem] bg-rose-600 px-4 py-3 text-sm text-white shadow-sm shadow-rose-600/15">
                <CircleAlert className="mr-2 inline h-4 w-4" />
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
                <div className="text-sm text-slate-500">Screen 10</div>
                <h2 className="mt-1 text-2xl text-slate-900">不適切なコメント管理</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Kiểm tra các bình luận vi phạm, lọc theo địa điểm và xử lý trạng thái ngay trong màn quản trị.
                </p>
              </div>
              <button onClick={() => setView("dashboard")} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
                <ArrowLeft className="mr-2 inline h-4 w-4" />
                Dashboard
              </button>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <h4 className="text-sm font-medium text-slate-900">Bộ lọc</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {moderationLocations.map((locationId) => (
                  <button
                    key={locationId}
                    onClick={() => setModerationLocation(locationId)}
                    className={`rounded-full px-3 py-1.5 text-xs ring-1 ${
                      moderationLocation === locationId ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-slate-600 ring-slate-200"
                    }`}
                  >
                    {locationId === "all" ? "Tất cả" : locationId}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={showUnprocessed} onChange={(event) => setShowUnprocessed(event.target.checked)} className="accent-emerald-600" />
                  Chưa xử lý
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} className="accent-emerald-600" />
                  Đã xóa
                </label>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {moderationItems.length ? (
                moderationItems.map((item) => {
                  const status = moderationStatusById[item.id] ?? item.status;

                  return (
                    <article key={item.id} className="rounded-[1.7rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm text-slate-500">User ID: {item.userId}</div>
                          <div className="mt-1 text-lg text-slate-900">{item.locationName}</div>
                          <div className="mt-2 text-sm text-slate-600">{item.content}</div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs ring-1 ${status === "unprocessed" ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-sky-50 text-sky-700 ring-sky-200"}`}>
                          {status === "unprocessed" ? `Vi phạm ${item.violationCount} lần` : "Đã xóa"}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{item.locationId}</span>
                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{item.timestamp}</span>
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button onClick={() => setCommentStatus(item.id, "deleted")} className="rounded-2xl bg-rose-600 px-4 py-2 text-sm text-white">
                          Xóa
                        </button>
                        <button onClick={() => setCommentStatus(item.id, "unprocessed")} className="rounded-2xl bg-emerald-100 px-4 py-2 text-sm text-emerald-700">
                          Khôi phục
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-[1.7rem] bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200">
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
