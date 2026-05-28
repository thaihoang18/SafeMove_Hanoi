import { Mail, Phone, Bell, LogOut, Edit2, AlertCircle } from "lucide-react";
import { useState } from "react";
import "../styles/demo-profile.css";

type Props = {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    joinDate?: string;
    avatar?: string;
  } | null;
  onUpdateProfile: (field: string, value: string) => Promise<void>;
  onLogout: () => void;
  isLoading?: boolean;
};

export function ProfileViewDemo({
  user,
  onUpdateProfile,
  onLogout,
  isLoading = false,
}: Props) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [aqiThreshold, setAqiThreshold] = useState(50);
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleEditClick = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleSaveEdit = async (field: string) => {
    if (!editValue.trim()) {
      setEditingField(null);
      return;
    }

    try {
      await onUpdateProfile(field, editValue);
      setEditingField(null);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const getThresholdLabel = (value: number) => {
    if (value <= 50) return "Good";
    if (value <= 100) return "Moderate";
    if (value <= 150) return "Sensitive";
    return "Unhealthy";
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="empty-state">
          <AlertCircle size={48} className="empty-icon" />
          <p>No user profile loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header-center">
        <div className="main-avatar-wrapper">
          <div className="main-avatar-img">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" />
            ) : (
              <span>{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <button className="edit-avatar-badge" title="Change avatar">
            📷
          </button>
        </div>
        <div className="user-primary-info">
          <h2 className="user-full-name">{user.name}</h2>
          <span className="user-join-date">
            {user.joinDate ? `Member since ${user.joinDate}` : "Member"}
          </span>
        </div>
      </div>

      {/* Personal Info Section */}
      <div className="settings-section">
        <h3 className="section-title-small">Personal Information</h3>
        <div className="settings-card">
          {/* Name */}
          <div className="info-row">
            <div className="info-content">
              {editingField === "name" ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="edit-input"
                  disabled={isLoading}
                  autoFocus
                />
              ) : (
                <>
                  <span className="info-label">Name</span>
                  <span className="info-value">{user.name}</span>
                </>
              )}
            </div>
            {editingField === "name" ? (
              <button
                className="btn-save-inline"
                onClick={() => handleSaveEdit("name")}
                disabled={isLoading}
              >
                ✓
              </button>
            ) : (
              <button
                className="btn-edit-inline"
                onClick={() => handleEditClick("name", user.name)}
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>

          {/* Email */}
          <div className="info-row">
            <div className="info-content">
              {editingField === "email" ? (
                <input
                  type="email"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="edit-input"
                  disabled={isLoading}
                  autoFocus
                />
              ) : (
                <>
                  <span className="info-label">Email</span>
                  <span className="info-value">{user.email}</span>
                </>
              )}
            </div>
            {editingField === "email" ? (
              <button
                className="btn-save-inline"
                onClick={() => handleSaveEdit("email")}
                disabled={isLoading}
              >
                ✓
              </button>
            ) : (
              <button
                className="btn-edit-inline"
                onClick={() => handleEditClick("email", user.email)}
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>

          {/* Phone */}
          <div className="info-row no-border">
            <div className="info-content">
              {editingField === "phone" ? (
                <input
                  type="tel"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="edit-input"
                  disabled={isLoading}
                  autoFocus
                />
              ) : (
                <>
                  <span className="info-label">Phone</span>
                  <span className="info-value">{user.phone || "Not set"}</span>
                </>
              )}
            </div>
            {editingField === "phone" ? (
              <button
                className="btn-save-inline"
                onClick={() => handleSaveEdit("phone")}
                disabled={isLoading}
              >
                ✓
              </button>
            ) : (
              <button
                className="btn-edit-inline"
                onClick={() => handleEditClick("phone", user.phone || "")}
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* App Settings Section */}
      <div className="settings-section">
        <h3 className="section-title-small">App Settings</h3>
        <div className="settings-card">
          {/* AQI Threshold Slider */}
          <div className="slider-row">
            <div className="slider-header">
              <span className="setting-item-title">
                <AlertCircle size={16} className="inline-icon" />
                AQI Alert Threshold
              </span>
              <span className="slider-val-display">{aqiThreshold}</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={aqiThreshold}
              onChange={(e) => setAqiThreshold(Number(e.target.value))}
              className="custom-range-slider"
            />
            <div className="slider-labels">
              <span>Good (0-50)</span>
              <span>Moderate (51-100)</span>
              <span>Bad (200+)</span>
            </div>
            <div className="threshold-badge">{getThresholdLabel(aqiThreshold)}</div>
          </div>

          <div className="divider-line"></div>

          {/* Push Notifications */}
          <div className="toggle-row">
            <span className="setting-item-title">
              <Bell size={16} className="inline-icon" />
              Push Notifications
            </span>
            <label className="switch">
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="divider-line"></div>
        </div>
      </div>

      {/* Logout Button */}
      <button className="btn-logout" onClick={onLogout} disabled={isLoading}>
        <LogOut size={16} />
        Logout
      </button>
    </div>
  );
}
