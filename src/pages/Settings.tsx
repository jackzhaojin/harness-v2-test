import { useState, useCallback, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { ProfileSection } from '../components/settings/ProfileSection';
import { NotificationsSection } from '../components/settings/NotificationsSection';
import { AppearanceSection } from '../components/settings/AppearanceSection';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import type { UserProfile, NotificationSettings, AccentColor } from '../types';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Sarah Chen',
  email: 'sarah.chen@company.com',
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  email: true,
  push: true,
  slack: false,
};

const DEFAULT_ACCENT: AccentColor = 'blue';

/** CSS custom property values per accent color */
const ACCENT_CSS_MAP: Record<AccentColor, { primary: string; hover: string; ring: string }> = {
  blue: { primary: '59 130 246', hover: '37 99 235', ring: '59 130 246' },
  purple: { primary: '168 85 247', hover: '147 51 234', ring: '168 85 247' },
  green: { primary: '34 197 94', hover: '22 163 74', ring: '34 197 94' },
  orange: { primary: '249 115 22', hover: '234 88 12', ring: '249 115 22' },
  pink: { primary: '236 72 153', hover: '219 39 119', ring: '236 72 153' },
};

function applyAccentColor(color: AccentColor): void {
  const root = document.documentElement;
  const values = ACCENT_CSS_MAP[color];
  root.style.setProperty('--accent-primary', values.primary);
  root.style.setProperty('--accent-hover', values.hover);
  root.style.setProperty('--accent-ring', values.ring);
}

export default function Settings(): JSX.Element {
  const { showToast } = useToast();

  // Persisted settings via localStorage
  const [savedProfile, setSavedProfile] = useLocalStorage<UserProfile>(
    'settings-profile',
    DEFAULT_PROFILE
  );
  const [savedNotifications, setSavedNotifications] = useLocalStorage<NotificationSettings>(
    'settings-notifications',
    DEFAULT_NOTIFICATIONS
  );
  const [savedAccent, setSavedAccent] = useLocalStorage<AccentColor>(
    'settings-accent-color',
    DEFAULT_ACCENT
  );

  // Local draft state (batched save)
  const [profile, setProfile] = useState<UserProfile>(savedProfile);
  const [notifications, setNotifications] = useState<NotificationSettings>(savedNotifications);
  const [accentColor, setAccentColor] = useState<AccentColor>(savedAccent);
  const [isSaving, setIsSaving] = useState(false);

  // Apply accent color on mount and when it changes (live preview)
  useEffect(() => {
    applyAccentColor(accentColor);
  }, [accentColor]);

  const handleSave = useCallback((): void => {
    setIsSaving(true);

    // Simulate brief network delay for UX
    setTimeout(() => {
      setSavedProfile(profile);
      setSavedNotifications(notifications);
      setSavedAccent(accentColor);
      setIsSaving(false);
      showToast('Settings saved!', 'success');
    }, 600);
  }, [profile, notifications, accentColor, setSavedProfile, setSavedNotifications, setSavedAccent, showToast]);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto" data-testid="settings-page">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Manage your application preferences
      </p>

      <div className="mt-8 space-y-6">
        <ProfileSection profile={profile} onProfileChange={setProfile} />
        <NotificationsSection
          notifications={notifications}
          onNotificationsChange={setNotifications}
        />
        <AppearanceSection
          accentColor={accentColor}
          onAccentColorChange={setAccentColor}
        />

        {/* Save Button */}
        <div className="flex justify-end pt-2 pb-8">
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            data-testid="save-settings-btn"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
