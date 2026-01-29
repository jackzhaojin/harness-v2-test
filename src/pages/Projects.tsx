import { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useProjectTable } from '../hooks/useProjectTable';
import { ProjectFilters } from '../components/projects/ProjectFilters';
import { ProjectsTable } from '../components/projects/ProjectsTable';
import { Pagination } from '../components/projects/Pagination';
import { ProjectModal } from '../components/projects/ProjectModal';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import type { Project, TeamMember } from '../types';

const PAGE_SIZE = 5;

/**
 * Projects page — full-featured data table with search filtering,
 * column sorting, pagination, and CRUD operations via modals.
 */
export default function Projects(): JSX.Element {
  const { state, dispatch } = useData();
  const { showToast } = useToast();

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

  // --- Modal state ---
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // --- Handlers ---

  const handleNewProject = useCallback((): void => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  }, []);

  const handleSaveProject = useCallback(
    (project: Project): void => {
      if (editingProject) {
        dispatch({ type: 'UPDATE_PROJECT', payload: project });
        showToast('Project updated successfully', 'success');
      } else {
        dispatch({ type: 'ADD_PROJECT', payload: project });
        showToast('Project created successfully', 'success');
      }
      setIsProjectModalOpen(false);
      setEditingProject(null);
    },
    [editingProject, dispatch, showToast]
  );

  const handleCloseProjectModal = useCallback((): void => {
    setIsProjectModalOpen(false);
    setEditingProject(null);
  }, []);

  const handleAction = useCallback(
    (project: Project, action: string): void => {
      switch (action) {
        case 'edit':
          setEditingProject(project);
          setIsProjectModalOpen(true);
          break;

        case 'archive':
          dispatch({
            type: 'UPDATE_PROJECT',
            payload: { ...project, status: 'archived' },
          });
          showToast(`"${project.name}" archived successfully`, 'success');
          break;

        case 'delete':
          setDeletingProject(project);
          setIsDeleteConfirmOpen(true);
          break;
      }
    },
    [dispatch, showToast]
  );

  const handleConfirmDelete = useCallback((): void => {
    if (!deletingProject) return;
    dispatch({ type: 'DELETE_PROJECT', payload: deletingProject.id });
    showToast(`"${deletingProject.name}" deleted successfully`, 'success');
    setIsDeleteConfirmOpen(false);
    setDeletingProject(null);
  }, [deletingProject, dispatch, showToast]);

  const handleCancelDelete = useCallback((): void => {
    setIsDeleteConfirmOpen(false);
    setDeletingProject(null);
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      {/* Header row with title and New Project button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Projects
        </h1>
        <Button onClick={handleNewProject}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <ProjectFilters search={search} onSearchChange={setSearch} />

      <ProjectsTable
        projects={data}
        teamMap={teamMap}
        sortKey={sortKey}
        sortDir={sortDir}
        onToggleSort={toggleSort}
        onAction={handleAction}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {/* Create / Edit Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={handleCloseProjectModal}
        onSave={handleSaveProject}
        project={editingProject}
        teamMembers={state.team}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={handleCancelDelete}>
        <Modal.Header>Delete Project</Modal.Header>
        <Modal.Body>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {deletingProject?.name}
            </span>
            ?
          </p>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            This action is permanent and cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline" onClick={handleCancelDelete}>
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600"
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
