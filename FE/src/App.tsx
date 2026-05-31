import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createRouteRequest,
  createLocationReview,
  fetchBootstrapData,
  fetchDashboard,
  fetchIqAirAqiByCoordinates,
  fetchLocationReviews,
  fetchLocations,
  fetchNotifications,
  fetchProfile,
  fetchRouteHistory,
  login,
  loginAdmin,
  markNotificationRead,
  previewAdvice,
  register,
  updateProfile,
} from "./lib/api";
import type {
  DashboardResponse,
  LookupItem,
  NotificationItem,
  LocationReview,
  ProfileResponse,
  RouteOption,
  User,
  GpsAqiMeasurement,
} from "./lib/types";
import type { PlaceCatalogItem } from "./lib/guest-exercise-places";
import { mergeExercisePlaces } from "./lib/guest-exercise-places";
import { LoginScreenDemo } from "./components/LoginScreenDemo";
import { RegisterScreenDemo } from "./components/RegisterScreenDemo";
import { ShellDemo, type View as ShellView } from "./components/ShellDemo";
import { HomeViewDemo } from "./components/HomeViewDemo";
import { SearchLocationsView } from "./components/SearchLocationsView";
import { LocationDetailView } from "./components/LocationDetailView";
import { ReviewsListView } from "./components/ReviewsListView";
import { containsBlockedKeyword } from "./lib/comment-blocklist";
import {
  defaultAvatarSelection,
  loadAvatarSelection,
  saveAvatarSelection,
  type AvatarSelection,
} from "./lib/avatar-presets";
import { RoutePlannerView } from "./components/RoutePlannerView";
import { AqiAlertScreen } from "./components/AqiAlertScreen";
import { ProfileViewDemo } from "./components/ProfileViewDemo";
import { AdminWorkspace } from "./components/AdminWorkspace";

type Role = "guest" | "user" | "admin";
type View = ShellView;

type AqiTone = "good" | "moderate" | "sensitive" | "bad" | "very-bad" | "unknown";

type AqiAlertItem = {
  id: string;
  title: string;
  body: string;
  tone: AqiTone;
  toneLabel: string;
  aqi: number | null;
  location: string;
  createdAt: string;
  deltaText: string | null;
};

const demoLocationPrompts = [
  "Hãy khám phá danh sách phòng gym nổi bật trong khu vực để chọn nơi phù hợp nhất cho hôm nay.",
  "Bạn có thể mở tab tìm kiếm để xem thêm các địa điểm gần bạn đang được đề xuất.",
  "Thử xem một địa điểm trong danh sách để so sánh rating, thời gian mở cửa và khoảng cách.",
  "Nếu muốn đi tập ngay, hãy xem nhanh các địa điểm có rating cao trước nhé.",
];

type LocationItem = PlaceCatalogItem;

