import { ArrowRight, Lock, Mail, Wind } from "lucide-react";
import { useState } from "react";
import "../styles/demo-auth.css";

type Props = {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegisterClick: () => void;
  onGuestContinue: () => void;
  isLoading?: boolean;
  error?: string;
};

export function LoginScreenDemo({
  onLogin,
  onRegisterClick,
  onGuestContinue,
  isLoading = false,
  error,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(error || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError("Please enter email");
      return;
    }

    if (!password.trim()) {
      setFormError("Please enter password");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter valid email");
      return;
    }

    try {
      await onLogin(email, password);
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
          <h2 className="form-title">Login</h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email Input */}
            <div className="input-group-auth">
              <label className="input-label-auth">Email Address</label>
              <div className="input-icon-wrapper-auth">
                <Mail size={16} className="input-icon-auth" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="your@email.com"
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

            {/* Error Message */}
            {formError && <div className="error-text-auth">{formError}</div>}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary-auth"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
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
