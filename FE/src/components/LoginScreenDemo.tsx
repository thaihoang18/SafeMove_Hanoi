import { ArrowRight, Lock, Mail, Wind } from "lucide-react";
import { useState } from "react";
import "../styles/demo-auth.css";

type Props = {
  onUserLogin: (email: string, password: string) => Promise<void>;
  onAdminLogin: (email: string, password: string, securityCode: string) => Promise<void>;
  onRegisterClick: () => void;
  onGuestContinue: () => void;
  isLoading?: boolean;
  error?: string;
};

type LoginMode = "user" | "admin";

export function LoginScreenDemo({
  onUserLogin,
  onAdminLogin,
  onRegisterClick,
  onGuestContinue,
  isLoading = false,
  error,
}: Props) {
  const [mode, setMode] = useState<LoginMode>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [formError, setFormError] = useState<string | null>(error || null);

  const isAdminMode = mode === "admin";
  const displayMode = isAdminMode ? "Quản trị viên" : "Người dùng";

  function switchMode(nextMode: LoginMode) {
    setMode(nextMode);
    setFormError(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError("Vui lòng nhập email hoặc tên đăng nhập");
      return;
    }

    if (!password.trim()) {
      setFormError("Vui lòng nhập mật khẩu");
      return;
    }

    const identifier = email.trim();
    const looksLikeEmail = identifier.includes("@");

    if (looksLikeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      setFormError("Vui lòng nhập email hoặc tên đăng nhập hợp lệ");
      return;
    }

    try {
      if (isAdminMode) {
        if (!securityCode.trim()) {
          setFormError("Vui lòng nhập mã bảo mật");
          return;
        }
        await onAdminLogin(email, password, securityCode);
        return;
      }

      await onUserLogin(email, password);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    }
  };

  return (
    <div className="demo-auth-container login-page">
      {/* Header */}
      <div className="auth-header">
        <div className="logo-area-auth">
          <Wind size={20} className="logo-icon-auth" />
          <span className="logo-text-auth">SafeMove Hà Nội</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="auth-scrollable-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1 className="main-greeting">Chào mừng trở lại</h1>
          <p className="sub-greeting">Tiếp tục hành trình sức khỏe của bạn</p>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          <h2 className="form-title">Đăng nhập với tư cách {displayMode}</h2>

          <div className="auth-mode-switcher" role="tablist" aria-label="Chế độ đăng nhập">
            <button
              type="button"
              className={`auth-mode-btn ${mode === "user" ? "active" : ""}`}
              onClick={() => switchMode("user")}
            >
              Người dùng
            </button>
            <button
              type="button"
              className={`auth-mode-btn ${mode === "admin" ? "active" : ""}`}
              onClick={() => switchMode("admin")}
            >
              Quản trị viên
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email / Username Input */}
            <div className="input-group-auth">
              <label className="input-label-auth">Email / Tên đăng nhập</label>
              <div className="input-icon-wrapper-auth">
                <Mail size={16} className="input-icon-auth" />
                <input
                  type="text"
                  className="auth-input"
                  placeholder={isAdminMode ? "admin hoặc bạn@email.com" : "email của bạn"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="input-group-auth">
              <div className="label-row-auth">
                <label className="input-label-auth">Mật khẩu</label>
                <a href="#" className="forgot-pwd-link">
                  Quên?
                </a>
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

            {isAdminMode && (
              <div className="input-group-auth">
                <label className="input-label-auth">Mã bảo mật</label>
                <div className="input-icon-wrapper-auth">
                  <Lock size={16} className="input-icon-auth" />
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="Mã bảo mật quản trị viên"
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {formError && <div className="error-text-auth">{formError}</div>}

            {/* Submit Button */}
            <button type="submit" className="btn-primary-auth" disabled={isLoading}>
              {isLoading ? "Đang đăng nhập..." : `Đăng nhập với tư cách ${displayMode}`}
              <ArrowRight size={16} className="btn-icon-auth" />
            </button>
          </form>

          {/* Guest continue + Register Prompt */}
          <div className="register-prompt">
            <button onClick={onGuestContinue} className="btn-secondary-auth" type="button">
              Tiếp tục với tư cách khách
            </button>
          </div>

          <div className="register-prompt">
            <span className="prompt-text">Chưa có tài khoản?</span>
            <button onClick={onRegisterClick} className="register-link-btn" type="button">
              Đăng ký ngay
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
