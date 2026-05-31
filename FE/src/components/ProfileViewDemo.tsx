import { Bell, Edit2, AlertCircle, LogOut, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  avatarFrames,
  avatarPresets,
  defaultAvatarSelection,
  getAvatarSelectionStyle,
  type AvatarSelection,
} from "@/lib/avatar-presets";
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
  aqiThreshold: number;
  onUpdateProfile: (field: string, value: string) => Promise<void>;
  avatarSelection: AvatarSelection;
  onUpdateAvatarSelection: (selection: AvatarSelection) => Promise<void> | void;
  onLogout: () => void;
  isLoading?: boolean;
};

export function ProfileViewDemo({
  user,
  aqiThreshold: currentAqiThreshold,
  onUpdateProfile,
  avatarSelection,
  onUpdateAvatarSelection,
  onLogout,
  isLoading = false,
}: Props) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [aqiThreshold, setAqiThreshold] = useState(currentAqiThreshold);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [pendingAvatarSelection, setPendingAvatarSelection] = useState<AvatarSelection>(avatarSelection);
  const selectedAvatarPreset = avatarPresets.find((preset) => preset.id === avatarSelection.avatarId) ?? avatarPresets[0];

  useEffect(() => {
    setPendingAvatarSelection(avatarSelection ?? defaultAvatarSelection);
  }, [avatarSelection]);

  useEffect(() => {
    setAqiThreshold(currentAqiThreshold);
  }, [currentAqiThreshold]);

  useEffect(() => {
    if (aqiThreshold === currentAqiThreshold) {
      return;
    }

    const timer = window.setTimeout(() => {
      void onUpdateProfile("alertThreshold", String(aqiThreshold));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [aqiThreshold, currentAqiThreshold, onUpdateProfile]);

  const handleEditClick = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleAvatarSave = async () => {
    await onUpdateAvatarSelection(pendingAvatarSelection);
    setAvatarModalOpen(false);
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
          <div className="main-avatar-img" style={getAvatarSelectionStyle(avatarSelection)}>
            <img
              src={selectedAvatarPreset.src}
              alt="Avatar local"
              onError={(event) => {
                event.currentTarget.src = selectedAvatarPreset.fallbackSrc;
              }}
            />
          </div>
          <button className="edit-avatar-badge" title="Change avatar" onClick={() => setAvatarModalOpen(true)} type="button">
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

      {avatarModalOpen && (
        <div className="avatar-modal-backdrop" onClick={() => setAvatarModalOpen(false)} role="presentation">
          <div className="avatar-modal-card" role="dialog" aria-modal="true" aria-labelledby="avatar-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="avatar-modal-header">
              <div>
                <h3 id="avatar-modal-title">Chọn avatar</h3>
              </div>
              <button className="avatar-modal-close" type="button" onClick={() => setAvatarModalOpen(false)} aria-label="Close avatar picker">
                <X size={16} />
              </button>
            </div>

            <div className="avatar-modal-section">
              <div className="avatar-section-title">Khung</div>
              <div className="avatar-choice-grid">
                {avatarFrames.map((frame) => (
                  <button
                    key={frame.id}
                    type="button"
                    className={`avatar-choice-chip ${pendingAvatarSelection.frameId === frame.id ? "is-selected" : ""}`}
                    onClick={() => setPendingAvatarSelection((current) => ({ ...current, frameId: frame.id }))}
                    aria-label={frame.label}
                    title={frame.label}
                  >
                    <span className="avatar-choice-swatch" style={{ background: frame.color, boxShadow: `0 0 0 3px ${frame.color}` }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="avatar-modal-section">
              <div className="avatar-section-title">Avatar</div>
              <div className="avatar-preset-grid">
                {avatarPresets.map((preset) => {
                  const isSelected = pendingAvatarSelection.avatarId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`avatar-preset-card ${isSelected ? "is-selected" : ""}`}
                      onClick={() => setPendingAvatarSelection((current) => ({ ...current, avatarId: preset.id }))}
                      aria-label={preset.label}
                      title={preset.label}
                    >
                      <span className="avatar-preset-preview">
                        <img
                          src={preset.src}
                          alt={preset.label}
                          onError={(event) => {
                            event.currentTarget.src = preset.fallbackSrc;
                          }}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="avatar-modal-actions">
              <button type="button" className="avatar-modal-secondary" onClick={() => setAvatarModalOpen(false)}>
                Hủy
              </button>
              <button type="button" className="avatar-modal-primary" onClick={() => void handleAvatarSave()} disabled={isLoading}>
                Lưu avatar
              </button>
            </div>
          </div>
        </div>
      )}

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
