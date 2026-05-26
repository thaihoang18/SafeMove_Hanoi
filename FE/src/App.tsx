import { useCallback, useEffect, useMemo, useState } from "react";
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
import { ShellDemo } from "./components/ShellDemo";
import { HomeViewDemo } from "./components/HomeViewDemo";
import { SearchLocationsView } from "./components/SearchLocationsView";
import { LocationDetailView } from "./components/LocationDetailView";
import { ReviewsListView } from "./components/ReviewsListView";
import { RoutePlannerView } from "./components/RoutePlannerView";
import { AqiAlertScreen } from "./components/AqiAlertScreen";
import { ProfileViewDemo } from "./components/ProfileViewDemo";
import type { View } from "./lib/types";

type Role = "guest" | "user" | "admin";

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
    if (!user || role === "guest") return;

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
  }, [role, user]);

  async function handleLogin(email: string, password: string) {
    setLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await login(email, password);
      setUser(response.user);
      setRole("user");
      setView("home");
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
    if (!user || view !== "home" || gpsAqi || gpsLoading) {
      return;
    }

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

      const response = await createLocationReview(selectedBackendLocation.id, {
        userId: user.id,
        rating,
        content,
      });

      setSelectedLocationReviews((current) => [response.review, ...current]);
      if (view === "reviews") {
        void loadSelectedLocationReviews(selectedBackendLocation.id);
      }
    },
    [loadSelectedLocationReviews, selectedBackendLocation, user, view],
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
        onLogin={handleLogin}
        onRegisterClick={() => setShowRegister(true)}
        onGuestContinue={handleGuestContinue}
        isLoading={loadingAuth}
        error={authError ?? undefined}
      />
    );
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
            setRole("user");
            setView("home");
          }}
          isLoading={profileSaving}
        />
      )}
    </ShellDemo>
  );
}
