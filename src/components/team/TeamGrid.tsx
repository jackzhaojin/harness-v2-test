import type { TeamMember } from '../../types';
import { MemberCard } from './MemberCard';

interface TeamGridProps {
  members: TeamMember[];
}

/**
 * Responsive grid container for team member cards.
 * 1 column on mobile, 2 on tablet (md), 3 on desktop (lg).
 */
export function TeamGrid({ members }: TeamGridProps): JSX.Element {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No team members match your filters.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          Try adjusting your search or role filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((member) => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  );
}

export default TeamGrid;
