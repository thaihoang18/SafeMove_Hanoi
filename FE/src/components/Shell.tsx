import { Building2, Home, Map, Search, Settings2, UserCircle2, Wind } from "lucide-react";
import type { ReactNode } from "react";

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
  | "admin-profile";

type Props = {
  role: Role;
  view: View;
  setView: (view: View) => void;
  userName: string;
  unreadCount: number;
  onRequireLogin: () => void;
  children: ReactNode;
};

const guestNavItems: Array<{ id: View; label: string; icon: typeof Home }> = [
  { id: "home", label: "Trang chủ", icon: Home },
  { id: "search", label: "Tìm kiếm", icon: Search },
  { id: "route", label: "Lộ trình", icon: Map },
  { id: "profile", label: "Hồ sơ", icon: Settings2 },
];

const adminNavItems: Array<{ id: View; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "facilities", label: "Cơ sở", icon: Building2 },
  { id: "admin-profile", label: "Hồ sơ", icon: Settings2 },
];

export function Shell({
  role,
  view,
  setView,
  userName,
  unreadCount,
  onRequireLogin,
  children,
}: Props) {
  const navItems = role === "admin" ? adminNavItems : guestNavItems;
  const avatarLabel = userName.trim().charAt(0).toUpperCase() || "S";

  function handleNavigate(nextView: View) {
    if (role === "guest" && ["route", "profile", "alert"].includes(nextView)) {
      onRequireLogin();
      return;
    }

    setView(nextView);
  }

  return (
    <div className="min-h-screen bg-[#edf1ec] pb-28">
      <header className="mx-auto w-full max-w-107.5 px-4 pt-4">
        <div className="flex items-center justify-between rounded-[1.6rem] bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-600 to-emerald-400 text-white shadow-sm">
              <Wind className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-emerald-700">SafeMove HaNoi</div>
              <div className="text-xs text-slate-500">AQI route and health companion</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => (role === "guest" ? onRequireLogin() : setView("profile"))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200"
              aria-label="Open profile"
            >
              {role === "guest" ? <UserCircle2 className="h-5 w-5" /> : avatarLabel}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-107.5 px-4 py-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 bg-transparent px-4 pb-4">
        <div className={`mx-auto grid max-w-107.5 gap-2 rounded-[1.6rem] bg-white p-2 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/70 ${navItems.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex flex-col items-center gap-1 rounded-[1.15rem] py-2 text-[11px] ${
                view === item.id ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "text-slate-500"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
