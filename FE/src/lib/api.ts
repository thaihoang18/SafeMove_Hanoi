import type {
  DashboardResponse,
  GpsAqiMeasurement,
  LookupItem,
  ChatMessage,
  ChatSession,
  NotificationItem,
  PlannedRoutesResponse,
  PlaceSuggestion,
  ProfileResponse,
  RouteOption,
  User,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data as T;
}

export async function fetchBootstrapData() {
  return request<{ ok: true; activities: LookupItem[]; healthConditions: LookupItem[] }>(
    "/api/bootstrap",
  );
}

export async function login(email: string, password: string) {
  return request<{ ok: true; user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(fullName: string, email: string, password: string) {
  return request<{ ok: true; user: User }>("/api/users/register", {
    method: "POST",
    body: JSON.stringify({ fullName, email, password }),
  });
}

export async function fetchDashboard(userId: string) {
  return request<{ ok: true } & DashboardResponse>(`/api/users/${userId}/dashboard`);
}

export async function fetchProfile(userId: string) {
  return request<{ ok: true } & ProfileResponse>(`/api/users/${userId}/profile`);
}

export async function updateProfile(userId: string, payload: Record<string, unknown>) {
  return request<{ ok: true } & ProfileResponse>(`/api/users/${userId}/profile`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchNotifications(userId: string) {
  return request<{ ok: true; notifications: NotificationItem[] }>(
    `/api/users/${userId}/notifications`,
  );
}

export async function markNotificationRead(notificationId: string) {
  return request<{ ok: true; notification: NotificationItem }>(
    `/api/notifications/${notificationId}/read`,
    { method: "PATCH" },
  );
}

export async function previewAdvice(userId: string) {
  return request<{
    ok: true;
    advice: { severity: string; title: string; body: string };
    location: { name: string; aqi: number | null } | null;
  }>("/api/advice/preview", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function fetchLocations() {
  return request<{
    ok: true;
    locations: Array<{
      id: string;
      name: string;
      location_type: string;
      address: string | null;
      city: string | null;
      district: string | null;
      lat: number;
      lng: number;
    }>;
  }>("/api/locations");
}

export async function createRouteRequest(payload: {
  userId: string;
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
  return request<{
    ok: true;
    request: Record<string, unknown>;
    options: Array<Record<string, unknown>>;
  }>("/api/route-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchRouteHistory(userId: string) {
  return request<{ ok: true; routeRequests: Array<Record<string, unknown>> }>(
    `/api/users/${userId}/route-requests`,
  );
}

export async function fetchIqAirAqiByCoordinates(lat: number, lng: number) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });

  return request<{ ok: true; measurement: GpsAqiMeasurement }>(`/api/aqi/iqair?${params.toString()}`);
}

export async function searchPlaces(query: string, limit = 6) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  return request<{ ok: true; places: PlaceSuggestion[] }>(`/api/maps/search?${params.toString()}`);
}

export async function planRoutes(payload: {
  origin: {
    label: string;
    lat: number;
    lng: number;
  };
  destination: {
    label: string;
    lat: number;
    lng: number;
  };
  maxRatio: number;
}) {
  return request<{ ok: true } & PlannedRoutesResponse>("/api/maps/plan-routes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchChatSessions(userId: string) {
  const params = new URLSearchParams({ userId });
  return request<{ ok: true; sessions: ChatSession[] }>(`/api/chat/sessions?${params.toString()}`);
}

export async function fetchChatMessages(sessionId: string) {
  return request<{ ok: true; session: ChatSession; messages: ChatMessage[] }>(
    `/api/chat/sessions/${sessionId}/messages`,
  );
}

export async function sendChatMessage(payload: {
  userId: string;
  sessionId?: string | null;
  message: string;
}) {
  return request<{
    ok: true;
    session: ChatSession;
    reply: {
      role: "assistant";
      content: string;
      provider: string;
      model: string;
      toolEvents: Array<Record<string, unknown>>;
    };
    messages: ChatMessage[];
  }>("/api/chat/message", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
