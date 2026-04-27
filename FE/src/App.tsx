import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createRouteRequest,
  fetchBootstrapData,
  fetchDashboard,
  fetchIqAirAqiByCoordinates,
  fetchLocations,
  fetchNotifications,
  fetchProfile,
  fetchRouteHistory,
  login,
  markNotificationRead,
  previewAdvice,
  register,
  updateProfile,
} from "./lib/api";
import type {
  DashboardResponse,
  LookupItem,
  NotificationItem,
  ProfileResponse,
  RouteOption,
  User,
  GpsAqiMeasurement,
} from "./lib/types";
import { HomeView } from "./components/HomeView";
import { ChatWidget } from "./components/ChatWidget";
import { LoginScreen } from "./components/LoginScreen";
import { NotificationsView } from "./components/NotificationsView";
import { ProfileView } from "./components/ProfileView";
import { RoutePlannerView } from "./components/RoutePlannerView";
import { Shell, type View } from "./components/Shell";

type LocationItem = {
  id: string;
  name: string;
  location_type: string;
  address: string | null;
  city: string | null;
  district: string | null;
  lat: number;
  lng: number;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
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
  const [maxRatio, setMaxRatio] = useState(1.5);
  const [routeSubmitting, setRouteSubmitting] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [gpsAqi, setGpsAqi] = useState<GpsAqiMeasurement | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

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
    if (!user) return;

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
  }, [user]);

  async function handleLogin(email: string, password: string) {
    setLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await login(email, password);
      setUser(response.user);
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
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Register failed.");
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleMarkRead(notificationId: string) {
    await markNotificationRead(notificationId);
    if (!user) return;
    const data = await fetchNotifications(user.id);
    setNotifications(data.notifications);
    const dashboardData = await fetchDashboard(user.id);
    setDashboard(dashboardData);
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

    setGpsLoading(true);
    setGpsError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60_000,
        });
      });

      const { latitude, longitude } = position.coords;
      setGpsCoords({ lat: latitude, lng: longitude });
      const data = await fetchIqAirAqiByCoordinates(latitude, longitude);
      setGpsAqi(data.measurement);
    } catch (error) {
      let message = "Không thể lấy AQI theo GPS hiện tại.";

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        "message" in error
      ) {
        const geoError = error as GeolocationPositionError;
        if (geoError.code === 1) {
          message = "Bạn đã từ chối quyền vị trí. Hãy bật Location permission cho trang này.";
        } else if (geoError.code === 2) {
          message = "Không xác định được vị trí hiện tại. Hãy thử lại khi GPS ổn định hơn.";
        } else if (geoError.code === 3) {
          message = "Lấy vị trí bị timeout. Hãy thử lại.";
        } else {
          message = geoError.message || message;
        }
      } else if (error instanceof Error) {
        if (error.message.includes("Missing IQAIR_API_KEY")) {
          message =
            "Server chưa cấu hình IQAIR_API_KEY. Vui lòng thêm key vào file .env và restart BE.";
        } else if (error.message.toLowerCase().includes("failed to fetch")) {
          message = "Không kết nối được backend. Kiểm tra BE đang chạy ở cổng 5000.";
        } else {
          message = error.message;
        }
      }

      setGpsError(message);
    } finally {
      setGpsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || view !== "home" || gpsAqi || gpsLoading) {
      return;
    }

    void handleRefreshGpsAqi();
  }, [gpsAqi, gpsLoading, handleRefreshGpsAqi, user, view]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  if (!user) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        error={authError}
        loading={loadingAuth}
      />
    );
  }

  return (
    <Shell
      view={view}
      setView={setView}
      userName={user.full_name || user.email}
      unreadCount={unreadCount}
      onLogout={() => {
        setUser(null);
        setDashboard(null);
        setProfile(null);
        setNotifications([]);
        setAdvice(null);
        setRouteHistory([]);
        setGpsAqi(null);
        setGpsCoords(null);
        setGpsError(null);
      }}
    >
      {globalError ? (
        <div className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
          {globalError}
        </div>
      ) : null}

      {view === "home" ? (
        <HomeView
          dashboard={dashboard}
          advice={advice}
          onOpenRoute={() => setView("route")}
          onOpenProfile={() => setView("profile")}
          gpsAqi={gpsAqi}
          gpsCoords={gpsCoords}
          gpsLoading={gpsLoading}
          gpsError={gpsError}
          onRefreshGpsAqi={handleRefreshGpsAqi}
        />
      ) : null}

      {view === "route" ? (
        <RoutePlannerView
          locations={locations}
          maxRatio={maxRatio}
          setMaxRatio={setMaxRatio}
          routeHistory={routeHistory}
          onSubmit={handleCreateRoute}
          loading={routeSubmitting}
        />
      ) : null}

      {view === "profile" ? (
        <ProfileView
          profile={profile}
          availableActivities={bootstrap.activities}
          availableConditions={bootstrap.healthConditions}
          onSave={handleSaveProfile}
          saving={profileSaving}
        />
      ) : null}

      {view === "notifications" ? (
        <NotificationsView notifications={notifications} onMarkRead={handleMarkRead} />
      ) : null}

      <ChatWidget user={user} />
    </Shell>
  );
}
