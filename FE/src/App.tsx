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
  forgotPassword,
  login,
  loginAdmin,
  markNotificationRead,
  previewAdvice,
  register,
  updateProfile,
  dispatchAqiAlert,
  updateNotificationPreferences,
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
import { getBlockedCommentLanguages } from "./lib/comment-blocklist";
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
import { GuestRoutePreview } from "./components/GuestRoutePreview";

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
  "周辺の注目ジム一覧を見て、今日に合う場所を選びましょう。",
  "検索タブを開くと、近くのおすすめスポットをさらに確認できます。",
  "候補を開いて、評価・営業時間・距離を比較してみましょう。",
  "今すぐ運動したいなら、まず高評価のスポットを確認してください。",
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
      label: "データなし",
      advice: "最新の AQI を取得できませんでした。GPS を有効にするか、後でもう一度お試しください。",
    };
  }

  if (value <= 50) {
    return {
      tone: "good",
      label: "良好",
      advice: "空気は良好です。外出や軽い運動を通常どおり行えます。",
    };
  }

  if (value <= 100) {
    return {
      tone: "moderate",
      label: "普通",
      advice: "空気は許容範囲です。敏感な方は屋外で長時間運動する前に状況を確認してください。",
    };
  }

  if (value <= 150) {
    return {
      tone: "sensitive",
      label: "敏感な人には不向き",
      advice: "屋外での激しい運動は控えてください。外出が必要な場合は高性能マスクを使い、滞在時間を短くしましょう。",
    };
  }

  if (value <= 200) {
    return {
      tone: "bad",
      label: "悪い",
      advice: "屋外活動は最小限に抑え、屋内運動へ切り替えてください。換気が不要なときは窓を閉めましょう。",
    };
  }

  return {
    tone: "very-bad",
    label: "非常に悪い",
    advice: "空気は非常に悪い状態です。不要不急の外出は避け、屋内で呼吸器を守る対策を優先してください。",
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
  const direction = delta > 0 ? "上昇" : "低下";
  return `AQI は前回比で ${Math.abs(delta)} ポイント ${direction} しました。`;
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
      ? `AQI は ${aqiValue > previousAqi ? "上昇" : "低下"} して ${aqiValue} です`
        : `現在の AQI: ${aqiValue}`,
    body: `${toneInfo.advice}${measurement.location_name ? ` 測定場所: ${measurement.location_name}.` : ""}`,
    tone: toneInfo.tone,
    toneLabel: toneInfo.label,
    aqi: aqiValue,
    location: measurement.location_name || "現在地",
    createdAt: measurement.measured_at ?? new Date().toISOString(),
    deltaText,
  };
}

function buildThresholdAqiAlert(
  measurement: GpsAqiMeasurement,
  threshold: number,
  isUnsafe: boolean,
): AqiAlertItem | null {
  const aqiValue = measurement.aqi;

  if (aqiValue === null) {
    return null;
  }

  return {
    id: `threshold-${measurement.location_name}-${measurement.measured_at ?? Date.now()}-${aqiValue}-${threshold}`,
    title: isUnsafe ? "AQI が警告しきい値を超えています" : "あなたにとって安全な AQI です",
    body: isUnsafe
      ? `現在の AQI は ${aqiValue} で、しきい値 ${threshold} を上回っています。屋外運動を減らすか、屋内に移動してください。`
      : `現在の AQI は ${aqiValue} で、しきい値 ${threshold} を下回っています。今の環境は安全に活動を続けられます。`,
    tone: isUnsafe ? "bad" : "good",
    toneLabel: isUnsafe ? "しきい値超過" : "安全",
    aqi: aqiValue,
    location: measurement.location_name || "現在地",
    createdAt: measurement.measured_at ?? new Date().toISOString(),
    deltaText: null,
  };
}

function buildDemoWelcomeAlert(userName: string): AqiAlertItem {
  return {
    id: `demo-welcome-${Date.now()}`,
    title: `おかえりなさい、${userName} さん！`,
    body: "運動の準備はできていますか。最新の AQI 警告を確認して、適切な時間と場所を選びましょう。",
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
    title: "スポット探索のおすすめ",
    body: prompt,
    tone: "good",
    toneLabel: "探索",
    aqi: null,
    location: "スポット一覧",
    createdAt: new Date().toISOString(),
    deltaText: null,
  };
}

