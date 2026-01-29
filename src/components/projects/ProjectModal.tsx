import { useState, useEffect, useMemo } from 'react';
import type { Project, ProjectStatus, TeamMember } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

// --- Types ---

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  project?: Project | null;
  teamMembers: TeamMember[];
}

// --- Constants ---

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'On Hold', value: 'on-hold' },
  { label: 'Completed', value: 'completed' },
];

// --- Component ---

/**
 * Modal form for creating and editing projects.
 * When `project` prop is provided, it pre-fills the form for editing.
 * When absent, the form starts blank for creating a new project.
 */
export function ProjectModal({
  isOpen,
  onClose,
  onSave,
  project,
  teamMembers,
}: ProjectModalProps): JSX.Element {
  const isEditMode = Boolean(project);

  // Team member options for the Select dropdown
  const teamLeadOptions = useMemo(
    () => teamMembers.map((m) => ({ label: m.name, value: m.id })),
    [teamMembers]
  );

  // Form state
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [teamLead, setTeamLead] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Reset form when modal opens / project changes
  useEffect(() => {
    if (isOpen) {
      if (project) {
        setName(project.name);
        setStatus(project.status === 'archived' ? 'active' : project.status);
        setTeamLead(project.teamLead);
        setDueDate(project.dueDate);
      } else {
        setName('');
        setStatus('active');
        setTeamLead(teamMembers[0]?.id ?? '');
        setDueDate('');
      }
    }
  }, [isOpen, project, teamMembers]);

  const isNameValid = name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!isNameValid) return;

    const now = new Date().toISOString().split('T')[0];

    const savedProject: Project = {
      id: project?.id ?? `proj-${Date.now()}`,
      name: name.trim(),
      status,
      progress: project?.progress ?? 0,
      teamLead,
      dueDate: dueDate || now,
      createdAt: project?.createdAt ?? now,
    };

    onSave(savedProject);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        {isEditMode ? 'Edit Project' : 'New Project'}
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="space-y-4">
            {/* Name */}
            <Input
              label="Name"
              placeholder="Enter project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />

            {/* Status */}
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(val) => setStatus(val as ProjectStatus)}
            />

            {/* Team Lead */}
            <Select
              label="Team Lead"
              options={teamLeadOptions}
              value={teamLead}
              onChange={(val) => setTeamLead(val)}
              placeholder="Select team lead"
            />

            {/* Due Date */}
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isNameValid}>
            {isEditMode ? 'Save Changes' : 'Create Project'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

export default ProjectModal;
