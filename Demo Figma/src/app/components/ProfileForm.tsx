import { Heart, Activity, Bell, Check } from "lucide-react";

export function ProfileForm({
  conditions,
  setConditions,
  activity,
  setActivity,
  threshold,
  setThreshold,
  availableConditions,
  availableActivities,
}: {
  conditions: string[];
  setConditions: (c: string[]) => void;
  activity: string;
  setActivity: (a: string) => void;
  threshold: number;
  setThreshold: (n: number) => void;
  availableConditions: string[];
  availableActivities: string[];
}) {
  const toggle = (c: string) => {
    setConditions(conditions.includes(c) ? conditions.filter((x) => x !== c) : [...conditions, c]);
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white">
          <Heart className="w-6 h-6" />
        </div>
        <div>
          <div className="text-slate-900">Há»“ sÆ¡ sá»©c khá»e</div>
          <div className="text-sm text-slate-500">GiÃºp chÃºng tÃ´i Ä‘Æ°a ra gá»£i Ã½ phÃ¹ há»£p nháº¥t cho báº¡n</div>
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm text-slate-700 mb-3">
          <Heart className="w-4 h-4 text-rose-500" /> TÃ¬nh tráº¡ng sá»©c khá»e
        </label>
        <div className="flex flex-wrap gap-2">
          {availableConditions.map((c) => {
            const on = conditions.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggle(c)}
                className={`px-3.5 py-1.5 rounded-full text-sm ring-1 transition-all flex items-center gap-1.5 ${
                  on
                    ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white ring-transparent shadow-md"
                    : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                {on && <Check className="w-3.5 h-3.5" />}
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm text-slate-700 mb-3">
          <Activity className="w-4 h-4 text-emerald-500" /> Hoáº¡t Ä‘á»™ng thÆ°á»ng xuyÃªn
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {availableActivities.map((a) => {
            const on = activity === a;
            return (
              <button
                key={a}
                onClick={() => setActivity(a)}
                className={`px-3 py-2.5 rounded-xl text-sm ring-1 transition-all ${
                  on
                    ? "bg-gradient-to-br from-blue-50 to-emerald-50 text-blue-700 ring-blue-300"
                    : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-slate-700 mb-3">
          <Bell className="w-4 h-4 text-orange-500" /> NgÆ°á»¡ng cáº£nh bÃ¡o AQI
        </label>
        <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-emerald-50 rounded-2xl p-4 ring-1 ring-slate-200">
          <div className="flex items-end justify-between mb-2">
            <span className="text-4xl bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">{threshold}</span>
            <span className="text-xs text-slate-500">
              Gá»­i thÃ´ng bÃ¡o khi AQI vÆ°á»£t {threshold}
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={200}
            step={10}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>50 Â· Tá»‘t</span>
            <span>100 Â· TB</span>
            <span>150 Â· Xáº¥u</span>
            <span>200 Â· Nguy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