function normalizeLocationKey(location: Pick<LocationItem, "name" | "address">) {
  return `${normalizeText(location.name)}|${normalizeText(location.address ?? "")}`;
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

function getAqiTone(value: number | null): { tone: AqiTone; label: string; advice: string } {
  if (value === null) {
    return {
      tone: "unknown",
      label: "Chưa có dữ liệu",
      advice: "Chưa nhận được AQI mới. Hãy bật GPS hoặc thử lại sau để nhận cảnh báo chính xác hơn.",
    };
  }

  if (value <= 50) {
    return {
      tone: "good",
      label: "Tốt",
      advice: "Không khí tốt. Bạn có thể ra ngoài, tập nhẹ và giữ nhịp sinh hoạt bình thường.",
    };
  }

  if (value <= 100) {
    return {
      tone: "moderate",
      label: "Trung bình",
      advice: "Không khí vẫn chấp nhận được. Người nhạy cảm nên theo dõi thêm trước khi vận động dài ngoài trời.",
    };
  }

  if (value <= 150) {
    return {
      tone: "sensitive",
      label: "Kém cho nhóm nhạy cảm",
      advice: "Hạn chế vận động mạnh ngoài trời. Nếu phải ra ngoài, hãy dùng khẩu trang lọc tốt và rút ngắn thời gian tiếp xúc.",
    };
  }

  if (value <= 200) {
    return {
      tone: "bad",
      label: "Xấu",
      advice: "Nên giảm tối đa hoạt động ngoài trời, chuyển sang tập trong nhà và đóng cửa khi không cần thông gió.",
    };
  }

  return {
    tone: "very-bad",
    label: "Rất xấu",
    advice: "Không khí đang rất xấu. Tránh ra ngoài nếu không thật sự cần thiết và ưu tiên bảo vệ hô hấp trong nhà.",
  };
}

function getAqiRangeTone(value: number | null): AqiTone {
  if (value === null) {
    return "unknown";
  }

  if (value <= 50) return "good";
  if (value <= 100) return "moderate";
  if (value <= 150) return "sensitive";
  if (value <= 200) return "bad";
  return "very-bad";
}

function formatAqiDelta(previousAqi: number | null, nextAqi: number | null) {
  if (previousAqi === null || nextAqi === null || previousAqi === nextAqi) {
    return null;
  }

  const delta = nextAqi - previousAqi;
  const direction = delta > 0 ? "tăng" : "giảm";
  return `AQI đã ${direction} ${Math.abs(delta)} điểm so với lần đo trước.`;
}

function buildAqiAlert(measurement: GpsAqiMeasurement, previousAqi: number | null): AqiAlertItem | null {
  const aqiValue = measurement.aqi;

  if (aqiValue === null) {
    return null;
  }

  const toneInfo = getAqiTone(aqiValue);
  const deltaText = formatAqiDelta(previousAqi, aqiValue);

  return {
    id: `${measurement.location_name}-${measurement.measured_at ?? Date.now()}-${aqiValue}`,
    title:
      deltaText && previousAqi !== null
        ? `AQI vừa ${aqiValue > previousAqi ? "tăng lên" : "giảm xuống"} ${aqiValue}`
        : `AQI hiện tại: ${aqiValue}`,
    body: `${toneInfo.advice}${measurement.location_name ? ` Khu vực đo: ${measurement.location_name}.` : ""}`,
    tone: toneInfo.tone,
    toneLabel: toneInfo.label,
    aqi: aqiValue,
    location: measurement.location_name || "Khu vực hiện tại",
    createdAt: measurement.measured_at ?? new Date().toISOString(),
    deltaText,
  };
}

function buildDemoWelcomeAlert(userName: string): AqiAlertItem {
  return {
    id: `demo-welcome-${Date.now()}`,
    title: `Chào mừng bạn trở lại, ${userName}!`,
    body: "Sẵn sàng tập thể dục chưa? Hãy xem các cảnh báo AQI mới nhất để lựa chọn thời điểm và địa điểm tập phù hợp nhé.",
    tone: "moderate",
    toneLabel: "",
    aqi: null,
    location: "SafeMove HaNoi",
    createdAt: new Date().toISOString(),
    deltaText: null,
  };
}

function buildDemoExploreAlert(stepIndex: number): AqiAlertItem {
  const prompt = demoLocationPrompts[stepIndex % demoLocationPrompts.length];

  return {
    id: `demo-explore-${stepIndex}-${Date.now()}`,
    title: "Gợi ý khám phá địa điểm",
    body: prompt,
    tone: "good",
    toneLabel: "Khám phá",
    aqi: null,
    location: "Danh sách địa điểm",
    createdAt: new Date().toISOString(),
    deltaText: null,
  };
}

function buildFlaggedCommentAlert(userName: string, content: string): AqiAlertItem {
  return {
    id: `flagged-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: "Bình luận có nguy cơ vi phạm",
    body: `Hãy chờ admin kiểm duyệt nội dung. Nội dung bạn vừa bình luận: "${content}"`,
    tone: "bad",
    toneLabel: "Kiểm duyệt nội dung",
    aqi: null,
    location: userName,
    createdAt: new Date().toISOString(),
    deltaText: null,
  };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("user");
  const [view, setView] = useState<View>("home");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [bootstrap, setBootstrap] = useState<{
    activities: LookupItem[];
    healthConditions: LookupItem[];
  }>({ activities: [], healthConditions: [] });
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [advice, setAdvice] = useState<{ severity: string; title: string; body: string } | null>(
    null,
  );
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [routeHistory, setRouteHistory] = useState<Array<Record<string, unknown>>>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [selectedLocationReviews, setSelectedLocationReviews] = useState<LocationReview[]>([]);
  const [selectedLocationReviewsLoading, setSelectedLocationReviewsLoading] = useState(false);
  const [selectedLocationReviewsError, setSelectedLocationReviewsError] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [maxRatio, setMaxRatio] = useState(1.5);
  const [routeSubmitting, setRouteSubmitting] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [gpsAqi, setGpsAqi] = useState<GpsAqiMeasurement | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [aqiAlerts, setAqiAlerts] = useState<AqiAlertItem[]>([]);
  const [aqiUnreadCount, setAqiUnreadCount] = useState(0);
  const [avatarSelection, setAvatarSelection] = useState<AvatarSelection>(defaultAvatarSelection);
  const demoAlertStepRef = useRef(0);
  const hasAutoLoadedGpsAqiRef = useRef(false);
  const lastStoredAqiRef = useRef<number | null>(null);
  const lastStoredToneRef = useRef<AqiTone>("unknown");

  const guestUser = useMemo<User>(
    () => ({
      id: "guest-preview",
      email: "guest@safemove.local",
      full_name: "Khách xem trước",
      birth_year: null,
      home_lat: null,
      home_lng: null,
    }),
    [],
  );

  useEffect(() => {
    fetchBootstrapData()
      .then((data) =>
        setBootstrap({
          activities: data.activities,
          healthConditions: data.healthConditions,
        }),
      )
      .catch((error) => setGlobalError(error.message));

    fetchLocations()
      .then((data) => setLocations(data.locations))
      .catch((error) => setGlobalError(error.message));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedAqi = window.localStorage.getItem("safemove:lastAqiValue");
    if (savedAqi !== null) {
      const parsed = Number(savedAqi);
      lastStoredAqiRef.current = Number.isFinite(parsed) ? parsed : null;
    }

    const savedTone = window.localStorage.getItem("safemove:lastAqiTone");
    if (savedTone === "good" || savedTone === "moderate" || savedTone === "sensitive" || savedTone === "bad" || savedTone === "very-bad") {
      lastStoredToneRef.current = savedTone;
    }
  }, []);

  useEffect(() => {
    if (!user?.id || role === "guest") {
      setAvatarSelection(defaultAvatarSelection);
      return;
    }

    setAvatarSelection(loadAvatarSelection(user.id));
  }, [role, user?.id]);

  useEffect(() => {
    if (!user || role === "guest" || role === "admin") return;

    seedDemoAlerts(user.full_name ?? user.email);

    const demoTimer = window.setInterval(() => {
      pushDemoExploreAlert();
    }, 1800000);

    Promise.all([
      fetchDashboard(user.id),
      fetchProfile(user.id),
      fetchNotifications(user.id),
      previewAdvice(user.id).catch(() => null),
      fetchRouteHistory(user.id),
    ])
      .then(([dashboardData, profileData, notificationData, adviceData, routeHistoryData]) => {
        setDashboard(dashboardData);
        setProfile(profileData);
        setNotifications(notificationData.notifications);
        setRouteHistory(routeHistoryData.routeRequests);
        setAdvice(adviceData?.advice ?? null);
        setMaxRatio(Number(profileData.profile?.default_max_route_ratio ?? 1.5));
      })
      .catch((error) => setGlobalError(error.message));

    return () => window.clearInterval(demoTimer);
  }, [role, user]);

  async function handleUserLogin(email: string, password: string) {
    setLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await login(email, password);
      setUser(response.user);
      setRole(response.user.role === "admin" ? "admin" : "user");
      setView(response.user.role === "admin" ? "dashboard" : "home");
      hasAutoLoadedGpsAqiRef.current = false;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleAdminLogin(email: string, password: string, securityCode: string) {
    setLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await loginAdmin(email, password, securityCode);
      setUser(response.user);
      setRole(response.user.role === "admin" ? "admin" : "user");
      setView(response.user.role === "admin" ? "dashboard" : "home");
      hasAutoLoadedGpsAqiRef.current = false;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleRegister(fullName: string, email: string, password: string) {
    setLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await register(fullName, email, password);
      setUser(response.user);
      setRole("user");
      setView("home");
      hasAutoLoadedGpsAqiRef.current = false;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Register failed.");
    } finally {
      setLoadingAuth(false);
    }
  }

  function handleGuestContinue() {
    setUser(guestUser);
    setRole("guest");
    setView("home");
    setAuthError(null);
    setGlobalError(null);
    hasAutoLoadedGpsAqiRef.current = false;
    demoAlertStepRef.current = 0;
    setAqiAlerts([buildDemoWelcomeAlert(guestUser.full_name ?? "bạn")]);
    setAqiUnreadCount(1);
  }

  async function handleMarkRead(notificationId: string) {
    await markNotificationRead(notificationId);
    if (!user) return;
    const data = await fetchNotifications(user.id);
    setNotifications(data.notifications);
    const dashboardData = await fetchDashboard(user.id);
    setDashboard(dashboardData);
  }

  function handleAqiBellClick() {
    setAqiUnreadCount(0);
  }

  function seedDemoAlerts(displayName: string) {
    demoAlertStepRef.current = 0;
    setAqiAlerts([buildDemoWelcomeAlert(displayName)]);
    setAqiUnreadCount(1);
  }

  function pushDemoExploreAlert() {
    demoAlertStepRef.current += 1;
    setAqiAlerts((current) => [buildDemoExploreAlert(demoAlertStepRef.current), ...current].slice(0, 5));
    setAqiUnreadCount((current) => current + 1);
  }

  async function handleSaveProfile(payload: Record<string, unknown>) {
    if (!user) return;
    setProfileSaving(true);
    try {
      const updatedProfile = await updateProfile(user.id, payload);
      setProfile(updatedProfile);
      const updatedDashboard = await fetchDashboard(user.id);
      setDashboard(updatedDashboard);
      const updatedAdvice = await previewAdvice(user.id).catch(() => null);
      setAdvice(updatedAdvice?.advice ?? null);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSaveProfileField(field: string, value: string) {
    if (!user) return;
    const payload: Record<string, unknown> = {};

    if (field === "name") {
      payload.full_name = value;
    } else if (field === "phone") {
      payload.phone = value;
    } else {
      payload[field] = value;
    }

    await handleSaveProfile(payload);
  }

  async function handleCreateRoute(payload: {
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
  }) {
    if (!user) return;
    setRouteSubmitting(true);
    try {
      await createRouteRequest({
        userId: user.id,
        ...payload,
      });
      const [dashboardData, routeHistoryData, notificationData] = await Promise.all([
        fetchDashboard(user.id),
        fetchRouteHistory(user.id),
        fetchNotifications(user.id),
      ]);
      setDashboard(dashboardData);
      setRouteHistory(routeHistoryData.routeRequests);
      setNotifications(notificationData.notifications);
    } finally {
      setRouteSubmitting(false);
    }
  }

  const handleRefreshGpsAqi = useCallback(async () => {
    if (!navigator.geolocation) {
      setGpsError("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }

    try {
      const permission = await navigator.permissions?.query?.({ name: "geolocation" as PermissionName });
      if (permission?.state === "denied") {
        setGpsError("Trình duyệt đã chặn vị trí GPS. Mở cài đặt trình duyệt để cho phép.");
        return;
      }
    } catch {
      // ignore unsupported permissions API
    }

    setGpsLoading(true);
    setGpsError(null);

    const getPosition = (options: PositionOptions) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

    const resolvePosition = async () => {
      try {
        return await getPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
      } catch (geolocationError) {
        const errorValue = geolocationError as GeolocationPositionError;
        if (errorValue.code === 3) {
          return await getPosition({ enableHighAccuracy: false, timeout: 18000, maximumAge: 0 });
        }
        throw geolocationError;
      }
    };

    try {
      const position = await resolvePosition();
      const { latitude, longitude } = position.coords;
      setGpsCoords({ lat: latitude, lng: longitude });
      setGpsAqi(null);

      try {
        const data = await fetchIqAirAqiByCoordinates(latitude, longitude);
        setGpsAqi(data.measurement);

        const nextAqi = data.measurement.aqi;
        const nextTone = getAqiRangeTone(nextAqi);
        const previousAqi = lastStoredAqiRef.current;
        const previousTone = lastStoredToneRef.current;

        if (nextAqi !== null && nextTone !== previousTone) {
          const alertItem = buildAqiAlert(data.measurement, previousAqi);
          if (alertItem) {
            setAqiAlerts((current) => [alertItem, ...current].slice(0, 5));
            setAqiUnreadCount((current) => current + 1);
          }
        }

        lastStoredAqiRef.current = nextAqi;
        lastStoredToneRef.current = nextTone;

        if (typeof window !== "undefined") {
          window.localStorage.setItem("safemove:lastAqiValue", nextAqi === null ? "" : String(nextAqi));
          window.localStorage.setItem("safemove:lastAqiTone", nextTone);
        }
      } catch (innerError) {
        if (innerError instanceof Error) {
          setGpsError(`Không lấy được AQI từ vị trí GPS: ${innerError.message}`);
        } else {
          setGpsError("Không lấy được AQI từ vị trí GPS.");
        }
      }
    } catch (error) {
      let message = "Không thể lấy vị trí GPS hiện tại.";

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        "message" in error
      ) {
        const geoError = error as GeolocationPositionError;
        if (geoError.code === 1) {
          message = "Bạn đã từ chối quyền vị trí. Vui lòng bật Location permission cho trang này.";
        } else if (geoError.code === 2) {
          message = "Không xác định được vị trí hiện tại. Hãy thử lại khi GPS ổn định hơn.";
        } else if (geoError.code === 3) {
          message = "Lấy vị trí bị timeout. Hãy thử lại.";
        } else {
          message = geoError.message || message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      setGpsError(message);
    } finally {
      setGpsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || view !== "home" || gpsAqi || gpsLoading || hasAutoLoadedGpsAqiRef.current) {
      return;
    }

    hasAutoLoadedGpsAqiRef.current = true;
    void handleRefreshGpsAqi();
  }, [gpsAqi, gpsLoading, handleRefreshGpsAqi, user, view]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const mergedLocations = useMemo(() => mergeExercisePlaces(locations), [locations]);

  const resolveBackendLocation = useCallback(
    (location: LocationItem | null) => {
      if (!location) {
        return null;
      }

      const key = normalizeLocationKey(location);
      return locations.find((item) => normalizeLocationKey(item) === key) ?? null;
    },
    [locations],
  );

  const selectedBackendLocation = useMemo(
    () => resolveBackendLocation(selectedLocation),
    [resolveBackendLocation, selectedLocation],
  );

  const loadSelectedLocationReviews = useCallback(async (locationId: string) => {
    setSelectedLocationReviewsLoading(true);
    setSelectedLocationReviewsError(null);

    try {
      const response = await fetchLocationReviews(locationId);
      setSelectedLocationReviews(response.reviews);
    } catch (error) {
      setSelectedLocationReviewsError(error instanceof Error ? error.message : "Unable to load reviews.");
    } finally {
      setSelectedLocationReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedBackendLocation || (view !== "spot-detail" && view !== "reviews")) {
      setSelectedLocationReviews([]);
      setSelectedLocationReviewsError(null);
      setSelectedLocationReviewsLoading(false);
      return;
    }

    void loadSelectedLocationReviews(selectedBackendLocation.id);

    const timer = window.setInterval(() => {
      void loadSelectedLocationReviews(selectedBackendLocation.id);
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [loadSelectedLocationReviews, selectedBackendLocation, view]);


  const handleSubmitLocationReview = useCallback(
    async ({ rating, content }: { rating: number; content: string }) => {
      if (!selectedBackendLocation || !user) {
        throw new Error("Missing selected location or user.");
      }

      const isFlagged = containsBlockedKeyword(content);

      const response = await createLocationReview(selectedBackendLocation.id, {
        userId: user.id,
        rating,
        content,
        is_hidden: isFlagged,
      } as any);

      // If flagged, don't show it in public review list. Instead refresh notifications and moderation.
      if (response.review.is_hidden) {
        setAqiAlerts((current) => [buildFlaggedCommentAlert(user.full_name ?? user.email, content), ...current].slice(0, 5));
        setAqiUnreadCount((current) => current + 1);

        // refresh notifications so bell shows the new flagged notice
        try {
          const data = await fetchNotifications(user.id);
          setNotifications(data.notifications);
        } catch (err) {
          // ignore
        }

        // reload visible reviews from backend (they exclude hidden ones)
        if (view === "reviews") {
          void loadSelectedLocationReviews(selectedBackendLocation.id);
        }
      } else {
        setSelectedLocationReviews((current) => [response.review, ...current]);
        if (view === "reviews") {
          void loadSelectedLocationReviews(selectedBackendLocation.id);
        }
      }
    },
    [loadSelectedLocationReviews, selectedBackendLocation, user, view],
  );

  const handleUpdateAvatarSelection = useCallback(
    (selection: AvatarSelection) => {
      if (!user?.id) {
        return;
      }

      saveAvatarSelection(user.id, selection);
      setAvatarSelection(selection);
    },
    [user?.id],
  );

  if (!user) {
    return showRegister ? (
      <RegisterScreenDemo
        onRegister={handleRegister}
        onLoginClick={() => setShowRegister(false)}
        isLoading={loadingAuth}
        error={authError ?? undefined}
      />
    ) : (
      <LoginScreenDemo
        onUserLogin={handleUserLogin}
        onAdminLogin={handleAdminLogin}
        onRegisterClick={() => setShowRegister(true)}
        onGuestContinue={handleGuestContinue}
        isLoading={loadingAuth}
        error={authError ?? undefined}
      />
    );
  }

  if (role === "admin") {
    return <AdminWorkspace userName={user.full_name || user.email} onLogout={() => {
      setUser(null);
      setRole("user");
      setView("home");
      setDashboard(null);
      setProfile(null);
      setNotifications([]);
      setAdvice(null);
      setRouteHistory([]);
      setSelectedLocation(null);
      setGpsAqi(null);
      setGpsCoords(null);
      setGpsError(null);
    }} />;
  }

  return (
    <ShellDemo
      role={role}
      view={view}
      setView={setView}
      userName={user.full_name || user.email}
      onRequireLogin={() => {
        setGlobalError("Vui lòng đăng nhập để mở chức năng này.");
        setView("home");
      }}
      aqiAlerts={aqiAlerts}
      aqiUnreadCount={aqiUnreadCount}
      onAqiBellClick={handleAqiBellClick}
      onLogout={() => {
        setUser(null);
        setDashboard(null);
        setProfile(null);
        setNotifications([]);
        setAdvice(null);
        setRouteHistory([]);
        setSelectedLocation(null);
        setGpsAqi(null);
        setGpsCoords(null);
        setGpsError(null);
        setAqiAlerts([]);
        setAqiUnreadCount(0);
        setRole("user");
        setView("home");
      }}
    >
      {globalError && (
        <div className="mb-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
          {globalError}
        </div>
      )}

      {view === "home" && (
        <HomeViewDemo
          dashboard={dashboard}
          advice={advice}
          gpsAqi={gpsAqi}
          gpsCoords={gpsCoords}
          gpsLoading={gpsLoading}
          onOpenAqiAlert={() => setView("alert")}
          onRefreshGpsAqi={handleRefreshGpsAqi}
          
        />
      )}

      {view === "alert" && (
        <AqiAlertScreen
          gpsAqi={gpsAqi}
          gpsCoords={gpsCoords}
          locations={mergedLocations}
          onBack={() => setView("home")}
          onOpenRoute={() => {
            if (role === "guest") {
              setGlobalError("Vui lòng đăng nhập để tìm lộ trình.");
              return;
            }
            setView("route");
          }}
        />
      )}

      {view === "search" && (
        <SearchLocationsView
          locations={mergedLocations}
          onSelectLocation={(location) => {
            setSelectedLocation(resolveBackendLocation(location));
            setView("spot-detail");
          }}
          onRequireLogin={() => {
            setGlobalError("Vui lòng đăng nhập để xem chi tiết địa điểm.");
          }}
        />
      )}

      {view === "spot-detail" && (
        <LocationDetailView
          location={selectedLocation}
          isGuest={role === "guest"}
          reviews={selectedLocationReviews}
          reviewsLoading={selectedLocationReviewsLoading}
          reviewsError={selectedLocationReviewsError}
          currentUserId={user.id}
          currentUserAvatarSelection={avatarSelection}
          onRequireLogin={() => {
            setGlobalError("Vui lòng đăng nhập để viết đánh giá hoặc xem chi tiết.");
          }}
          onOpenReviews={() => setView("reviews")}
          onOpenRoute={() => {
            if (role === "guest") {
              setGlobalError("Vui lòng đăng nhập để tìm lộ trình.");
              return;
            }
            setView("route");
          }}
          onSubmitReview={handleSubmitLocationReview}
        />
      )}

      {view === "reviews" && (
        <ReviewsListView
          locationName={selectedBackendLocation?.name ?? selectedLocation?.name ?? "Địa điểm"}
          reviews={selectedLocationReviews}
          reviewsLoading={selectedLocationReviewsLoading}
          reviewsError={selectedLocationReviewsError}
          currentUserId={user.id}
          currentUserAvatarSelection={avatarSelection}
          onBack={() => setView("spot-detail")}
        />
      )}

      {view === "route" && (
        <RoutePlannerView
          origin={gpsCoords ? { label: "Vị trí hiện tại", lat: gpsCoords.lat, lng: gpsCoords.lng } : null}
          destination={selectedLocation}
          locations={mergedLocations.map((location) => ({
            id: location.id,
            name: location.name,
            lat: location.lat,
            lng: location.lng,
            address: location.address ?? undefined,
            city: location.city ?? undefined,
            district: location.district,
          }))}
          maxRatio={maxRatio}
          setMaxRatio={setMaxRatio}
          onSubmit={handleCreateRoute}
          routeHistory={routeHistory}
          loading={routeSubmitting}
        />
      )}

      {view === "profile" && (
        <ProfileViewDemo
          user={{
            id: user.id,
            name: profile?.user.full_name ?? user.full_name ?? user.email,
            email: user.email,
            phone: profile?.profile?.phone ?? "",
            joinDate: profile?.user.created_at ?? new Date().toISOString(),
          }}
          onUpdateProfile={handleSaveProfileField}
          avatarSelection={avatarSelection}
          onUpdateAvatarSelection={handleUpdateAvatarSelection}
          onLogout={() => {
            setUser(null);
            setDashboard(null);
            setProfile(null);
            setNotifications([]);
            setAdvice(null);
            setRouteHistory([]);
            setSelectedLocation(null);
            setGpsAqi(null);
            setGpsCoords(null);
            setGpsError(null);
            setAqiAlerts([]);
            setAqiUnreadCount(0);
            setAvatarSelection(defaultAvatarSelection);
            setRole("user");
            setView("home");
          }}
          isLoading={profileSaving}
        />
      )}
    </ShellDemo>
  );
}
