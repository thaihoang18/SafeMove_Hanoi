import { ArrowRight, Lock, Mail, Wind, X } from "lucide-react";
import { useState } from "react";
import "../styles/demo-auth.css";

type Props = {
  onUserLogin: (email: string, password: string) => Promise<void>;
  onAdminLogin: (email: string, password: string) => Promise<void>;
  onRegisterClick: () => void;
  onGuestContinue: () => void;
  onForgotPassword: (email: string) => Promise<string>;
  isLoading?: boolean;
  error?: string;
};

type LoginMode = "user" | "admin";

export function LoginScreenDemo({
  onUserLogin,
  onAdminLogin,
  onRegisterClick,
  onGuestContinue,
  onForgotPassword,
  isLoading = false,
  error,
}: Props) {
  const [mode, setMode] = useState<LoginMode>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(error || null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotSending, setForgotSending] = useState(false);

  const isAdminMode = mode === "admin";
  const displayMode = isAdminMode ? "管理者" : "一般ユーザー";

  function switchMode(nextMode: LoginMode) {
    setMode(nextMode);
    setFormError(null);
  }

  function openForgotPasswordModal() {
    setForgotEmail(email.trim());
    setForgotError(null);
    setForgotMessage(null);
    setForgotPasswordOpen(true);
  }

  function closeForgotPasswordModal() {
    setForgotPasswordOpen(false);
    setForgotError(null);
    setForgotMessage(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

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

    try {
      if (isAdminMode) {
        await onAdminLogin(email, password);
        return;
      }

      await onUserLogin(email, password);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "ログインに失敗しました。");
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);

    if (!forgotEmail.trim()) {
      setForgotError("登録済みのメールアドレスを入力してください。");
      return;
    }

    const normalizedEmail = forgotEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setForgotError("有効なメールアドレスを入力してください。");
      return;
    }

    setForgotSending(true);
    try {
      const message = await onForgotPassword(normalizedEmail);
      setForgotMessage(message);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : "新しいパスワードを送信できませんでした。");
    } finally {
      setForgotSending(false);
    }
  };

  return (
    <div className="demo-auth-container login-page">
      {/* Header */}
      <div className="auth-header">
        <div className="logo-area-auth">
          <Wind size={20} className="logo-icon-auth" />
          <span className="logo-text-auth">SafeMove ハノイ</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="auth-scrollable-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1 className="main-greeting">おかえりなさい</h1>
          <p className="sub-greeting">あなたのヘルスジャーニーを続けましょう</p>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          <h2 className="form-title">{displayMode}としてログイン</h2>

          <div className="auth-mode-switcher" role="tablist" aria-label="ログインモード">
            <button
              type="button"
              className={`auth-mode-btn ${mode === "user" ? "active" : ""}`}
              onClick={() => switchMode("user")}
            >
              一般ユーザー
            </button>
            <button
              type="button"
              className={`auth-mode-btn ${mode === "admin" ? "active" : ""}`}
              onClick={() => switchMode("admin")}
            >
              管理者
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email / Username Input */}
            <div className="input-group-auth">
              <label className="input-label-auth">メールアドレス / ユーザー名</label>
              <div className="input-icon-wrapper-auth">
                <Mail size={16} className="input-icon-auth" />
                <input
                  type="text"
                  className="auth-input"
                  placeholder={isAdminMode ? "admin または you@example.com" : "メールアドレスを入力"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="input-group-auth">
              <div className="label-row-auth">
                <label className="input-label-auth">パスワード</label>
                <button type="button" className="forgot-pwd-link" onClick={openForgotPasswordModal}>
                  パスワードをお忘れですか？
                </button>
              </div>
              <div className="input-icon-wrapper-auth">
                <Lock size={16} className="input-icon-auth" />
                <input
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            {formError && <div className="error-text-auth">{formError}</div>}

            {/* Submit Button */}
            <button type="submit" className="btn-primary-auth" disabled={isLoading}>
              {isLoading ? "ログイン中..." : `${displayMode}としてログイン`}
              <ArrowRight size={16} className="btn-icon-auth" />
            </button>
          </form>

          {/* Guest continue + Register Prompt */}
          <div className="register-prompt">
            <button onClick={onGuestContinue} className="btn-secondary-auth" type="button">
              ゲストとして続行
            </button>
          </div>

          <div className="register-prompt">
            <span className="prompt-text">アカウントをお持ちでないですか？</span>
            <button onClick={onRegisterClick} className="register-link-btn" type="button">
              今すぐ登録
            </button>
          </div>
        </div>
      </main>

      {forgotPasswordOpen && (
        <div className="forgot-modal-backdrop" role="presentation" onClick={closeForgotPasswordModal}>
          <div
            className="forgot-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="forgot-modal-header">
              <div>
                <h3 id="forgot-modal-title">パスワード再設定</h3>
                <p>登録済みのメールアドレスを入力すると、新しいパスワードを受け取れます。</p>
              </div>
              <button type="button" className="forgot-modal-close" onClick={closeForgotPasswordModal} aria-label="閉じる">
                <X size={16} />
              </button>
            </div>

            <form className="forgot-modal-form" onSubmit={handleForgotPasswordSubmit}>
              <div className="input-group-auth">
                <label className="input-label-auth" htmlFor="forgot-email-input">
                  登録済みメールアドレス
                </label>
                <div className="input-icon-wrapper-auth">
                  <Mail size={16} className="input-icon-auth" />
                  <input
                    id="forgot-email-input"
                    type="email"
                    className="auth-input"
                    placeholder="email@example.com"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    disabled={forgotSending || isLoading}
                    autoFocus
                  />
                </div>
              </div>

              {forgotError ? <div className="error-text-auth">{forgotError}</div> : null}
              {forgotMessage ? <div className="success-text-auth">{forgotMessage}</div> : null}

              <div className="forgot-modal-actions">
                <button type="button" className="btn-secondary-auth" onClick={closeForgotPasswordModal} disabled={forgotSending}>
                  キャンセル
                </button>
                <button type="submit" className="btn-primary-auth" disabled={forgotSending || isLoading}>
                  {forgotSending ? "送信中..." : "新しいパスワードを送信"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
