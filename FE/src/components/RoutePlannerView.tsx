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

type Stage = "search" | "directions";

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
  const [searchingRoutes, setSearchingRoutes] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [planResult, setPlanResult] = useState<PlannedRoutesResponse | null>(null);
  const [selectedKind, setSelectedKind] = useState<RouteRecommendation["kind"]>("green");

  const decoratedRoutes = useMemo(() => decorateRoutes(planResult), [planResult]);
  const selectedRoute = useMemo(
    () => decoratedRoutes.find((item) => item.kind === selectedKind) ?? decoratedRoutes[0] ?? null,
    [decoratedRoutes, selectedKind],
  );

  const quickPlaces = useMemo(
    () =>
      locations.slice(0, 8).map((item) => ({
        id: `saved-${item.id}`,
        label: formatLocationLabel(item),
        lat: item.lat,
        lng: item.lng,
        source: "local" as const,
      })),
    [locations],
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
    const shortest =
      planResult.recommendations.find((item) => item.kind === "shortest") ??
      planResult.recommendations[0];

    const options: RouteOption[] = planResult.recommendations.map((item) => ({
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

    setStage("directions");
  }

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-slate-200 shadow-sm">
        <button
          onClick={() => setStage("search")}
          className={`rounded-full px-4 py-2 text-sm transition ${
            stage === "search"
              ? "bg-linear-to-r from-blue-600 to-emerald-500 text-white"
              : "text-slate-600"
          }`}
        >
          1. Tìm lộ trình
        </button>
        <button
          onClick={() => planResult && setStage("directions")}
          className={`rounded-full px-4 py-2 text-sm transition ${
            stage === "directions"
              ? "bg-linear-to-r from-blue-600 to-emerald-500 text-white"
              : "text-slate-600"
          } ${!planResult ? "opacity-40" : ""}`}
          disabled={!planResult}
        >
          2. Chỉ đường
        </button>
      </div>

      {stage === "search" ? (
        <div className="grid gap-5 lg:grid-cols-5">
          <section className="space-y-5 lg:col-span-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-emerald-500 text-white">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h3>Lộ trình kiểu Google Maps</h3>
                  <div className="text-sm text-slate-500">Nhập điểm đi/đến, hệ thống tự tìm đúng địa điểm.</div>
                </div>
              </div>

              <div className="space-y-3">
                <LocationInput
                  label="Điểm đi"
                  placeholder="Ví dụ: 12 Tràng Thi, Hoàn Kiếm, Hà Nội"
                  value={originInput}
                  onChange={(value) => {
                    setOriginInput(value);
                    setOriginSelected(null);
                  }}
                  suggestions={originSuggestions}
                  onSelect={(place) => {
                    setOriginSelected(place);
                    setOriginInput(place.label);
                    setOriginSuggestions([]);
                  }}
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={useCurrentLocationAsOrigin}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200"
                  >
                    <LocateFixed className="h-3.5 w-3.5" />
                    Dùng GPS hiện tại làm điểm đi
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200"
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
                  suggestions={destinationSuggestions}
                  onSelect={(place) => {
                    setDestinationSelected(place);
                    setDestinationInput(place.label);
                    setDestinationSuggestions([]);
                  }}
                />
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">Max route ratio</span>
                  <span className="text-blue-600">x {maxRatio.toFixed(1)}</span>
                </div>
                <input
                  className="mt-3 w-full accent-blue-600"
                  type="range"
                  min={1}
                  max={2}
                  step={0.1}
                  value={maxRatio}
                  onChange={(event) => setMaxRatio(Number(event.target.value))}
                />
                <div className="mt-2 text-xs text-slate-500">
                  Lộ trình xanh phải {"<="} {Math.round((maxRatio - 1) * 100)}% so với tuyến ngắn nhất.
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-800 ring-1 ring-sky-200">
                Hãy nhập chi tiết như Google Maps: <strong>số nhà, tên đường, phường/xã, quận/huyện</strong>.
              </div>

              <button
                onClick={submitSearch}
                disabled={searchingRoutes || loading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-emerald-500 py-3 text-white shadow-lg shadow-blue-600/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {searchingRoutes ? "Đang phân tích tuyến..." : "Tìm 3 lựa chọn lộ trình"}
                <ArrowRight className="h-4 w-4" />
              </button>

              {searchError ? (
                <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                  {searchError}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <div className="mb-3 text-sm text-slate-700">Địa điểm gợi ý nhanh</div>
              <div className="flex flex-wrap gap-2">
                {quickPlaces.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => {
                      setDestinationSelected(place);
                      setDestinationInput(place.label);
                    }}
                    className="rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200"
                  >
                    {place.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4 lg:col-span-3">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <div className="mb-4 flex items-center gap-2">
                <Route className="h-5 w-5 text-emerald-600" />
                <h3>3 lựa chọn đề xuất</h3>
              </div>

              <div className="mb-4 overflow-hidden rounded-3xl bg-[#eef4ea] ring-1 ring-slate-200">
                <RouteMapCanvas
                  planResult={planResult}
                  routes={decoratedRoutes}
                  selectedKind={selectedKind}
                  heightClassName="h-[360px]"
                />
              </div>

              {planResult ? (
                <div className="grid gap-3 xl:grid-cols-3">
                  {decoratedRoutes.map((recommendation) => (
                    <div
                      key={recommendation.kind}
                      className={`rounded-2xl p-4 ring-1 ${recommendation.panelClass}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm text-slate-900">{recommendation.title}</div>
                        <span className={`rounded-full px-2 py-1 text-[11px] ${recommendation.badgeClass}`}>
                          {recommendation.kind === "green"
                            ? "AQI thấp nhất"
                            : recommendation.kind === "shortest"
                              ? "Ngắn nhất"
                              : "Cân bằng"}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{recommendation.reason}</div>
                      <div className="mt-3 space-y-1.5 text-sm text-slate-700">
                        <div>Quãng đường: {(recommendation.route.distanceM / 1000).toFixed(1)} km</div>
                        <div>Thời gian: {formatDuration(recommendation.route.durationS)}</div>
                        <div>AQI ước tính: {recommendation.route.avgAqi}</div>
                        <div>Nguồn AQI: {recommendation.route.aqiSource}</div>
                      </div>
                      <button
                        onClick={() => startDirections(recommendation.kind)}
                        disabled={loading}
                        className="mt-4 w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 disabled:opacity-60"
                      >
                        Chỉ đường theo tuyến này
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 ring-1 ring-slate-200">
                  Nhập điểm đi/đến để nhận 3 lựa chọn: xanh, ngắn nhất, cân bằng.
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                <div className="text-sm text-slate-700">Lịch sử route request</div>
              </div>
              <div className="space-y-3">
                {routeHistory.length ? (
                  routeHistory.slice(0, 5).map((item, index) => (
                    <div key={String(item.id ?? index)} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="text-sm text-slate-900">
                        {String(item.origin_label ?? "")} {"->"} {String(item.destination_label ?? "")}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{String(item.status ?? "")}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
                    Chưa có dữ liệu route request.
                  </div>
                )}
              </div>
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
  suggestions,
  onSelect,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: PlaceSuggestion[];
  onSelect: (place: PlaceSuggestion) => void;
  placeholder: string;
}) {
  return (
    <div className="mt-3">
      <label className="mb-1.5 block text-sm text-slate-600">{label}</label>
      <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>
      {suggestions.length ? (
        <div className="mt-2 max-h-52 overflow-auto rounded-2xl bg-white p-1 ring-1 ring-slate-200 shadow-sm">
          {suggestions.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left hover:bg-slate-50"
            >
              <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
              <div className="min-w-0">
                <div className="truncate text-xs text-slate-700">{item.label}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {item.source === "local" ? "AirPath location" : "Map search"}
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

  const selected = decoratedRoutes.find((item) => item.kind === selectedKind) ?? decoratedRoutes[0];
  const currentStep = selected.route.steps[0] ?? null;

  const googleMapsLink =
    `https://www.google.com/maps/dir/?api=1&origin=${planResult.origin.lat},${planResult.origin.lng}` +
    `&destination=${planResult.destination.lat},${planResult.destination.lng}&travelmode=driving`;

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <section className="space-y-4 lg:col-span-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại tìm lộ trình
        </button>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="mb-3 text-sm text-slate-500">Điểm đi</div>
          <div className="text-sm text-slate-800">{planResult.origin.label}</div>
          <div className="mt-4 text-sm text-slate-500">Điểm đến</div>
          <div className="text-sm text-slate-800">{planResult.destination.label}</div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="mb-3 text-sm text-slate-700">Chọn tuyến để chỉ đường</div>
          <div className="space-y-2">
            {decoratedRoutes.map((item) => (
              <button
                key={item.kind}
                onClick={() => setSelectedKind(item.kind)}
                className={`w-full rounded-2xl px-3 py-2 text-left text-sm ring-1 ${
                  selected.kind === item.kind
                    ? "bg-linear-to-r from-blue-600 to-emerald-500 text-white ring-transparent"
                    : "bg-slate-50 text-slate-700 ring-slate-200"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          <a
            href={googleMapsLink}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200"
          >
            <Navigation className="h-3.5 w-3.5" />
            Mở trên Google Maps
          </a>
        </div>
      </section>

      <section className="space-y-4 lg:col-span-3">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
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
              routes={decoratedRoutes}
              selectedKind={selected.kind}
              heightClassName="h-[420px]"
            />
          </div>

          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg text-slate-900">{selected.title}</div>
                <div className="text-sm text-slate-500">{selected.reason}</div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div>{(selected.route.distanceM / 1000).toFixed(1)} km</div>
                <div>{formatDuration(selected.route.durationS)}</div>
                <div>AQI {selected.route.avgAqi}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
          <div className="mb-4 text-sm text-slate-700">Chỉ đường từng bước</div>
          <div className="space-y-3">
            {selected.route.steps.length ? (
              selected.route.steps.map((step) => (
                <div key={step.stepIndex} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-sm text-slate-900">
                    {step.stepIndex}. {step.instruction}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {Math.round(step.distanceM)} m · {formatDuration(step.durationS)}
                    {step.roadName ? ` · ${step.roadName}` : ""}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
                Không có chi tiết bước đi cho tuyến này.
              </div>
            )}
          </div>
        </div>
      </section>
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
