import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Project, TeamMember } from '../types';
import { useDebounce } from './useDebounce';

// Sortable column keys for the projects table
export type SortKey = 'name' | 'status' | 'progress' | 'teamLead' | 'dueDate';

export type SortDirection = 'asc' | 'desc';

interface UseProjectTableOptions {
  projects: Project[];
  team: TeamMember[];
  pageSize?: number;
}

interface UseProjectTableReturn {
  /** Paginated data for the current page */
  data: Project[];
  /** Total count of filtered (not paginated) projects */
  totalCount: number;
  /** Total number of pages */
  totalPages: number;
  /** Raw search string (controlled input) */
  search: string;
  /** Update the search string */
  setSearch: (value: string) => void;
  /** Current sort column */
  sortKey: SortKey;
  /** Current sort direction */
  sortDir: SortDirection;
  /** Toggle sort on a column (sets column + resets to asc, or toggles direction) */
  toggleSort: (key: SortKey) => void;
  /** Current page number (1-based) */
  page: number;
  /** Set the current page */
  setPage: (page: number) => void;
}

/**
 * Custom hook encapsulating project table filtering, sorting, and pagination logic.
 * Follows Pattern 5 from HOW.md — separating data logic from UI.
 */
export function useProjectTable({
  projects,
  team,
  pageSize = 5,
}: UseProjectTableOptions): UseProjectTableReturn {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  // Build a team member lookup map for resolving IDs to names
  const teamMap = useMemo(() => {
    const map: Record<string, TeamMember> = {};
    for (const member of team) {
      map[member.id] = member;
    }
    return map;
  }, [team]);

  // Filter projects by name (case-insensitive)
  const filtered = useMemo(
    () =>
      projects.filter((p) =>
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      ),
    [projects, debouncedSearch]
  );

  // Sort filtered projects
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;

      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'progress':
          cmp = a.progress - b.progress;
          break;
        case 'teamLead': {
          const nameA = teamMap[a.teamLead]?.name ?? a.teamLead;
          const nameB = teamMap[b.teamLead]?.name ?? b.teamLead;
          cmp = nameA.localeCompare(nameB);
          break;
        }
        case 'dueDate':
          // ISO date strings sort correctly as strings
          cmp = a.dueDate.localeCompare(b.dueDate);
          break;
        default:
          cmp = 0;
      }

      // Secondary sort by name for stability
      if (cmp === 0 && sortKey !== 'name') {
        cmp = a.name.localeCompare(b.name);
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, teamMap]);

  // Paginate sorted results
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const paginated = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize]
  );

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Ensure page is within valid range
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const toggleSort = useCallback(
    (key: SortKey): void => {
      if (key === sortKey) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey]
  );

  return {
    data: paginated,
    totalCount,
    totalPages,
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    page,
    setPage,
  };
}
