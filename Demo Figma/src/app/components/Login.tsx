import { useState } from "react";
import { Wind, Mail, Lock, Eye, EyeOff, ArrowRight, Leaf, ShieldCheck, Activity } from "lucide-react";

export function Login({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden bg-gradient-to-br from-blue-700 via-sky-600 to-emerald-500">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute top-1/3 right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
            <Wind className="w-6 h-6" />
          </div>
          <div>
            <div className="tracking-tight text-lg">AirPath VN</div>
            <div className="text-sm text-white/80">Hít thở trong lành mỗi ngày</div>
          </div>
        </div>

        <div className="relative">
          <div className="text-4xl leading-tight tracking-tight mb-4">
            Mỗi hơi thở <br />
            là một lựa chọn <br />
            <span className="bg-gradient-to-r from-emerald-200 to-white bg-clip-text text-transparent">
              thông minh hơn.
            </span>
          </div>
          <p className="text-white/80 max-w-md leading-relaxed">
            Tìm lộ trình ít ô nhiễm nhất, nhận cảnh báo AQI cá nhân hóa và khám phá những địa điểm tập luyện an toàn gần bạn.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { icon: Leaf, label: "Lộ trình xanh", value: "3.2k+" },
              { icon: ShieldCheck, label: "Cảnh báo / ngày", value: "24h" },
              { icon: Activity, label: "Người dùng", value: "12k+" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-3 ring-1 ring-white/20">
                <s.icon className="w-4 h-4 mb-2 opacity-80" />
                <div className="text-lg">{s.value}</div>
                <div className="text-xs text-white/75">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/70">
          Dữ liệu AQI từ AQICN · IQAir · World Air Quality Project
        </div>
      </div>

      {/* Right — form */}
      <div className="relative flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-sky-50 via-white to-emerald-50">
        <div className="absolute top-6 right-6 lg:hidden flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center text-white">
            <Wind className="w-4 h-4" />
          </div>
          <div className="text-sm text-slate-800">AirPath VN</div>
        </div>

        <div className="w-full max-w-md">
          <div className="inline-flex items-center gap-1 bg-white ring-1 ring-slate-200 rounded-full p-1 mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                  mode === m ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow" : "text-slate-600"
                }`}
              >
                {m === "login" ? "Đăng nhập" : "Đăng ký"}
              </button>
            ))}
          </div>

          <div className="tracking-tight text-2xl text-slate-900">
            {mode === "login" ? "Chào mừng trở lại 👋" : "Tạo tài khoản mới"}
          </div>
          <div className="text-sm text-slate-500 mt-1 mb-7">
            {mode === "login"
              ? "Đăng nhập để xem lộ trình và cảnh báo cá nhân hóa."
              : "Chỉ vài bước để bắt đầu theo dõi chất lượng không khí quanh bạn."}
          </div>

          <div className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="text-xs text-slate-500">Họ và tên</label>
                <div className="mt-1 flex items-center gap-2 bg-white rounded-xl px-3 py-3 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-blue-500">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn An"
                    className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-500">Email</label>
              <div className="mt-1 flex items-center gap-2 bg-white rounded-xl px-3 py-3 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-blue-500">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500">Mật khẩu</label>
              <div className="mt-1 flex items-center gap-2 bg-white rounded-xl px-3 py-3 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-blue-500">
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                />
                <button onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input type="checkbox" className="accent-blue-600" />
                  Ghi nhớ tôi
                </label>
                <button className="text-blue-600 hover:underline">Quên mật khẩu?</button>
              </div>
            )}
          </div>

          <button
            onClick={onLogin}
            className="mt-6 w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white rounded-xl py-3 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-xl transition-all"
          >
            {mode === "login" ? "Đăng nhập" : "Đăng ký"}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 my-5 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" />
            <span>HOẶC</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 bg-white ring-1 ring-slate-200 rounded-xl py-2.5 text-sm text-slate-700 hover:bg-slate-50">
              <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41.4 35.6 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 bg-white ring-1 ring-slate-200 rounded-xl py-2.5 text-sm text-slate-700 hover:bg-slate-50">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12a12 12 0 1 0-13.875 11.854v-8.385H7.077V12h3.048V9.356c0-3.008 1.792-4.669 4.533-4.669 1.313 0 2.686.235 2.686.235v2.953H15.83c-1.49 0-1.956.925-1.956 1.875V12h3.328l-.532 3.469h-2.796v8.385A12 12 0 0 0 24 12z"/></svg>
              Facebook
            </button>
          </div>

          <div className="text-center text-xs text-slate-500 mt-6">
            Bằng việc tiếp tục, bạn đồng ý với <span className="text-blue-600">Điều khoản</span> và <span className="text-blue-600">Chính sách bảo mật</span> của chúng tôi.
          </div>
        </div>
      </div>
    </div>
  );
}
