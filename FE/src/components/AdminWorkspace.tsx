import { useEffect, useMemo, useState } from "react";
import { Building2, Edit3, MapPin, Plus, Trash2 } from "lucide-react";
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

const emptyForm: LocationFormState = {
  name: "",
  locationType: "indoor_place",
  city: "",
  district: "",
  address: "",
  lat: "",
  lng: "",
};

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

          <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-4xl bg-white p-5 ring-1 ring-slate-200">
              <div className="flex items-center gap-2 text-slate-900">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg">Lối tắt</h3>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button onClick={() => setView("facilities")} className="rounded-[1.25rem] bg-emerald-600 px-4 py-3 text-sm text-white">
                  Mở CRUD địa điểm
                </button>
                <button onClick={() => setView("admin-profile")} className="rounded-[1.25rem] bg-slate-100 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
                  Xem profile admin
                </button>
              </div>
            </div>

            <div className="rounded-4xl bg-slate-900 p-5 text-white">
              <div className="text-sm text-white/70">Trạng thái đồng bộ</div>
              <div className="mt-2 text-2xl">{loadingLocations ? "Đang tải..." : "Sẵn sàng"}</div>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Danh sách địa điểm đang được lấy từ backend, sau đó dùng để thêm, sửa và xóa trong tab location.
              </p>
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
