import React from 'react';
import { Search } from 'lucide-react';
import { Select } from '../ui/Select';
import type { RoleFilter } from '../../hooks/useTeamFilter';

interface TeamFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: RoleFilter;
  onRoleFilterChange: (value: RoleFilter) => void;
}

const roleOptions = [
  { label: 'All Roles', value: '' },
  { label: 'Developer', value: 'developer' },
  { label: 'Designer', value: 'designer' },
  { label: 'Manager', value: 'manager' },
];

/**
 * Search and role filter controls for the team members grid.
 * Follows the same pattern as ProjectFilters with added role dropdown.
 */
export function TeamFilters({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
}: TeamFiltersProps): JSX.Element {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value);
  };

  const handleRoleChange = (value: string): void => {
    onRoleFilterChange(value as RoleFilter);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1 max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={handleSearchChange}
          aria-label="Search team members"
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
            pl-10 pr-3 py-2 text-sm transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            dark:focus:ring-offset-gray-900"
        />
      </div>
      <Select
        options={roleOptions}
        value={roleFilter}
        onChange={handleRoleChange}
        aria-label="Filter by role"
        className="w-full sm:w-44"
      />
    </div>
  );
}

export default TeamFilters;
