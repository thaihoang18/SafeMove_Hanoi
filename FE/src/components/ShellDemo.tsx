import { Bell, Home, Search, Map, User, Wind, LogOut, Shield } from "lucide-react";
import { useState, type ReactNode } from "react";
import "../styles/demo-shell.css";

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
  onRequireLogin: () => void;
  aqiAlerts: Array<{
    id: string;
    title: string;
    body: string;
    tone: string;
    toneLabel: string;
    aqi: number | null;
    location: string;
    createdAt: string;
    deltaText: string | null;
  }>;
  aqiUnreadCount: number;
  onAqiBellClick: () => void;
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
  onRequireLogin,
  aqiAlerts,
  aqiUnreadCount,
  onAqiBellClick,
  onLogout,
  children,
}: Props) {
  void onLogout;
  const [showAqiPopover, setShowAqiPopover] = useState(false);
  const navItems = role === "admin" ? adminNavItems : role === "user" ? userNavItems : guestNavItems;

  function handleNavigate(nextView: View) {
    // Auth-required views
    if (role === "guest" && ["route", "profile", "alert"].includes(nextView)) {
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

  const handleBellClick = () => {
    setShowAqiPopover((current) => !current);
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
          <button className="aqi-bell-btn-demo" onClick={handleBellClick} aria-label="AQI notifications">
            <Bell size={18} />
            {aqiUnreadCount > 0 && <span className="aqi-badge-demo">{aqiUnreadCount > 9 ? "9+" : aqiUnreadCount}</span>}
          </button>
          <button className="avatar-btn-demo" onClick={avatarClick} title={userName}>
            {role === "guest" ? <User size={18} /> : <span className="avatar-letter">{userName.charAt(0).toUpperCase()}</span>}
          </button>
        </div>
      </header>

      {showAqiPopover && (
        <div className="aqi-popover-layer-demo" onClick={() => setShowAqiPopover(false)}>
          <div className="aqi-popover-demo" onClick={(event) => event.stopPropagation()}>
            <div className="aqi-popover-header-demo">
              <div>
                <div className="aqi-popover-title-demo">Thông báo</div>
                <div className="aqi-popover-subtitle-demo"></div>
              </div>
              <button className="aqi-popover-close-demo" onClick={() => setShowAqiPopover(false)}>
                ×
              </button>
            </div>

            <div className="aqi-popover-feed-demo">
              {aqiAlerts.length === 0 ? (
                <div className="aqi-popover-empty-demo">Chưa có cảnh báo mới từ AQI.</div>
              ) : (
                aqiAlerts.map((alert) => (
                  <article key={alert.id} className={`aqi-alert-item-demo tone-${alert.tone}`}>
                    <div className="aqi-alert-item-top-demo">
                      <strong>{alert.title}</strong>
                      {alert.toneLabel ? <span>{alert.toneLabel}</span> : <span className="aqi-alert-item-spacer-demo" />}
                    </div>
                    <div className="aqi-alert-item-body-demo">{alert.body}</div>
                    <div className="aqi-alert-item-meta-demo">
                      {alert.aqi !== null ? <span>AQI {alert.aqi}</span> : <span></span>}
                      <span>{alert.location}</span>
                    </div>
                    {alert.deltaText && <div className="aqi-alert-item-delta-demo">{alert.deltaText}</div>}
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
