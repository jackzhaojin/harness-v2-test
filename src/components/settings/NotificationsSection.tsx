import { useCallback } from 'react';
import { Card } from '../ui/Card';
import { Toggle } from '../ui/Toggle';
import type { NotificationSettings } from '../../types';

interface NotificationsSectionProps {
  notifications: NotificationSettings;
  onNotificationsChange: (notifications: NotificationSettings) => void;
}

interface NotificationToggle {
  key: keyof NotificationSettings;
  label: string;
  description: string;
}

const NOTIFICATION_TOGGLES: NotificationToggle[] = [
  {
    key: 'email',
    label: 'Email Notifications',
    description: 'Receive updates via email',
  },
  {
    key: 'push',
    label: 'Push Notifications',
    description: 'Receive push notifications in your browser',
  },
  {
    key: 'slack',
    label: 'Slack Notifications',
    description: 'Receive notifications in Slack',
  },
];

export function NotificationsSection({
  notifications,
  onNotificationsChange,
}: NotificationsSectionProps): JSX.Element {
  const handleToggle = useCallback(
    (key: keyof NotificationSettings, checked: boolean): void => {
      onNotificationsChange({ ...notifications, [key]: checked });
    },
    [notifications, onNotificationsChange]
  );

  return (
    <section aria-labelledby="notifications-heading" data-testid="notifications-section">
      <Card>
        <h2
          id="notifications-heading"
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Notifications
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose how you want to be notified
        </p>

        <div className="mt-6 space-y-4">
          {NOTIFICATION_TOGGLES.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-2"
              data-testid={`notification-toggle-${item.key}`}
            >
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.label}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
              <Toggle
                checked={notifications[item.key]}
                onChange={(checked) => handleToggle(item.key, checked)}
                label={item.label}
                id={`toggle-${item.key}`}
              />
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

export default NotificationsSection;
