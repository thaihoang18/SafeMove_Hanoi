import { useState, type ReactNode } from "react";
import { Activity, ArrowRight, Eye, EyeOff, Leaf, Lock, Mail, ShieldCheck, Wind } from "lucide-react";

type Props = {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (fullName: string, email: string, password: string) => Promise<void>;
  error: string | null;
  loading: boolean;
};

export function LoginScreen({ onLogin, onRegister, error, loading }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit() {
    if (mode === "login") {
      await onLogin(email, password);
      return;
    }

    await onRegister(fullName, email, password);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="relative hidden overflow-hidden bg-linear-to-br from-blue-700 via-sky-600 to-emerald-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-16 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-28 -left-12 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
            <Wind className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg">AirPath</div>
            <div className="text-sm text-white/80">AQI route and health companion</div>
          </div>
        </div>

        <div className="relative">
          <h1 className="max-w-lg text-5xl leading-tight text-white">
            Mỗi hành trình ngoài trời nên đi cùng dữ liệu không khí thật.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/85">
            Tìm lộ trình ít ô nhiễm hơn, theo dõi cảnh báo cá nhân hóa, và quyết định
            vận động ngoài trời dựa trên hồ sơ sức khỏe của bạn.
          </p>
          <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
            {[
              { icon: Leaf, value: "AQI", label: "Route score" },
              { icon: ShieldCheck, value: "Alert", label: "Personalized" },
              { icon: Activity, value: "Daily", label: "Activity advice" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur"
              >
                <item.icon className="mb-2 h-4 w-4 opacity-80" />
                <div className="text-lg">{item.value}</div>
                <div className="text-xs text-white/75">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/70">
          Built for the AirPath AQI project workspace.
        </div>
      </div>

      <div className="flex items-center justify-center bg-linear-to-br from-sky-50 via-white to-emerald-50 p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6 inline-flex gap-1 rounded-full bg-white p-1 ring-1 ring-slate-200">
            {(["login", "signup"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setMode(item)}
                className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                  mode === item
                    ? "bg-linear-to-r from-blue-600 to-emerald-500 text-white shadow"
                    : "text-slate-600"
                }`}
              >
                {item === "login" ? "Đăng nhập" : "Đăng ký"}
              </button>
            ))}
          </div>

          <h2 className="text-2xl text-slate-900">
            {mode === "login" ? "Đăng nhập vào AirPath" : "Tạo tài khoản mới"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "login"
              ? "Kết nối tới backend hiện tại để lấy route, AQI và profile."
              : "Tạo user mới trực tiếp qua API backend bạn đã dựng."}
          </p>

          <div className="mt-7 space-y-3">
            {mode === "signup" && (
              <Field label="Họ và tên">
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nguyen Van A"
                  className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </Field>
            )}

            <Field label="Email" icon={<Mail className="h-4 w-4 text-slate-400" />}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@example.com"
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </Field>

            <Field label="Mật khẩu" icon={<Lock className="h-4 w-4 text-slate-400" />}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>
          </div>

          {error ? <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-emerald-500 py-3 text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      <div className="mt-1 flex items-center gap-2 rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-blue-500">
        {icon}
        {children}
      </div>
    </div>
  );
}
