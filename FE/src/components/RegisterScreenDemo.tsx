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
      setFormError("氏名を入力してください。");
      return;
    }

    if (!email.trim()) {
      setFormError("メールアドレスを入力してください。");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("有効なメールアドレスを入力してください。");
      return;
    }

    if (!validatePassword(password)) {
      setFormError("パスワードは8〜16文字で入力してください。");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("パスワードが一致しません。");
      return;
    }

    try {
      await onRegister(name, email, password);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "登録に失敗しました。");
    }
  };

  return (
    <div className="demo-auth-container register-page">
      {/* Header */}
      <div className="auth-header">
        <div className="logo-area-auth">
            <span className="logo-icon-auth">🌬️</span>
            <span className="logo-text-auth">SafeMove ハノイ</span>
          </div>
      </div>

      {/* Main Content */}
      <main className="auth-scrollable-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1 className="main-greeting">アカウントを作成</h1>
          <p className="sub-greeting">今日からヘルスジャーニーを始めましょう</p>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          <h2 className="form-title">登録</h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name Input */}
            <div className="input-group-auth">
              <label className="input-label-auth">氏名</label>
              <div className="input-icon-wrapper-auth">
                <User size={16} className="input-icon-auth" />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="お名前を入力"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="input-group-auth">
              <label className="input-label-auth">メールアドレス</label>
              <div className="input-icon-wrapper-auth">
                <Mail size={16} className="input-icon-auth" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="メールアドレスを入力"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="input-group-auth">
              <label className="input-label-auth">パスワード（8〜16文字）</label>
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
              <label className="input-label-auth">パスワード確認</label>
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
              {isLoading ? "アカウント作成中..." : "アカウントを作成"}
              <ArrowRight size={16} className="btn-icon-auth" />
            </button>
          </form>

          {/* Login Prompt */}
          <div className="register-prompt">
            <span className="prompt-text">すでにアカウントをお持ちですか？</span>
            <button
              onClick={onLoginClick}
              className="register-link-btn"
              type="button"
            >
              ログイン
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
