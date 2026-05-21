import { User, Mail, Lock, ArrowRight } from "lucide-react";
import { useState } from "react";
import "../styles/demo-auth.css";

type Props = {
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  onLoginClick: () => void;
  isLoading?: boolean;
  error?: string;
};

export function RegisterScreenDemo({
  onRegister,
  onLoginClick,
  isLoading = false,
  error,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(error || null);

  const validatePassword = (pwd: string) => {
    return pwd.length >= 8 && pwd.length <= 16;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Please enter name");
      return;
    }

    if (!email.trim()) {
      setFormError("Please enter email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter valid email");
      return;
    }

    if (!validatePassword(password)) {
      setFormError("Password must be 8-16 characters");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      await onRegister(name, email, password);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="demo-auth-container register-page">
      {/* Header */}
      <div className="auth-header">
        <div className="logo-area-auth">
          <span className="logo-icon-auth">🌬️</span>
          <span className="logo-text-auth">SafeMove HaNoi</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="auth-scrollable-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1 className="main-greeting">Create Account</h1>
          <p className="sub-greeting">Start your health journey today</p>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          <h2 className="form-title">Sign Up</h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name Input */}
            <div className="input-group-auth">
              <label className="input-label-auth">Full Name</label>
              <div className="input-icon-wrapper-auth">
                <User size={16} className="input-icon-auth" />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

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
              <label className="input-label-auth">Password (8-16 chars)</label>
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

            {/* Confirm Password Input */}
            <div className="input-group-auth">
              <label className="input-label-auth">Confirm Password</label>
              <div className="input-icon-wrapper-auth">
                <Lock size={16} className="input-icon-auth" />
                <input
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? "Creating account..." : "Create Account"}
              <ArrowRight size={16} className="btn-icon-auth" />
            </button>
          </form>

          {/* Login Prompt */}
          <div className="register-prompt">
            <span className="prompt-text">Already have an account?</span>
            <button
              onClick={onLoginClick}
              className="register-link-btn"
              type="button"
            >
              Login
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