function buildFlaggedCommentAlert(userName: string, content: string): AqiAlertItem {
  return {
    id: `flagged-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: "規約違反の可能性があるコメント",
    body: `管理者の確認をお待ちください。あなたが投稿したコメント: "${content}"`,
    tone: "bad",
    toneLabel: "内容確認",
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
    aqiSnapshot: GpsAqiMeasurement | null;
  }>({ activities: [], healthConditions: [], aqiSnapshot: null });
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [advice, setAdvice] = useState<{ severity: string; title: string; body: string } | null>(
    null,
  );
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [routeHistory, setRouteHistory] = useState<Array<Record<string, unknown>>>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [selectedLocationAqi, setSelectedLocationAqi] = useState<GpsAqiMeasurement | null>(null);
  const [selectedLocationAqiLoading, setSelectedLocationAqiLoading] = useState(false);
  const [selectedLocationAqiError, setSelectedLocationAqiError] = useState<string | null>(null);
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
  const lastThresholdAlertStateRef = useRef<"safe" | "unsafe" | null>(null);
  const lastAlertedThresholdRef = useRef<number | null>(null);
  const selectedLocationAqiAbortRef = useRef<AbortController | null>(null);

  function applyBootstrapAqiSnapshot(snapshot: GpsAqiMeasurement | null) {
    if (!snapshot) {
      return;
    }

    setGpsAqi(snapshot);
    setGpsCoords({ lat: snapshot.lat, lng: snapshot.lng });
  }

  const loadSelectedLocationAqi = useCallback(async (location: LocationItem) => {
    selectedLocationAqiAbortRef.current?.abort();
    const controller = new AbortController();
    selectedLocationAqiAbortRef.current = controller;

    setSelectedLocationAqiLoading(true);
    setSelectedLocationAqiError(null);

    try {
      const response = await fetchIqAirAqiByCoordinates(location.lat, location.lng, {
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setSelectedLocationAqi(response.measurement);
      }
    } catch (error) {
      if (
        controller.signal.aborted ||
        (error instanceof Error && error.name === "AbortError") ||
        (typeof error === "object" && error !== null && "name" in error && (error as any).name === "AbortError")
      ) {
        return;
      }

      setSelectedLocationAqi(null);
      setSelectedLocationAqiError(error instanceof Error ? error.message : "AQI を取得できませんでした。");
    } finally {
      if (!controller.signal.aborted) {
        setSelectedLocationAqiLoading(false);
      }
    }
  }, []);

  const guestUser = useMemo<User>(
    () => ({
      id: "guest-preview",
      email: "guest@safemove.local",
      full_name: "プレビューゲスト",
      birth_year: null,
      home_lat: null,
      home_lng: null,
    }),
    [],
  );

  useEffect(() => {
    fetchBootstrapData()
      .then((data) => {
        setBootstrap({
          activities: data.activities,
          healthConditions: data.healthConditions,
          aqiSnapshot: data.aqiSnapshot,
        });
        applyBootstrapAqiSnapshot(data.aqiSnapshot);
      })
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
      applyBootstrapAqiSnapshot(bootstrap.aqiSnapshot);
      hasAutoLoadedGpsAqiRef.current = false;
    } catch (error) {
      let msg = error instanceof Error ? error.message : "ログインに失敗しました。";
      if (/invalid email or password/i.test(msg) || /invalid admin credentials/i.test(msg) || /401/.test(msg)) {
        msg = "ユーザー名またはパスワードが正しくありません。";
      } else if (/email is required/i.test(msg) || /password is required/i.test(msg)) {
        msg = "必要な情報をすべて入力してください。";
      }
      setAuthError(msg);
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleAdminLogin(email: string, password: string) {
    setLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await loginAdmin(email, password);
      setUser(response.user);
      setRole(response.user.role === "admin" ? "admin" : "user");
      setView(response.user.role === "admin" ? "dashboard" : "home");
      applyBootstrapAqiSnapshot(bootstrap.aqiSnapshot);
      hasAutoLoadedGpsAqiRef.current = false;
    } catch (error) {
      let msg = error instanceof Error ? error.message : "ログインに失敗しました。";
      if (/invalid admin credentials/i.test(msg) || /401/.test(msg) || /invalid email or password/i.test(msg)) {
        msg = "ユーザー名またはパスワードが正しくありません。";
      } else if (/email is required/i.test(msg) || /password is required/i.test(msg)) {
        msg = "必要な情報をすべて入力してください。";
      }
      setAuthError(msg);
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
      applyBootstrapAqiSnapshot(bootstrap.aqiSnapshot);
      hasAutoLoadedGpsAqiRef.current = false;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "新規登録に失敗しました。");
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleForgotPassword(email: string) {
    setLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await forgotPassword(email);
      return response.message;
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
    lastThresholdAlertStateRef.current = null;
    lastAlertedThresholdRef.current = null;
    // Guests should not receive demo notifications or unread counts
    setAqiAlerts([]);
    setAqiUnreadCount(0);
    applyBootstrapAqiSnapshot(bootstrap.aqiSnapshot);
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
      payload.fullName = value;
    } else if (field === "phone") {
      payload.phone = value;
    } else if (field === "password") {
      payload.password = value;
    } else {
      payload[field] = value;
    }

    await handleSaveProfile(payload);
  }

  async function handleUpdateNotificationPref(field: string, value: boolean) {
    if (!user) return;
    setProfileSaving(true);
    try {
      const updatedPrefs = await updateNotificationPreferences(user.id, {
        [field]: value,
      });
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              notificationPreferences: updatedPrefs.notificationPreferences,
            }
          : prev,
      );
    } catch (err) {
      console.error("Failed to update preferences:", err);
    } finally {
      setProfileSaving(false);
    }
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
      // No geolocation support — silently use B1 fallback
      setGpsCoords({ lat: 21.0041, lng: 105.8428 });
      try {
        const data = await fetchIqAirAqiByCoordinates(21.0041, 105.8428);
        setGpsAqi(data.measurement);
      } catch { /* ignore */ }
      return;
    }

    try {
      const permission = await navigator.permissions?.query?.({ name: "geolocation" as PermissionName });
      if (permission?.state === "denied") {
        // Permission denied — silently fall back to B1
        setGpsCoords({ lat: 21.0041, lng: 105.8428 });
        try {
          const data = await fetchIqAirAqiByCoordinates(21.0041, 105.8428);
          setGpsAqi(data.measurement);
        } catch { /* ignore */ }
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
      } catch {
        // AQI fetch failed — silently ignore, gpsAqi stays null
      }
    } catch (error) {
      console.warn("GPS 取得エラー。B1 Building のフォールバックを使用します:", error);
      
      // Fallback coordinates: B1 Building, Hanoi University of Science and Technology
      const fallbackLat = 21.0041;
      const fallbackLng = 105.8428;
      
      setGpsCoords({ lat: fallbackLat, lng: fallbackLng });
      
      try {
        const data = await fetchIqAirAqiByCoordinates(fallbackLat, fallbackLng);
        setGpsAqi(data.measurement);
      } catch { /* ignore */ }
    } finally {
      setGpsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || role === "guest" || role === "admin") {
      lastThresholdAlertStateRef.current = null;
      return;
    }

    const currentGpsAqi = gpsAqi;
    if (!currentGpsAqi || currentGpsAqi.aqi === null || currentGpsAqi.aqi === undefined) {
      return;
    }

    const threshold = profile?.profile?.alert_threshold ?? 140;
    const isUnsafe = currentGpsAqi.aqi >= threshold;
    const isStateChanged = lastThresholdAlertStateRef.current !== (isUnsafe ? "unsafe" : "safe");
    const isThresholdChanged = lastAlertedThresholdRef.current !== threshold;

    if (isUnsafe && (isStateChanged || isThresholdChanged)) {
      const isPushEnabled = profile?.notificationPreferences?.push_enabled !== false;
      const isEmailEnabled = profile?.notificationPreferences?.email_enabled === true;
      const alertItem = buildThresholdAqiAlert(currentGpsAqi, threshold, true);
      
      if (alertItem) {
        setAqiAlerts((current) => [alertItem, ...current].slice(0, 5));
        setAqiUnreadCount((current) => current + 1);

        if (isPushEnabled || isEmailEnabled) {
          // Dispatch real push notification + email via backend
          void dispatchAqiAlert(user.id, {
            title: alertItem.title,
            body: alertItem.body,
            aqi: alertItem.aqi,
            aqiLabel: alertItem.toneLabel,
            location: alertItem.location,
          }).catch((err) => {
            // Non-fatal — in-app alert already shown
            console.warn("[AQI Dispatch] Failed to send push/email:", err?.message);
          });
        }
      }

      lastAlertedThresholdRef.current = threshold;
    }

    lastThresholdAlertStateRef.current = isUnsafe ? "unsafe" : "safe";
  }, [gpsAqi, profile?.profile?.alert_threshold, role, user]);

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
      const matched = locations.find((item) => normalizeLocationKey(item) === key);
      return matched ? { ...location, ...matched } : location;
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
      setSelectedLocationReviewsError(error instanceof Error ? error.message : "レビューを読み込めませんでした。");
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
  }, [loadSelectedLocationReviews, selectedBackendLocation, view]);

  useEffect(() => {
    if (!selectedLocation || view !== "spot-detail") {
      selectedLocationAqiAbortRef.current?.abort();
      setSelectedLocationAqiLoading(false);
      setSelectedLocationAqiError(null);
      return;
    }

    void loadSelectedLocationAqi(selectedLocation);

    return () => {
      selectedLocationAqiAbortRef.current?.abort();
    };
  }, [loadSelectedLocationAqi, selectedLocation, view]);


  const handleSubmitLocationReview = useCallback(
    async ({ rating, content }: { rating: number; content: string }) => {
      if (!selectedBackendLocation || !user) {
        throw new Error("選択された地点またはユーザーが見つかりません。");
      }

      const blockedLanguages = getBlockedCommentLanguages(content);
      const isFlagged = blockedLanguages.length > 0;

      const response = await createLocationReview(selectedBackendLocation.id, {
        userId: user.id,
        rating,
        content,
        is_hidden: isFlagged,
        metadata: isFlagged ? { moderation: { blocked_languages: blockedLanguages } } : undefined,
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
      } else {
        setSelectedLocationReviews((current) => [response.review, ...current]);
      }
    },
    [selectedBackendLocation, user, view],
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
        onForgotPassword={handleForgotPassword}
        isLoading={loadingAuth}
        error={authError ?? undefined}
      />
    );
  }

  if (role === "admin") {
    return <AdminWorkspace userId={user.id} userName={user.full_name || user.email} userEmail={user.email} onLogout={() => {
      setUser(null);
      setRole("user");
      setView("home");
      setDashboard(null);
      setProfile(null);
      setNotifications([]);
      setAdvice(null);
      setRouteHistory([]);
      setSelectedLocation(null);
      applyBootstrapAqiSnapshot(bootstrap.aqiSnapshot);
      setGpsError(null);
    }} bootstrapAqiSnapshot={bootstrap.aqiSnapshot} />;
  }

  return (
      <ShellDemo
        role={role}
        view={view}
        setView={setView}
        userName={user.full_name || user.email}
        avatarSelection={avatarSelection}
        onRequireLogin={() => {
          setGlobalError("この機能を使うにはログインしてください。");
          setView("home");
        }}
      onShowLogin={() => {
        // Navigate to login screen by clearing current user (will render LoginScreenDemo)
        setUser(null);
        setGlobalError(null);
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
        applyBootstrapAqiSnapshot(bootstrap.aqiSnapshot);
        setGpsError(null);
        setAqiAlerts([]);
        setAqiUnreadCount(0);
        lastThresholdAlertStateRef.current = null;
        lastAlertedThresholdRef.current = null;
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
          gpsError={gpsError}
        />
      )}

      {view === "alert" && (
        <AqiAlertScreen
          gpsAqi={gpsAqi}
          gpsCoords={gpsCoords}
          locations={mergedLocations}
          onBack={() => setView("home")}
          onOpenSuggestion={(location) => {
            const backendLocation = resolveBackendLocation(location);
            setSelectedLocation(backendLocation);
            setSelectedLocationAqi(null);
            setSelectedLocationAqiError(null);
            setSelectedLocationAqiLoading(true);
            setView("spot-detail");
          }}
        />
      )}

      {view === "search" && (
      <SearchLocationsView
        locations={mergedLocations}
        onSelectLocation={(location) => {
            const backendLocation = resolveBackendLocation(location);
            setSelectedLocation(backendLocation);
            setSelectedLocationAqi(null);
            setSelectedLocationAqiError(null);
            setSelectedLocationAqiLoading(true);
            setView("spot-detail");
          }}
          onRequireLogin={() => {
            setGlobalError("スポット詳細を見るにはログインしてください。");
          }}
        />
      )}

      {view === "spot-detail" && (
        <LocationDetailView
          location={selectedLocation}
          aqiMeasurement={selectedLocationAqi}
          aqiLoading={selectedLocationAqiLoading}
          aqiError={selectedLocationAqiError}
          isGuest={role === "guest"}
          reviews={selectedLocationReviews}
          reviewsLoading={selectedLocationReviewsLoading}
          reviewsError={selectedLocationReviewsError}
          currentUserId={user.id}
          currentUserAvatarSelection={avatarSelection}
          onRequireLogin={() => {
            setGlobalError("レビューを書いたり詳細を見るにはログインしてください。");
          }}
            onShowLogin={() => {
              setUser(null);
              setGlobalError(null);
              setView("home");
            }}
          onOpenReviews={() => setView("reviews")}
          onOpenRoute={() => setView("route")}
          onBack={() => setView("search")}
          onSubmitReview={handleSubmitLocationReview}
        />
      )}

      {view === "reviews" && (
        <ReviewsListView
          locationName={selectedBackendLocation?.name ?? selectedLocation?.name ?? "スポット"}
          reviews={selectedLocationReviews}
          reviewsLoading={selectedLocationReviewsLoading}
          reviewsError={selectedLocationReviewsError}
          currentUserId={user.id}
          currentUserAvatarSelection={avatarSelection}
          onBack={() => setView("spot-detail")}
        />
      )}

      {view === "route" && role === "guest" && (
        <GuestRoutePreview
          locations={mergedLocations}
          onShowLogin={() => {
            setUser(null);
            setGlobalError(null);
            setView("home");
          }}
          onBack={() => setView(selectedLocation ? "spot-detail" : "home")}
        />
      )}

      {view === "route" && role !== "guest" && (
        <RoutePlannerView
          origin={gpsCoords ? { label: "現在地", lat: gpsCoords.lat, lng: gpsCoords.lng } : null}
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
          onBack={() => setView(selectedLocation ? "spot-detail" : "home")}
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
          aqiThreshold={profile?.profile?.alert_threshold ?? 140}
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
            applyBootstrapAqiSnapshot(bootstrap.aqiSnapshot);
            setGpsError(null);
            setAqiAlerts([]);
            setAqiUnreadCount(0);
            lastThresholdAlertStateRef.current = null;
            lastAlertedThresholdRef.current = null;
            setAvatarSelection(defaultAvatarSelection);
            setRole("user");
            setView("home");
          }}
          isLoading={profileSaving}
          pushEnabled={profile?.notificationPreferences?.push_enabled !== false}
          emailEnabled={profile?.notificationPreferences?.email_enabled === true}
          onUpdatePushNotification={(enabled) => handleUpdateNotificationPref("pushEnabled", enabled)}
          onUpdateEmailNotification={(enabled) => handleUpdateNotificationPref("emailEnabled", enabled)}
        />
      )}
    </ShellDemo>
  );
}
