import { Bell, Clock3, Home, LogOut, Map, Search, Shield, User, Wind, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import "../styles/demo-shell.css";

export type AqiTone = "good" | "moderate" | "sensitive" | "bad" | "very-bad" | "unknown";

export type AqiAlertItem = {
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

export type Role = "guest" | "user" | "admin";
export type View =
  | "home"
  | "search"
  | "spot-detail"
  | "comments"
  | "route"
  | "alert"
  | "profile"
  | "dashboard"
  | "facilities"
  | "facility-add"
  | "moderation"
  | "admin-profile"
  | "reviews";

type NavItem = {
  id: View;
  label: string;
  icon: ReactNode;
};

type Props = {
  role: Role;
  view: View;
  setView: (view: View) => void;
  userName: string;
  aqiAlerts: AqiAlertItem[];
  aqiUnreadCount: number;
  onAqiBellClick: () => void;
  onOpenAqiDetail: () => void;
  onRequireLogin: () => void;
  onLogout?: () => void;
  children: ReactNode;
};

const guestNavItems: NavItem[] = [
  { id: "home", label: "Home", icon: <Home size={18} /> },
  { id: "search", label: "Search", icon: <Search size={18} /> },
  { id: "route", label: "Route", icon: <Map size={18} /> },
  { id: "profile", label: "Profile", icon: <User size={18} /> },
];

const userNavItems: NavItem[] = [
  { id: "home", label: "Home", icon: <Home size={18} /> },
  { id: "search", label: "Search", icon: <Search size={18} /> },
  { id: "route", label: "Route", icon: <Map size={18} /> },
  { id: "profile", label: "Profile", icon: <User size={18} /> },
];

const adminNavItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <Shield size={18} /> },
  { id: "facilities", label: "Facilities", icon: <Map size={18} /> },
  { id: "moderation", label: "Moderation", icon: <LogOut size={18} /> },
  { id: "profile", label: "Profile", icon: <User size={18} /> },
];

export function ShellDemo({
  role,
  view,
  setView,
  userName,
  aqiAlerts,
  aqiUnreadCount,
  onAqiBellClick,
  onOpenAqiDetail,
  onRequireLogin,
  onLogout,
  children,
}: Props) {
  const navItems = role === "admin" ? adminNavItems : role === "user" ? userNavItems : guestNavItems;
  const [isAqiPanelOpen, setIsAqiPanelOpen] = useState(false);
  const latestAlert = useMemo(() => aqiAlerts[0] ?? null, [aqiAlerts]);

  function handleNavigate(nextView: View) {
    // Auth-required views
    if (role === "guest" && ["route", "profile"].includes(nextView)) {
      onRequireLogin();
      return;
    }
    setView(nextView);
  }

  const logoClick = () => {
    setView("home");
  };

  const avatarClick = () => {
    if (role === "guest") {
      onRequireLogin();
    } else {
      setView("profile");
    }
  };

  const openAqiPanel = () => {
    setIsAqiPanelOpen((current) => !current);
    onAqiBellClick();
  };

  return (
    <div className="demo-shell">
      {/* Header */}
      <header className="app-header-demo">
        <div className="logo-area-demo" onClick={logoClick}>
          <Wind className="logo-icon" />
          <span className="logo-text">SafeMove HaNoi</span>
        </div>
        <div className="header-actions-demo">
          <button className="aqi-bell-btn-demo" onClick={openAqiPanel} title="Thông báo AQI" aria-label="Thông báo AQI">
            <Bell size={18} />
            {aqiUnreadCount > 0 && <span className="aqi-bell-badge-demo">{aqiUnreadCount > 9 ? "9+" : aqiUnreadCount}</span>}
          </button>
          <button className="avatar-btn-demo" onClick={avatarClick} title={userName} aria-label="Mở hồ sơ người dùng">
            {role === "guest" ? <User size={18} /> : <span className="avatar-letter">{userName.charAt(0).toUpperCase()}</span>}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`main-content-demo ${view === "route" ? "route-main-content-demo" : ""}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav-demo">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item-demo ${view === item.id ? "active" : ""}`}
            onClick={() => handleNavigate(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label-demo">{item.label}</span>
          </button>
        ))}
      </nav>

      {isAqiPanelOpen && (
        <div className="aqi-popover-layer-demo" role="presentation" onClick={() => setIsAqiPanelOpen(false)}>
          <section
            className="aqi-popover-demo"
            role="dialog"
            aria-modal="false"
            aria-label="Thông báo AQI"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="aqi-popover-header-demo">
              <div>
                <div className="aqi-panel-kicker-demo">Thông báo AQI</div>
                <h2>Cập nhật gần đây</h2>
              </div>
              <button className="aqi-panel-close-demo" onClick={() => setIsAqiPanelOpen(false)} aria-label="Đóng">
                <X size={18} />
              </button>
            </header>

            <div className="aqi-alert-list-demo">
              {aqiAlerts.length > 0 ? (
                aqiAlerts.map((alert) => (
                  <article key={alert.id} className={`aqi-alert-item-demo aqi-tone-${alert.tone}`}>
                    <div className="aqi-alert-topline-demo">
                      <span className="aqi-alert-title-demo">{alert.title}</span>
                      <span className="aqi-alert-time-demo">
                        <Clock3 size={14} />
                        {new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="aqi-alert-body-demo">{alert.body}</p>
                    {alert.deltaText && <p className="aqi-alert-delta-demo">{alert.deltaText}</p>}
                  </article>
                ))
              ) : (
                <div className="aqi-alert-empty-demo">
                  Chưa có cảnh báo mới. Khi AQI đổi sang khoảng khác, thẻ mới sẽ xuất hiện ở đây, tối đa 5 thẻ gần nhất.
                </div>
              )}
            </div>

          </section>
        </div>
      )}
    </div>
  );
}
