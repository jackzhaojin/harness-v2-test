import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import type { Activity, TeamMember } from '../../types';

interface ActivityFeedProps {
  activities: Activity[];
  teamMembers: TeamMember[];
}

function getTeamMember(userId: string, teamMembers: TeamMember[]): TeamMember | undefined {
  return teamMembers.find((m) => m.id === userId);
}

export function ActivityFeed({ activities, teamMembers }: ActivityFeedProps): JSX.Element {
  const recentActivities = activities.slice(0, 5);

  return (
    <Card padding="none" shadow="sm">
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h2>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-700/50" role="list">
        {recentActivities.map((activity) => {
          const member = getTeamMember(activity.userId, teamMembers);
          const userName = member?.name ?? 'Unknown User';
          return (
            <li key={activity.id} className="px-4 py-3 md:px-6 md:py-4">
              <div className="flex items-start gap-3">
                <Avatar
                  src={member?.avatar}
                  name={userName}
                  size="sm"
                  alt={`${userName} avatar`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {userName}
                    </span>{' '}
                    {activity.action}{' '}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {activity.target}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="p-4 md:px-6 border-t border-gray-200 dark:border-gray-700">
        <Link
          to="/tasks"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          View all &rarr;
        </Link>
      </div>
    </Card>
  );
}

export default ActivityFeed;
