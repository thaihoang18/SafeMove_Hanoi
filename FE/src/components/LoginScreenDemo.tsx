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

type LoginMode = "user" | "admin" | "guest";

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

  const isGuestMode = mode === "guest";
  const isAdminMode = mode === "admin";

  function switchMode(nextMode: LoginMode) {
    setMode(nextMode);
    setFormError(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (mode === "guest") {
      onGuestContinue();
      return;
    }

    if (!email.trim()) {
      setFormError("Please enter email or username");
      return;
    }

    if (!password.trim()) {
      setFormError("Please enter password");
      return;
    }

    const identifier = email.trim();
    const looksLikeEmail = identifier.includes("@");

    if (looksLikeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      setFormError("Please enter valid email or username");
      return;
    }

    try {
      if (isAdminMode) {
        if (!securityCode.trim()) {
          setFormError("Please enter security code");
          return;
        }
        await onAdminLogin(email, password, securityCode);
        return;
      }

      await onUserLogin(email, password);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="demo-auth-container login-page">
      {/* Header */}
      <div className="auth-header">
        <div className="logo-area-auth">
          <Wind size={20} className="logo-icon-auth" />
          <span className="logo-text-auth">SafeMove HaNoi</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="auth-scrollable-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1 className="main-greeting">Welcome Back</h1>
          <p className="sub-greeting">Continue your health journey</p>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          <h2 className="form-title">Login as {mode}</h2>

          <div className="auth-mode-switcher" role="tablist" aria-label="Login modes">
            <button
              type="button"
              className={`auth-mode-btn ${mode === "user" ? "active" : ""}`}
              onClick={() => switchMode("user")}
            >
              User
            </button>
            <button
              type="button"
              className={`auth-mode-btn ${mode === "admin" ? "active" : ""}`}
              onClick={() => switchMode("admin")}
            >
              Admin
            </button>
            <button
              type="button"
              className="auth-mode-btn"
              onClick={() => switchMode("guest")}
            >
              Guest
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {!isGuestMode && (
              <>
                {/* Email / Username Input */}
                <div className="input-group-auth">
                  <label className="input-label-auth">Email / Username</label>
                  <div className="input-icon-wrapper-auth">
                    <Mail size={16} className="input-icon-auth" />
                    <input
                      type="text"
                      className="auth-input"
                      placeholder={isAdminMode ? "admin or your@email.com" : "your@email.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="input-group-auth">
                  <div className="label-row-auth">
                    <label className="input-label-auth">Password</label>
                    <a href="#" className="forgot-pwd-link">
                      Forgot?
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
                    <label className="input-label-auth">Security code</label>
                    <div className="input-icon-wrapper-auth">
                      <Lock size={16} className="input-icon-auth" />
                      <input
                        type="password"
                        className="auth-input"
                        placeholder="Admin security code"
                        value={securityCode}
                        onChange={(e) => setSecurityCode(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {isGuestMode && (
              <div className="guest-mode-panel">
                <p className="guest-mode-text">
                  Continue without an account. You can browse the app as a guest.
                </p>
              </div>
            )}

            {/* Error Message */}
            {formError && <div className="error-text-auth">{formError}</div>}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary-auth"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : isGuestMode ? "Continue as guest" : `Login as ${mode}`}
              <ArrowRight size={16} className="btn-icon-auth" />
            </button>
          </form>

          {/* Guest continue + Register Prompt */}
          <div className="register-prompt">
            <button
              onClick={onGuestContinue}
              className="btn-secondary-auth"
              type="button"
            >
              Continue as guest
            </button>
          </div>

          <div className="register-prompt">
            <span className="prompt-text">Don't have an account?</span>
            <button
              onClick={onRegisterClick}
              className="register-link-btn"
              type="button"
            >
              Sign up now
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
