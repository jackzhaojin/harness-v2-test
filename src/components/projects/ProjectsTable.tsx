import { ArrowUp, ArrowDown, MoreVertical, Pencil, Trash2, Archive } from 'lucide-react';
import type { Project, ProjectStatus, TeamMember } from '../../types';
import type { SortKey, SortDirection } from '../../hooks/useProjectTable';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Dropdown } from '../ui/Dropdown';

// --- Types ---

interface ProjectsTableProps {
  projects: Project[];
  teamMap: Record<string, TeamMember>;
  sortKey: SortKey;
  sortDir: SortDirection;
  onToggleSort: (key: SortKey) => void;
  onAction?: (project: Project, action: string) => void;
}

// --- Constants ---

const STATUS_BADGE_VARIANT: Record<ProjectStatus, 'green' | 'yellow' | 'blue' | 'gray'> = {
  active: 'green',
  'on-hold': 'yellow',
  completed: 'blue',
  archived: 'gray',
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: 'Active',
  'on-hold': 'On Hold',
  completed: 'Completed',
  archived: 'Archived',
};

interface ColumnDef {
  key: SortKey | null;
  label: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'progress', label: 'Progress' },
  { key: 'teamLead', label: 'Team Lead' },
  { key: 'dueDate', label: 'Due Date' },
  { key: null, label: 'Actions' },
];

const ACTION_ITEMS = [
  { label: 'Edit', value: 'edit', icon: <Pencil className="h-4 w-4" /> },
  { label: 'Archive', value: 'archive', icon: <Archive className="h-4 w-4" /> },
  { label: 'Delete', value: 'delete', icon: <Trash2 className="h-4 w-4" /> },
];

/**
 * Format an ISO date string into a human-readable format.
 * Uses UTC to avoid timezone off-by-one issues.
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// --- Component ---

/**
 * Projects data table with sortable column headers, alternating row backgrounds,
 * and responsive horizontal scrolling.
 */
export function ProjectsTable({
  projects,
  teamMap,
  sortKey,
  sortDir,
  onToggleSort,
  onAction,
}: ProjectsTableProps): JSX.Element {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.label}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400
                  ${col.key ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors' : ''}`}
                onClick={col.key ? () => onToggleSort(col.key as SortKey) : undefined}
                aria-sort={
                  col.key && col.key === sortKey
                    ? sortDir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.key && col.key === sortKey && (
                    <span data-testid={`sort-indicator-${col.key}`}>
                      {sortDir === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" aria-label="Sorted ascending" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" aria-label="Sorted descending" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
          {projects.length === 0 ? (
            <tr>
              <td
                colSpan={COLUMNS.length}
                className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                No projects found matching your search.
              </td>
            </tr>
          ) : (
            projects.map((project, index) => {
              const teamLead = teamMap[project.teamLead];
              const teamLeadName = teamLead?.name ?? project.teamLead;
              const isEven = index % 2 === 0;

              return (
                <tr
                  key={project.id}
                  className={`${
                    isEven
                      ? 'bg-white dark:bg-gray-900'
                      : 'bg-gray-50 dark:bg-gray-800/30'
                  } hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors`}
                >
                  {/* Name */}
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {project.name}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant={STATUS_BADGE_VARIANT[project.status]}>
                      {STATUS_LABEL[project.status]}
                    </Badge>
                  </td>

                  {/* Progress */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <ProgressBar
                        value={project.progress}
                        color={
                          project.progress >= 75
                            ? 'green'
                            : project.progress >= 40
                              ? 'blue'
                              : 'yellow'
                        }
                        className="flex-1"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                        {project.progress}%
                      </span>
                    </div>
                  </td>

                  {/* Team Lead */}
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {teamLeadName}
                  </td>

                  {/* Due Date */}
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {formatDate(project.dueDate)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <Dropdown
                      items={ACTION_ITEMS}
                      onSelect={(value) => onAction?.(project, value)}
                      align="right"
                      trigger={
                        <button
                          type="button"
                          className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                          aria-label={`Actions for ${project.name}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      }
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ProjectsTable;
