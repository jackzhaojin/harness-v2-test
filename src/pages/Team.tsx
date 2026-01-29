// Team page — displays team members in a responsive card grid with search and role filtering

import { useData } from '../context/DataContext';
import { useTeamFilter } from '../hooks/useTeamFilter';
import { TeamFilters } from '../components/team/TeamFilters';
import { TeamGrid } from '../components/team/TeamGrid';

export default function Team(): JSX.Element {
  const { state } = useData();
  const {
    filteredMembers,
    totalCount,
    filteredCount,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
  } = useTeamFilter({ members: state.team });

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Team
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage and view your team members
        </p>
      </div>

      {/* Filters */}
      <TeamFilters
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />

      {/* Result count */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4" data-testid="team-result-count">
        Showing {filteredCount} of {totalCount} members
      </p>

      {/* Team members grid */}
      <TeamGrid members={filteredMembers} />
    </div>
  );
}
