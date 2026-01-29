import { useMemo } from 'react';
import type { Task, TeamMember, Priority } from '../../types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Calendar } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  assignee: TeamMember | undefined;
}

const priorityConfig: Record<Priority, { variant: 'gray' | 'yellow' | 'red'; label: string }> = {
  low: { variant: 'gray', label: 'Low' },
  medium: { variant: 'yellow', label: 'Medium' },
  high: { variant: 'red', label: 'High' },
};

function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(dateString: string): boolean {
  const dueDate = new Date(dateString);
  const now = new Date();
  // Set time to midnight for date-only comparison
  dueDate.setHours(23, 59, 59, 999);
  return dueDate < now;
}

export function TaskCard({ task, assignee }: TaskCardProps): JSX.Element {
  const overdue = useMemo(() => isOverdue(task.dueDate), [task.dueDate]);
  const priority = priorityConfig[task.priority];

  return (
    <article
      className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
      aria-label={`Task: ${task.title}`}
    >
      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
        {task.title}
      </h3>

      {/* Meta row: priority badge + due date */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge variant={priority.variant}>{priority.label}</Badge>
        <span
          className={`inline-flex items-center gap-1 text-xs ${
            overdue
              ? 'text-red-600 dark:text-red-400 font-medium'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          aria-label={`Due ${formatShortDate(task.dueDate)}${overdue ? ' (overdue)' : ''}`}
        >
          <Calendar className="h-3 w-3" aria-hidden="true" />
          {formatShortDate(task.dueDate)}
        </span>
      </div>

      {/* Assignee row */}
      {assignee && (
        <div className="mt-3 flex items-center gap-2">
          <div title={assignee.name}>
            <Avatar
              src={assignee.avatar}
              name={assignee.name}
              size="sm"
              aria-label={`Assigned to ${assignee.name}`}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {assignee.name}
          </span>
        </div>
      )}
    </article>
  );
}

export default TaskCard;
