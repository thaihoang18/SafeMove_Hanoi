import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Search,
  Shuffle,
  Volume2,
} from "lucide-react";
import { planRoutes, searchPlaces } from "@/lib/api";
import { RouteMapCanvas } from "@/components/RouteMapCanvas";
import type {
  PlaceSuggestion,
  PlannedRoutesResponse,
  RouteOption,
  RouteRecommendation,
} from "@/lib/types";

type LocationItem = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string | null;
  city?: string | null;
  district: string | null;
};

type Props = {
  locations: LocationItem[];
  maxRatio: number;
  setMaxRatio: (value: number) => void;
  onSubmit: (payload: {
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
  routeHistory: Array<Record<string, unknown>>;
  loading: boolean;
};

type Stage = "search" | "choose" | "directions";

type DecoratedRoute = RouteRecommendation & {
  color: string;
  badgeClass: string;
  panelClass: string;
};

export function RoutePlannerView({
  locations,
  maxRatio,
  setMaxRatio,
  onSubmit,
  routeHistory,
  loading,
}: Props) {
  const [stage, setStage] = useState<Stage>("search");
  const [originInput, setOriginInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [originSelected, setOriginSelected] = useState<PlaceSuggestion | null>(null);
  const [destinationSelected, setDestinationSelected] = useState<PlaceSuggestion | null>(null);
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [activeField, setActiveField] = useState<"origin" | "destination" | null>(null);
  const [searchingRoutes, setSearchingRoutes] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [planResult, setPlanResult] = useState<PlannedRoutesResponse | null>(null);
  const [selectedKind, setSelectedKind] = useState<RouteRecommendation["kind"]>("green");

  const decoratedRoutes = useMemo(() => decorateRoutes(planResult), [planResult]);
  const visibleRoutes = useMemo(
    () => decoratedRoutes.filter((item) => item.kind === "green" || item.kind === "shortest"),
    [decoratedRoutes],
  );
  const selectedRoute = useMemo(
    () => visibleRoutes.find((item) => item.kind === selectedKind) ?? visibleRoutes[0] ?? null,
    [visibleRoutes, selectedKind],
  );

  useEffect(() => {
    const query = originInput.trim();
    if (query.length < 2 || originSelected?.label === originInput) {
      setOriginSuggestions(searchLocalPlaces(query, locations));
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await searchPlaces(query, 6);
        setOriginSuggestions(mergeSuggestions(searchLocalPlaces(query, locations), data.places));
      } catch {
        setOriginSuggestions(searchLocalPlaces(query, locations));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locations, originInput, originSelected?.label]);

  useEffect(() => {
    const query = destinationInput.trim();
    if (query.length < 2 || destinationSelected?.label === destinationInput) {
      setDestinationSuggestions(searchLocalPlaces(query, locations));
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await searchPlaces(query, 6);
        setDestinationSuggestions(mergeSuggestions(searchLocalPlaces(query, locations), data.places));
      } catch {
        setDestinationSuggestions(searchLocalPlaces(query, locations));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [destinationInput, destinationSelected?.label, locations]);

  async function resolveSelection(
    selected: PlaceSuggestion | null,
    input: string,
    fieldLabel: string,
  ) {
    if (selected) {
      return selected;
    }

    const query = input.trim();
    if (!query) {
      throw new Error(`${fieldLabel} không được để trống.`);
    }

    const localMatch = searchLocalPlaces(query, locations, 1)[0];
    if (localMatch) {
      return localMatch;
    }

    const searchResult = await searchPlaces(query, 1);
    const first = searchResult.places[0];
    if (!first) {
      throw new Error(`Không tìm thấy địa điểm phù hợp cho ${fieldLabel}.`);
    }

    return first;
  }

  async function useCurrentLocationAsOrigin() {
    if (!navigator.geolocation) {
      setSearchError("Trình duyệt không hỗ trợ GPS.");
      return;
    }

    setSearchError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60_000,
        });
      });

      const place: PlaceSuggestion = {
        id: `gps-${Date.now()}`,
        label: `Vị trí hiện tại (${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)})`,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        source: "local",
      };

      setOriginSelected(place);
      setOriginInput(place.label);
      setOriginSuggestions([]);
    } catch {
      setSearchError("Không thể lấy vị trí hiện tại. Hãy kiểm tra quyền Location.");
    }
  }

  async function submitSearch() {
    if (searchingRoutes || loading) {
      return;
    }

    setSearchingRoutes(true);
    setSearchError(null);

    try {
      const origin = await resolveSelection(originSelected, originInput, "điểm đi");
      const destination = await resolveSelection(destinationSelected, destinationInput, "điểm đến");

      setOriginSelected(origin);
      setDestinationSelected(destination);
      setOriginInput(origin.label);
      setDestinationInput(destination.label);

      const result = await planRoutes({
        origin: {
          label: origin.label,
          lat: origin.lat,
          lng: origin.lng,
        },
        destination: {
          label: destination.label,
          lat: destination.lat,
          lng: destination.lng,
        },
        maxRatio,
      });

      setPlanResult(result);
      setSelectedKind("green");
      setStage("choose");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tạo lộ trình.";
      setSearchError(message);
      setPlanResult(null);
    } finally {
      setSearchingRoutes(false);
    }
  }

  async function startDirections(kind: RouteRecommendation["kind"]) {
    if (!planResult || loading) {
      return;
    }

    setSelectedKind(kind);
    const routesToUse = visibleRoutes.length ? visibleRoutes : decoratedRoutes;
    const shortest =
      routesToUse.find((item) => item.kind === "shortest") ??
      routesToUse[0];

    const options: RouteOption[] = routesToUse.map((item) => ({
      routeName: item.title,
      distanceM: item.route.distanceM,
      durationS: item.route.durationS,
      avgAqi: item.route.avgAqi,
      exposureScore: item.route.exposureScore,
      exposure: item.route.exposure,
      isRecommended: item.kind === "green",
      isWithinRatio: item.route.isWithinRatio,
      aqiSavingPercent:
        shortest.route.avgAqi > 0
          ? Number((((shortest.route.avgAqi - item.route.avgAqi) / shortest.route.avgAqi) * 100).toFixed(1))
          : null,
      polyline: item.route.polyline,
    }));

    await onSubmit({
      originLabel: planResult.origin.label,
      originLat: planResult.origin.lat,
      originLng: planResult.origin.lng,
      destinationLabel: planResult.destination.label,
      destinationLat: planResult.destination.lat,
      destinationLng: planResult.destination.lng,
      maxRatio: planResult.maxRatio,
      shortestDistanceM: shortest.route.distanceM,
      shortestDurationS: shortest.route.durationS,
      options,
    });

    setActiveField(null);
    setStage("directions");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      <div className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl text-slate-900">Lộ trình xanh</h2>
          </div>
          <div className="inline-flex w-full rounded-full bg-slate-100 p-1 ring-1 ring-slate-200 shadow-sm sm:w-auto">
            <button
              onClick={() => setStage("search")}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs transition sm:flex-none ${
                stage === "search"
                  ? "bg-linear-to-r from-emerald-600 to-lime-500 text-white"
                  : "text-slate-600"
              }`}
            >
              1. Tìm lộ trình
            </button>
            <button
              onClick={() => planResult && setStage("choose")}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs transition sm:flex-none ${
                stage === "choose"
                  ? "bg-linear-to-r from-emerald-600 to-lime-500 text-white"
                  : "text-slate-600"
              } ${!planResult ? "opacity-40" : ""}`}
              disabled={!planResult}
            >
              2. Chọn tuyến
            </button>
            <button
              onClick={() => planResult && setStage("directions")}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs transition sm:flex-none ${
                stage === "directions"
                  ? "bg-linear-to-r from-emerald-600 to-lime-500 text-white"
                  : "text-slate-600"
              } ${!planResult ? "opacity-40" : ""}`}
              disabled={!planResult}
            >
              3. Chỉ đường
            </button>
          </div>
        </div>
      </div>

      {stage === "search" ? (
        <div className="space-y-3">
          <section className="mx-auto max-w-2xl space-y-3">
            <div className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-600 to-lime-500 text-white">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base text-slate-900">Tìm tuyến đường</h3>
                  <div className="text-xs leading-5 text-slate-500">Nhập điểm đi và điểm đến để hệ thống tính lộ trình an toàn hơn.</div>
                </div>
              </div>

              <div className="space-y-3 rounded-[1.25rem] bg-slate-50/80 p-3 ring-1 ring-slate-200">
                <LocationInput
                  label="Điểm đi"
                  placeholder="Ví dụ: 12 Tràng Thi, Hoàn Kiếm, Hà Nội"
                  value={originInput}
                  onChange={(value) => {
                    setOriginInput(value);
                    setOriginSelected(null);
                  }}
                  onFocus={() => setActiveField("origin")}
                  onBlur={() => setTimeout(() => setActiveField((current) => (current === "origin" ? null : current)), 120)}
                  suggestions={originSuggestions}
                  showSuggestions={activeField === "origin"}
                  onSelect={(place) => {
                    setOriginSelected(place);
                    setOriginInput(place.label);
                    setOriginSuggestions([]);
                    setActiveField(null);
                  }}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={useCurrentLocationAsOrigin}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] text-slate-600 ring-1 ring-slate-200"
                  >
                    <LocateFixed className="h-3.5 w-3.5" />
                    Dùng GPS
                  </button>
                  <button
                    onClick={() => {
                      const nextOrigin = destinationInput;
                      const nextOriginSelected = destinationSelected;
                      setDestinationInput(originInput);
                      setDestinationSelected(originSelected);
                      setOriginInput(nextOrigin);
                      setOriginSelected(nextOriginSelected);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] text-slate-600 ring-1 ring-slate-200"
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    Đảo chiều
                  </button>
                </div>

                <LocationInput
                  label="Điểm đến"
                  placeholder="Ví dụ: 32 Võ Chí Công, Tây Hồ, Hà Nội"
                  value={destinationInput}
                  onChange={(value) => {
                    setDestinationInput(value);
                    setDestinationSelected(null);
                  }}
                  onFocus={() => setActiveField("destination")}
                  onBlur={() => setTimeout(() => setActiveField((current) => (current === "destination" ? null : current)), 120)}
                  suggestions={destinationSuggestions}
                  showSuggestions={activeField === "destination"}
                  onSelect={(place) => {
                    setDestinationSelected(place);
                    setDestinationInput(place.label);
                    setDestinationSuggestions([]);
                    setActiveField(null);
                  }}
                />
              </div>

              <div className="mt-4 rounded-[1.2rem] bg-emerald-50 p-3 ring-1 ring-emerald-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">Max route ratio</span>
                  <span className="text-emerald-700">x {maxRatio.toFixed(1)}</span>
                </div>
                <input
                  className="mt-3 w-full accent-emerald-600"
                  type="range"
                  min={1}
                  max={2}
                  step={0.1}
                  value={maxRatio}
                  onChange={(event) => setMaxRatio(Number(event.target.value))}
                />
                <div className="mt-2 text-[11px] leading-5 text-slate-500">
                  Lộ trình xanh phải {"<="} {Math.round((maxRatio - 1) * 100)}% so với tuyến ngắn nhất.
                </div>
              </div>

              <div className="mt-3 rounded-[1.2rem] bg-[#f3f8f3] px-3 py-2.5 text-[11px] leading-5 text-slate-600 ring-1 ring-emerald-100">
                Hãy nhập chi tiết như Google Maps: <strong>số nhà, tên đường, phường/xã, quận/huyện</strong>.
              </div>

              <button
                onClick={submitSearch}
                disabled={searchingRoutes || loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-linear-to-r from-emerald-600 to-lime-500 py-3 text-sm text-white shadow-lg shadow-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {searchingRoutes ? "Đang phân tích tuyến..." : "Tìm lộ trình"}
                <ArrowRight className="h-4 w-4" />
              </button>

              {searchError ? (
                <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                  {searchError}
                </div>
              ) : null}
              <div className="mt-4 rounded-[1.2rem] bg-[#f6fbf6] p-3 ring-1 ring-emerald-100">
                <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">Bước tiếp theo</div>
                <div className="mt-1 text-xs leading-5 text-slate-600">
                  Sau khi tìm xong, bạn sẽ chọn giữa <strong>lộ trình xanh</strong> và <strong>lộ trình ngắn nhất</strong> ở tab kế tiếp.
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : stage === "choose" ? (
        <div className="space-y-3">
          <section className="space-y-3">
            <div className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Route className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base text-slate-900">Chọn tuyến đường</h3>
                </div>
                <div className="text-[11px] text-slate-500">Chọn 1 trong 2 tuyến để bắt đầu chỉ đường</div>
              </div>

              <div className="mb-3 overflow-hidden rounded-[1.4rem] bg-[#eef4ea] ring-1 ring-slate-200">
                <RouteMapCanvas
                  planResult={planResult}
                  routes={visibleRoutes}
                  selectedKind={selectedKind}
                  heightClassName="h-[220px] sm:h-[260px]"
                />
              </div>

              {planResult ? (
                <div className="space-y-2.5">
                  {visibleRoutes.map((recommendation) => (
                    <div
                      key={recommendation.kind}
                      className={`rounded-[1.3rem] p-3 ring-1 ${recommendation.panelClass}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-sm text-slate-900">{recommendation.title}</div>
                          <div className="mt-1 text-xs leading-5 text-slate-500">{recommendation.reason}</div>
                        </div>
                        <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] ${recommendation.badgeClass}`}>
                          {recommendation.kind === "green" ? "AQI thấp nhất" : "Ngắn nhất"}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <RouteMetric label="Quãng đường" value={`${(recommendation.route.distanceM / 1000).toFixed(1)} km`} />
                        <RouteMetric label="Thời gian" value={formatDuration(recommendation.route.durationS)} />
                        <RouteMetric label="AQI ước tính" value={String(recommendation.route.avgAqi)} />
                        <RouteMetric label="Nguồn AQI" value={recommendation.route.aqiSource} />
                      </div>
                      <button
                        onClick={() => startDirections(recommendation.kind)}
                        disabled={loading}
                        className="mt-3 w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-700 ring-1 ring-slate-200 disabled:opacity-60"
                      >
                        Chọn tuyến này
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 ring-1 ring-slate-200">
                  Chưa có dữ liệu lộ trình để lựa chọn.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <DirectionsPanel
          planResult={planResult}
          decoratedRoutes={decoratedRoutes}
          selectedKind={selectedKind}
          setSelectedKind={setSelectedKind}
          onBack={() => setStage("search")}
        />
      )}
    </div>
  );
}

function LocationInput({
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  suggestions,
  showSuggestions,
  onSelect,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  suggestions: PlaceSuggestion[];
  showSuggestions: boolean;
  onSelect: (place: PlaceSuggestion) => void;
  placeholder: string;
}) {
  return (
    <div className="mt-2">
      <label className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-slate-500">{label}</label>
      <div className="rounded-[1.1rem] bg-slate-50 px-3 py-3 ring-1 ring-slate-200">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>
      {showSuggestions && suggestions.length ? (
        <div className="mt-2 max-h-44 overflow-auto rounded-[1rem] bg-white p-1 ring-1 ring-slate-200 shadow-sm">
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left hover:bg-slate-50"
            >
              <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
              <div className="min-w-0">
                <div className="truncate text-xs text-slate-700">{item.label}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {item.source === "local" ? "SafeMove HaNoi location" : "Map search"}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DirectionsPanel({
  planResult,
  decoratedRoutes,
  selectedKind,
  setSelectedKind,
  onBack,
}: {
  planResult: PlannedRoutesResponse | null;
  decoratedRoutes: DecoratedRoute[];
  selectedKind: RouteRecommendation["kind"];
  setSelectedKind: (value: RouteRecommendation["kind"]) => void;
  onBack: () => void;
}) {
  if (!planResult) {
    return (
      <div className="rounded-3xl bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200">
        Chưa có dữ liệu chỉ đường.
      </div>
    );
  }

  const routeChoices = decoratedRoutes.filter((item) => item.kind === "green" || item.kind === "shortest");
  const selected = routeChoices.find((item) => item.kind === selectedKind) ?? routeChoices[0] ?? decoratedRoutes[0] ?? null;
  if (!selected) {
    return (
      <div className="rounded-3xl bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200">
        Chưa có dữ liệu tuyến đường khả dụng.
      </div>
    );
  }
  const currentStep = selected.route.steps[0] ?? null;

  const googleMapsLink =
    `https://www.google.com/maps/dir/?api=1&origin=${planResult.origin.lat},${planResult.origin.lng}` +
    `&destination=${planResult.destination.lat},${planResult.destination.lng}&travelmode=driving`;

  return (
    <div className="space-y-3">
      <section className="space-y-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs text-slate-600 ring-1 ring-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại tìm lộ trình
        </button>

        <a
          href={googleMapsLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] text-slate-600 ring-1 ring-slate-200"
        >
          <Navigation className="h-3.5 w-3.5" />
          Mở trên Google Maps
        </a>
      </section>

      <section className="space-y-3">
        <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="bg-linear-to-r from-blue-700 to-blue-600 p-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  {iconForInstruction(currentStep?.instruction)}
                </div>
                <div>
                  <div className="text-xs text-white/70">
                    {currentStep ? `Sau ${Math.round(currentStep.distanceM)} m` : "Bắt đầu điều hướng"}
                  </div>
                  <div className="text-lg">{currentStep?.instruction ?? selected.title}</div>
                </div>
              </div>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-[#eef4ea]">
            <RouteMapCanvas
              planResult={planResult}
              routes={routeChoices}
              selectedKind={selected.kind}
              heightClassName="h-[360px] sm:h-[460px]"
            />
          </div>

          <div className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-base text-slate-900">{selected.title}</div>
                <div className="text-xs leading-5 text-slate-500">{selected.reason}</div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <div>{(selected.route.distanceM / 1000).toFixed(1)} km</div>
                <div>{formatDuration(selected.route.durationS)}</div>
                <div>AQI {selected.route.avgAqi}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-700">Chỉ đường từng bước</div>
          <div className="space-y-2">
            {selected.route.steps.length ? (
              selected.route.steps.map((step) => (
                <div key={step.stepIndex} className="rounded-[1rem] bg-slate-50 p-3 ring-1 ring-slate-200">
                  <div className="text-sm text-slate-900">
                    {step.stepIndex}. {step.instruction}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {Math.round(step.distanceM)} m · {formatDuration(step.durationS)}
                    {step.roadName ? ` · ${step.roadName}` : ""}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1rem] bg-slate-50 p-3 text-sm text-slate-500 ring-1 ring-slate-200">
                Không có chi tiết bước đi cho tuyến này.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function RouteMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] bg-white/75 px-3 py-2.5 ring-1 ring-white/80">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 text-xs text-slate-700">{value}</div>
    </div>
  );
}

function decorateRoutes(planResult: PlannedRoutesResponse | null): DecoratedRoute[] {
  if (!planResult) {
    return [];
  }

  return planResult.recommendations.map((item) => ({
    ...item,
    color:
      item.kind === "green" ? "#10b981" : item.kind === "shortest" ? "#2563eb" : "#f59e0b",
    badgeClass:
      item.kind === "green"
        ? "bg-emerald-100 text-emerald-700"
        : item.kind === "shortest"
          ? "bg-blue-100 text-blue-700"
          : "bg-amber-100 text-amber-700",
    panelClass:
      item.kind === "green"
        ? "bg-emerald-50 ring-emerald-200"
        : item.kind === "shortest"
          ? "bg-blue-50 ring-blue-200"
          : "bg-amber-50 ring-amber-200",
  }));
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchLocalPlaces(query: string, locations: LocationItem[], limit = 6): PlaceSuggestion[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return locations.slice(0, limit).map((item) => ({
      id: `local-${item.id}`,
      label: formatLocationLabel(item),
      lat: item.lat,
      lng: item.lng,
      source: "local",
    }));
  }

  return locations
    .map((item) => {
      const label = formatLocationLabel(item);
      const haystack = normalizeText(
        `${item.name} ${item.address ?? ""} ${item.district ?? ""} ${item.city ?? ""}`,
      );
      let score = 0;

      if (haystack.startsWith(normalizedQuery)) score += 4;
      if (haystack.includes(normalizedQuery)) score += 2;
      for (const token of normalizedQuery.split(" ")) {
        if (token && haystack.includes(token)) score += 1;
      }

      return {
        id: `local-${item.id}`,
        label,
        lat: item.lat,
        lng: item.lng,
        source: "local" as const,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _score, ...item }) => item);
}

function formatLocationLabel(item: LocationItem) {
  const parts = [item.name, item.address, item.district, item.city].filter(Boolean);
  return parts.join(", ");
}

function mergeSuggestions(localSuggestions: PlaceSuggestion[], remoteSuggestions: PlaceSuggestion[]) {
  const merged = [...localSuggestions];
  const seen = new Set(localSuggestions.map((item) => normalizeText(item.label)));

  for (const item of remoteSuggestions) {
    const key = normalizeText(item.label);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged.slice(0, 8);
}

function iconForInstruction(instruction?: string) {
  const normalized = normalizeText(instruction ?? "");
  if (normalized.includes("re trai") || normalized.includes("trai")) {
    return <CornerUpLeft className="h-5 w-5" />;
  }
  if (normalized.includes("re phai") || normalized.includes("phai")) {
    return <CornerUpRight className="h-5 w-5" />;
  }
  if (normalized.includes("den noi")) {
    return <MapPin className="h-5 w-5" />;
  }
  return <ArrowUp className="h-5 w-5" />;
}

function formatDuration(durationS: number) {
  const totalMinutes = Math.max(1, Math.round(durationS / 60));
  if (totalMinutes < 60) {
    return `${totalMinutes} phút`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}
