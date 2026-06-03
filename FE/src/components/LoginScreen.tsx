import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  UserCircle2,
  Wind,
} from "lucide-react";

type Props = {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (fullName: string, email: string, password: string) => Promise<void>;
  onGuestContinue: () => void;
  error: string | null;
  loading: boolean;
};

export function LoginScreen({ onLogin, onRegister, onGuestContinue, error, loading }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    setFormError(null);

    if (mode === "login") {
      if (!email.trim()) {
        setFormError("メールアドレスまたはユーザー名を入力してください。");
        return;
      }

      if (!password.trim()) {
        setFormError("パスワードを入力してください。");
        return;
      }

      const identifier = email.trim();
      const looksLikeEmail = identifier.includes("@");
      if (looksLikeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        setFormError("有効なメールアドレスまたはユーザー名を入力してください。");
        return;
      }

      await onLogin(email, password);
      return;
    }

    // Signup validations
    if (!fullName.trim()) {
      setFormError("氏名を入力してください。");
      return;
    }

    if (!email.trim()) {
      setFormError("メールアドレスを入力してください。");
      return;
    }

    if (!password.trim()) {
      setFormError("パスワードを入力してください。");
      return;
    }

    await onRegister(fullName, email, password);
  }

  return (
    <div className="min-h-screen bg-[#edf1ec] px-4 py-6">
      <div className="mx-auto w-full max-w-107.5">
        <div className="mb-4 flex items-center gap-3 rounded-[1.6rem] bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-600 to-emerald-400 text-white">
            <Wind className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-emerald-700">SafeMove Hanoi</div>
            <div className="text-xs text-slate-500">AQIルート案内と健康アシスタント</div>
          </div>
        </div>

        <div className="rounded-4xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
          <button
            onClick={onGuestContinue}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f0f7f1] px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200"
          >
            <UserCircle2 className="h-4 w-4" />
            ゲストとして利用
          </button>

          <div className="mb-5 inline-flex w-full gap-1 rounded-full bg-[#f4f6f2] p-1 ring-1 ring-slate-200">
            {(["login", "signup"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setMode(item)}
                className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                  mode === item
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-600"
                }`}
              >
                {item === "login" ? "ログイン" : "新規登録"}
              </button>
            ))}
          </div>

          <h2 className="text-3xl text-slate-900">
            {mode === "login" ? "SafeMove Hanoi にログイン" : "アカウントを作成"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {mode === "login"
              ? "ログインして AQI とグリーンルートの追跡を続けましょう。"
              : "新しいアカウントを作成して、健康アラートを最適化しましょう。"}
          </p>

          <div className="mt-7 space-y-3">
            {mode === "signup" && (
              <Field label="氏名">
                <input
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setFormError(null);
                  }}
                  placeholder="山田 太郎"
                  className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </Field>
            )}

            <Field label="メールアドレス" icon={<Mail className="h-4 w-4 text-slate-400" />}>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFormError(null);
                }}
                placeholder="email@example.com"
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </Field>

            <Field label="パスワード" icon={<Lock className="h-4 w-4 text-slate-400" />}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFormError(null);
                }}
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

            {mode === "login" ? <button className="text-xs text-emerald-700">パスワードをお忘れですか？</button> : null}
          </div>

          {(formError || error) ? (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError || error}</div>
          ) : null}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "処理中..." : mode === "login" ? "ログイン" : "新規登録"}
            <ArrowRight className="h-4 w-4" />
          </button>

          {mode === "signup" ? (
            <>
              <div className="my-4 text-center text-xs text-slate-400">または次の方法で登録</div>
              <div className="flex justify-center gap-3">
                <button className="rounded-xl bg-slate-100 p-3 ring-1 ring-slate-200">
                  <Mail className="h-4 w-4 text-slate-600" />
                </button>
                <button className="rounded-xl bg-slate-100 p-3 ring-1 ring-slate-200">
                  <ShieldCheck className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </>
          ) : null}
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
      <div className="mt-1 flex items-center gap-2 rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-emerald-500">
        {icon}
        {children}
      </div>
    </div>
  );
}
