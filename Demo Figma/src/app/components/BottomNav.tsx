import { Home, Route, Info } from "lucide-react";

type View = "home" | "route" | "profile" | "alerts" | "notifications";

const items: { id: View; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Trang chủ", icon: Home },
  { id: "route", label: "Lộ trình", icon: Route },
  { id: "alerts", label: "Lưu ý", icon: Info },
];

export function BottomNav({ view, setView }: { view: View; setView: (v: View) => void }) {
  return (
    <div className="sticky bottom-0 z-30 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] px-3 bg-gradient-to-t from-white via-white to-white/0">
      <nav className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl ring-1 ring-slate-200 p-1.5 flex items-center gap-1">
        {items.map((it) => {
          const active = view === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setView(it.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-2xl transition-all ${
                active
                  ? "bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-md shadow-blue-600/20"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <it.icon className="w-5 h-5" />
              <span className="text-[11px]">{it.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
