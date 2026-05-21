import { Home, Search, Map, User, Wind, LogOut, Shield } from "lucide-react";
import type { ReactNode } from "react";
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
  onLogout,
  children,
}: Props) {
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

  return (
    <div className="demo-shell">
      {/* Header */}
      <header className="app-header-demo">
        <div className="logo-area-demo" onClick={logoClick}>
          <Wind className="logo-icon" />
          <span className="logo-text">SafeMove HaNoi</span>
        </div>
        <button className="avatar-btn-demo" onClick={avatarClick} title={userName}>
          {role === "guest" ? <User size={18} /> : <span className="avatar-letter">{userName.charAt(0).toUpperCase()}</span>}
        </button>
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
    </div>
  );
}
