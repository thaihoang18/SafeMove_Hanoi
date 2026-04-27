import { Bell, Home, LogOut, Route, Settings2, Wind } from "lucide-react";
import type { ReactNode } from "react";

export type View = "home" | "route" | "profile" | "notifications";

type Props = {
  view: View;
  setView: (view: View) => void;
  userName: string;
  unreadCount: number;
  onLogout: () => void;
  children: ReactNode;
};

const navItems: Array<{ id: View; label: string; icon: typeof Home }> = [
  { id: "home", label: "Tổng quan", icon: Home },
  { id: "route", label: "Lộ trình", icon: Route },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "profile", label: "Hồ sơ", icon: Settings2 },
];

export function Shell({ view, setView, userName, unreadCount, onLogout, children }: Props) {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-emerald-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-emerald-500 text-white shadow">
              <Wind className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-slate-500">AirPath</div>
              <div className="text-base text-slate-900">{userName}</div>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`rounded-full px-4 py-2 text-sm transition-all ${
                  view === item.id
                    ? "bg-linear-to-r from-blue-600 to-emerald-500 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("notifications")}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] text-white">
                  {Math.min(unreadCount, 9)}
                </span>
              ) : null}
            </button>
            <button
              onClick={onLogout}
              className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center gap-1 py-3 text-xs ${
                view === item.id ? "text-blue-600" : "text-slate-500"
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
