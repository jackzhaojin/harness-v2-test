// Team page — displays team members in a responsive card grid with search and role filtering

import { useState, useCallback } from 'react';
import { UserPlus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useTeamFilter } from '../hooks/useTeamFilter';
import { TeamFilters } from '../components/team/TeamFilters';
import { TeamGrid } from '../components/team/TeamGrid';
import { InviteModal } from '../components/team/InviteModal';
import { Button } from '../components/ui/Button';

export default function Team(): JSX.Element {
  const { state } = useData();
  const { showToast } = useToast();
  const {
    filteredMembers,
    totalCount,
    filteredCount,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
  } = useTeamFilter({ members: state.team });

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleOpenInvite = useCallback((): void => {
    setIsInviteModalOpen(true);
  }, []);

  const handleCloseInvite = useCallback((): void => {
    setIsInviteModalOpen(false);
  }, []);

  const handleInviteSubmit = useCallback(
    (email: string): void => {
      showToast(`Invite sent to ${email}!`, 'success');
      setIsInviteModalOpen(false);
    },
    [showToast]
  );

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Team
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage and view your team members
          </p>
        </div>
        <Button onClick={handleOpenInvite} data-testid="invite-member-btn">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
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

      {/* Invite Member Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={handleCloseInvite}
        onSubmit={handleInviteSubmit}
      />
    </div>
  );
}
