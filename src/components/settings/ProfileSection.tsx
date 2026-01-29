import React, { useCallback } from 'react';
import { Camera } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useToast } from '../../context/ToastContext';
import type { UserProfile } from '../../types';

interface ProfileSectionProps {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}

export function ProfileSection({ profile, onProfileChange }: ProfileSectionProps): JSX.Element {
  const { showToast } = useToast();

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onProfileChange({ ...profile, name: e.target.value });
    },
    [profile, onProfileChange]
  );

  const handleAvatarClick = useCallback((): void => {
    showToast('Coming soon!', 'info');
  }, [showToast]);

  return (
    <section aria-labelledby="profile-heading" data-testid="profile-section">
      <Card>
        <h2
          id="profile-heading"
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Profile
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your personal information
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <Avatar
              name={profile.name}
              size="lg"
              data-testid="profile-avatar"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAvatarClick}
              data-testid="change-avatar-btn"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              Change Avatar
            </Button>
          </div>

          {/* Fields */}
          <div className="flex-1 w-full space-y-4">
            <Input
              label="Name"
              value={profile.name}
              onChange={handleNameChange}
              placeholder="Your name"
              data-testid="profile-name-input"
            />
            <Input
              label="Email"
              value={profile.email}
              disabled
              data-testid="profile-email-input"
              helperText="Email cannot be changed"
            />
          </div>
        </div>
      </Card>
    </section>
  );
}

export default ProfileSection;
