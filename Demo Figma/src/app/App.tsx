import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { AQICard } from "./components/AQICard";
import { AQIChart } from "./components/AQIChart";
import { PersonalAdvice } from "./components/PersonalAdvice";
import { RealisticMap } from "./components/RealisticMap";
import { ProfileForm } from "./components/ProfileForm";
import { AlertsPanel } from "./components/AlertsPanel";
import { Login } from "./components/Login";
import { BottomNav } from "./components/BottomNav";
import { Notifications } from "./components/Notifications";
import { Leaf, Route, Info, Bell } from "lucide-react";
import { fetchBootstrapData } from "./lib/api";

type View =
  | "home"
  | "route"
  | "profile"
  | "alerts"
  | "notifications";

const fallbackConditions = [
  "Hen suyá»…n",
  "ViÃªm phá»•i",
  "Tim máº¡ch",
  "Dá»‹ á»©ng",
  "Phá»¥ ná»¯ mang thai",
  "NgÆ°á»i cao tuá»•i",
];

const fallbackActivities = [
  "Cháº¡y bá»™",
  "Äáº¡p xe",
  "Äi bá»™",
  "Yoga ngoÃ i trá»i",
  "Gym",
];

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState<View>("home");
  const [conditions, setConditions] = useState<string[]>(["Hen suyá»…n"]);
  const [activity, setActivity] = useState("Cháº¡y bá»™");
  const [threshold, setThreshold] = useState(140);
  const [availableConditions, setAvailableConditions] = useState(fallbackConditions);
  const [availableActivities, setAvailableActivities] = useState(fallbackActivities);
  const [dbMessage, setDbMessage] = useState(
    "ChÆ°a load dá»¯ liá»‡u tá»« Neon. App sáº½ dÃ¹ng fallback local náº¿u API chÆ°a cháº¡y.",
  );

  const currentAqi = 98;
  const location = "Quáº­n Hai BÃ  TrÆ°ng, HÃ  Ná»™i";

  useEffect(() => {
    let cancelled = false;

    fetchBootstrapData()
      .then((data) => {
        if (cancelled) return;

        const nextConditions = data.healthConditions.map((item) => item.name);
        const nextActivities = data.activities.map((item) => item.name);

        if (nextConditions.length > 0) {
          setAvailableConditions(nextConditions);
          setConditions((current) => {
            const filtered = current.filter((item) => nextConditions.includes(item));
            return filtered.length > 0 ? filtered : [nextConditions[0]];
          });
        }

        if (nextActivities.length > 0) {
          setAvailableActivities(nextActivities);
          setActivity((current) =>
            nextActivities.includes(current) ? current : nextActivities[0],
          );
        }

        setDbMessage("ÄÃ£ load activities vÃ  health conditions tá»« Neon.");
      })
      .catch(() => {
        if (!cancelled) {
          setDbMessage(
            "KhÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c Neon API. App Ä‘ang dÃ¹ng danh sÃ¡ch local fallback.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-sky-50 via-blue-50 to-pink-50">
      <Header
        view={view}
        setView={setView}
        aqi={currentAqi}
        onLogout={() => setAuthed(false)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 md:py-8 pb-28">
        {view === "home" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
              <div className="md:col-span-2">
                <AQICard aqi={currentAqi} location={location} />
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => setView("route")}
                  className="w-full text-left bg-white rounded-2xl p-5 ring-1 ring-slate-200/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white mb-3">
                    <Route className="w-5 h-5" />
                  </div>
                  <div className="text-slate-900">
                    TÃ¬m lá»™ trÃ¬nh xanh
                  </div>
                  <div className="text-sm text-slate-500 mt-1 leading-relaxed">
                    ÄÆ°á»ng Ä‘i Ã­t Ã´ nhiá»…m nháº¥t, khÃ´ng dÃ i quÃ¡ 1.5Ã—
                    so vá»›i Ä‘Æ°á»ng ngáº¯n nháº¥t.
                  </div>
                </button>

                <button
                  onClick={() => setView("alerts")}
                  className="w-full text-left bg-gradient-to-br from-blue-600 to-emerald-500 text-white rounded-2xl p-5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all relative overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/15 blur-2xl" />
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-3 ring-1 ring-white/30 relative">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="relative">LÆ°u Ã½ cho báº¡n</div>
                  <div className="text-sm opacity-90 mt-1 relative">
                    3 gá»£i Ã½ an toÃ n dÃ nh riÃªng cho khu vá»±c cá»§a
                    báº¡n hÃ´m nay.
                  </div>
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
              <AQIChart />
              <PersonalAdvice
                conditions={conditions}
                activity={activity}
              />
            </div>

            <div className="bg-white rounded-2xl p-4 ring-1 ring-slate-200/70 text-sm text-slate-600">
              {dbMessage}
            </div>

            <div className="bg-white rounded-3xl p-4 sm:p-6 ring-1 ring-slate-200/70 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-5 h-5 text-emerald-500" />
                <div className="text-slate-900">
                  Äá»‹a Ä‘iá»ƒm xanh gáº§n báº¡n
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {[
                  {
                    name: "CÃ´ng viÃªn Thá»‘ng Nháº¥t",
                    aqi: 62,
                    tag: "Gym ngoÃ i trá»i",
                  },
                  {
                    name: "Há»“ TÃ¢y - ÄÆ°á»ng ven há»“",
                    aqi: 71,
                    tag: "Cháº¡y bá»™",
                  },
                  {
                    name: "CÃ´ng viÃªn YÃªn Sá»Ÿ",
                    aqi: 58,
                    tag: "Äáº¡p xe",
                  },
                  {
                    name: "CÃ´ng viÃªn Cáº§u Giáº¥y",
                    aqi: 76,
                    tag: "Yoga",
                  },
                ].map((p) => (
                  <div
                    key={p.name}
                    className="rounded-2xl p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 ring-1 ring-emerald-100"
                  >
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl text-emerald-700">
                        {p.aqi}
                      </span>
                      <span className="text-xs text-emerald-600">
                        AQI
                      </span>
                    </div>
                    <div className="text-sm text-slate-900 mt-1">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {p.tag}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "route" && (
          <div>
            <div className="mb-5">
              <div className="text-slate-900">
                Lá»™ trÃ¬nh xanh
              </div>
              <div className="text-sm text-slate-500">
                Ãt Ã´ nhiá»…m Â· KhÃ´ng dÃ i hÆ¡n 1.5Ã— Ä‘Æ°á»ng ngáº¯n nháº¥t
              </div>
            </div>
            <RealisticMap />
          </div>
        )}

        {view === "alerts" && (
          <div>
            <div className="mb-5 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-slate-900">
                  LÆ°u Ã½ cho báº¡n
                </div>
                <div className="text-sm text-slate-500">
                  Gá»£i Ã½ an toÃ n dá»±a trÃªn ngÆ°á»¡ng AQI {threshold}{" "}
                  báº¡n Ä‘Ã£ cÃ i Ä‘áº·t
                </div>
              </div>
            </div>
            <AlertsPanel />
          </div>
        )}

        {view === "notifications" && (
          <div>
            <div className="mb-5 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-slate-900">
                  Trung tÃ¢m thÃ´ng bÃ¡o
                </div>
                <div className="text-sm text-slate-500">
                  PhÃ¢n loáº¡i, tÃ¬m kiáº¿m vÃ  quáº£n lÃ½ toÃ n bá»™ thÃ´ng
                  bÃ¡o cá»§a báº¡n
                </div>
              </div>
            </div>
            <Notifications />
          </div>
        )}

        {view === "profile" && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-5">
              <div className="text-slate-900">
                Há»“ sÆ¡ & CÃ i Ä‘áº·t
              </div>
              <div className="text-sm text-slate-500">
                CÃ¡ nhÃ¢n hÃ³a gá»£i Ã½ theo sá»©c khá»e vÃ  hoáº¡t Ä‘á»™ng cá»§a
                báº¡n
              </div>
            </div>
            <ProfileForm
              conditions={conditions}
              setConditions={setConditions}
              activity={activity}
              setActivity={setActivity}
              threshold={threshold}
              setThreshold={setThreshold}
              availableConditions={availableConditions}
              availableActivities={availableActivities}
            />
          </div>
        )}
      </main>

      <BottomNav view={view} setView={setView} />
    </div>
  );
}
