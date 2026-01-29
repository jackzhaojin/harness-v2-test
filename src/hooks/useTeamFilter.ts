import { useState, useMemo } from 'react';
import type { TeamMember, TeamRole } from '../types';
import { useDebounce } from './useDebounce';

/** Role filter value — empty string means "All" */
export type RoleFilter = TeamRole | '';

interface UseTeamFilterOptions {
  members: TeamMember[];
}

interface UseTeamFilterReturn {
  /** Filtered team members based on search + role */
  filteredMembers: TeamMember[];
  /** Total count of all members (unfiltered) */
  totalCount: number;
  /** Count of filtered members */
  filteredCount: number;
  /** Raw search string (controlled input) */
  search: string;
  /** Update the search string */
  setSearch: (value: string) => void;
  /** Current role filter */
  roleFilter: RoleFilter;
  /** Update the role filter */
  setRoleFilter: (value: RoleFilter) => void;
}

/**
 * Custom hook encapsulating team member filtering logic.
 * Follows Pattern 5 from HOW.md — separating data logic from UI.
 * Mirrors useProjectTable structure but without sorting/pagination.
 */
export function useTeamFilter({
  members,
}: UseTeamFilterOptions): UseTeamFilterReturn {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('');

  const debouncedSearch = useDebounce(search, 300);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Name search filter (case-insensitive)
      const matchesSearch = debouncedSearch
        ? member.name.toLowerCase().includes(debouncedSearch.toLowerCase())
        : true;

      // Role filter
      const matchesRole = roleFilter ? member.role === roleFilter : true;

      return matchesSearch && matchesRole;
    });
  }, [members, debouncedSearch, roleFilter]);

  return {
    filteredMembers,
    totalCount: members.length,
    filteredCount: filteredMembers.length,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
  };
}
