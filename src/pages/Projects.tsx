import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useProjectTable } from '../hooks/useProjectTable';
import { ProjectFilters } from '../components/projects/ProjectFilters';
import { ProjectsTable } from '../components/projects/ProjectsTable';
import { Pagination } from '../components/projects/Pagination';
import type { TeamMember } from '../types';

const PAGE_SIZE = 5;

/**
 * Projects page — full-featured data table with search filtering,
 * column sorting, and pagination.
 */
export default function Projects(): JSX.Element {
  const { state } = useData();

  // Build team member lookup map once
  const teamMap = useMemo(() => {
    const map: Record<string, TeamMember> = {};
    for (const member of state.team) {
      map[member.id] = member;
    }
    return map;
  }, [state.team]);

  const {
    data,
    totalCount,
    totalPages,
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    page,
    setPage,
  } = useProjectTable({
    projects: state.projects,
    team: state.team,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Projects
      </h1>

      <ProjectFilters search={search} onSearchChange={setSearch} />

      <ProjectsTable
        projects={data}
        teamMap={teamMap}
        sortKey={sortKey}
        sortDir={sortDir}
        onToggleSort={toggleSort}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
