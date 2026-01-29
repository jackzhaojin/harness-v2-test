import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { TeamMember, TeamRole } from '../../types';

interface MemberCardProps {
  member: TeamMember;
}

/** Map team roles to Badge color variants */
const roleBadgeVariant: Record<TeamRole, 'blue' | 'green' | 'yellow'> = {
  developer: 'blue',
  designer: 'green',
  manager: 'yellow',
};

/** Capitalize role label for display */
function formatRole(role: TeamRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Individual team member card displaying avatar, name, role badge,
 * email mailto link, and online/offline status.
 */
export function MemberCard({ member }: MemberCardProps): JSX.Element {
  return (
    <Card
      padding="md"
      shadow="sm"
      className="h-full flex flex-col items-center text-center hover:shadow-md transition-shadow duration-200"
    >
      {/* Avatar with online status indicator */}
      <Avatar
        src={member.avatar}
        name={member.name}
        size="lg"
        showStatus
        isOnline={member.isOnline}
        className="mb-3"
      />

      {/* Name */}
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate w-full">
        {member.name}
      </h3>

      {/* Role badge */}
      <div className="mt-1.5">
        <Badge variant={roleBadgeVariant[member.role]}>
          {formatRole(member.role)}
        </Badge>
      </div>

      {/* Email mailto link */}
      <a
        href={`mailto:${member.email}`}
        className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline truncate w-full"
        title={member.email}
      >
        {member.email}
      </a>

      {/* Online status text */}
      <p
        className={`mt-2 text-xs font-medium ${
          member.isOnline
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        {member.isOnline ? 'Online' : 'Offline'}
      </p>
    </Card>
  );
}

export default MemberCard;
