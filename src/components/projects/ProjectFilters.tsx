import React from 'react';
import { Search } from 'lucide-react';

interface ProjectFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

/**
 * Search filter input for the projects table.
 * Displays a search icon and text input above the table.
 */
export function ProjectFilters({
  search,
  onSearchChange,
}: ProjectFiltersProps): JSX.Element {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="mb-4">
      <div className="relative max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={handleChange}
          aria-label="Search projects"
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
            pl-10 pr-3 py-2 text-sm transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            dark:focus:ring-offset-gray-900"
        />
      </div>
    </div>
  );
}

export default ProjectFilters;
