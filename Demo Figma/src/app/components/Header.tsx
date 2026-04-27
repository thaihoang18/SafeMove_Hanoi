import { useState, useRef, useEffect } from "react";
import { Wind, Bell, User, LogOut, Settings, UserCircle, ChevronRight } from "lucide-react";
import { NotifPopup } from "./NotifPopup";

type View = "home" | "route" | "profile" | "alerts" | "notifications";

export function Header({ setView, aqi, onLogout }: { view: View; setView: (v: View) => void; aqi: number; onLogout: () => void }) {
  const [openBell, setOpenBell] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setOpenBell(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setOpenUser(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const aqiColor = aqi <= 50 ? "bg-emerald-400" : aqi <= 100 ? "bg-sky-300" : aqi <= 150 ? "bg-orange-400" : "bg-red-500";

  return (
    <header className="sticky top-0 z-40 backdrop-blur-lg bg-gradient-to-r from-blue-600/95 via-sky-500/95 to-emerald-500/95 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center ring-1 ring-white/30 shrink-0">
            <Wind className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="tracking-tight">AirPath VN</div>
            <div className="text-xs text-white/80 hidden sm:block">Hít thở trong lành mỗi ngày</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-3 py-1.5 ring-1 ring-white/20">
            <span className={`w-2 h-2 rounded-full ${aqiColor} animate-pulse`} />
            <span className="text-sm">AQI {aqi}</span>
          </div>

          {/* Bell - popup */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => { setOpenBell(!openBell); setOpenUser(false); }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ring-1 ring-white/20 relative transition-colors shrink-0 ${
                openBell ? "bg-white text-blue-600" : "bg-white/15 hover:bg-white/25"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-300 rounded-full ring-2 ring-blue-600/40" />
            </button>

            {openBell && (
              <div className="absolute right-0 top-full mt-2 w-[min(92vw,380px)] bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 text-slate-900 z-50 overflow-hidden">
                <NotifPopup
                  onOpenCenter={() => {
                    setView("notifications");
                    setOpenBell(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* User - dropdown */}
          <div ref={userRef} className="relative">
            <button
              onClick={() => { setOpenUser(!openUser); setOpenBell(false); }}
              className={`w-10 h-10 rounded-full flex items-center justify-center ring-1 ring-white/20 transition-colors ${
                openUser ? "bg-white text-blue-600" : "bg-white/15 hover:bg-white/25"
              }`}
            >
              <User className="w-4 h-4" />
            </button>

            {openUser && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 text-slate-900 z-50 overflow-hidden">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center text-white">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-900">Nguyễn Minh An</div>
                    <div className="text-xs text-slate-500 truncate">an.nguyen@airpath.vn</div>
                  </div>
                </div>
                <div className="p-1.5">
                  <MenuItem icon={UserCircle} label="Hồ sơ sức khỏe" onClick={() => { setView("profile"); setOpenUser(false); }} />
                  <MenuItem icon={Settings} label="Cài đặt & ngưỡng AQI" onClick={() => { setView("profile"); setOpenUser(false); }} />
                </div>
                <div className="p-1.5 border-t border-slate-100">
                  <MenuItem icon={LogOut} label="Đăng xuất" danger onClick={onLogout} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: any; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
        danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight className="w-4 h-4 opacity-40" />
    </button>
  );
}
