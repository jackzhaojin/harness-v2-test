import { useState, useEffect, useMemo } from 'react';
import type { Task, Priority, TaskStatus, TeamMember } from '../../types';
import { SlideOver } from '../ui/SlideOver';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Calendar, Pencil, Trash2 } from 'lucide-react';

interface TaskPanelProps {
  task: Task | null;
  teamMembers: TeamMember[];
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

const STATUS_OPTIONS = [
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Done', value: 'done' },
];

const priorityBadgeVariant: Record<Priority, 'gray' | 'yellow' | 'red'> = {
  low: 'gray',
  medium: 'yellow',
  high: 'red',
};

const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

function formatDate(dateString: string): string {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function TaskPanel({
  task,
  teamMembers,
  onClose,
  onSave,
  onDelete,
}: TaskPanelProps): JSX.Element {
  const isOpen = task !== null;

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');

  const assigneeOptions = useMemo(
    () => teamMembers.map((m) => ({ label: m.name, value: m.id })),
    [teamMembers]
  );

  // Find the assignee team member for display
  const assigneeMember = useMemo(
    () => teamMembers.find((m) => m.id === task?.assignee),
    [teamMembers, task?.assignee]
  );

  // Reset form state when task changes or when entering edit mode
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setAssignee(task.assignee);
      setDueDate(task.dueDate);
      setStatus(task.status);
    }
    setIsEditing(false);
    setShowDeleteConfirm(false);
  }, [task]);

  const isTitleValid = title.trim().length > 0;

  const handleSave = (): void => {
    if (!task || !isTitleValid) return;

    const updatedTask: Task = {
      ...task,
      title: title.trim(),
      description: description.trim(),
      priority,
      assignee,
      dueDate,
      status,
    };

    onSave(updatedTask);
    setIsEditing(false);
  };

  const handleCancelEdit = (): void => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setAssignee(task.assignee);
      setDueDate(task.dueDate);
      setStatus(task.status);
    }
    setIsEditing(false);
  };

  const handleDeleteConfirm = (): void => {
    if (task) {
      onDelete(task.id);
    }
    setShowDeleteConfirm(false);
  };

  const handleClose = (): void => {
    setIsEditing(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <SlideOver isOpen={isOpen} onClose={handleClose}>
        <SlideOver.Header>
          {isEditing ? 'Edit Task' : 'Task Details'}
        </SlideOver.Header>

        <SlideOver.Body>
          {task && !isEditing && (
            <div className="space-y-5" data-testid="task-detail-view">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Title
                </label>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {task.title}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {task.description || 'No description'}
                </p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <Badge variant={priorityBadgeVariant[task.priority]}>
                  {priorityLabels[task.priority]}
                </Badge>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Status
                </label>
                <Badge variant="blue">{statusLabels[task.status]}</Badge>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Assignee
                </label>
                {assigneeMember ? (
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={assigneeMember.avatar}
                      name={assigneeMember.name}
                      size="sm"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {assigneeMember.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Unassigned</span>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Due Date
                </label>
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <Calendar className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  {formatDate(task.dueDate)}
                </div>
              </div>
            </div>
          )}

          {task && isEditing && (
            <div className="space-y-4" data-testid="task-edit-form">
              {/* Title */}
              <Input
                label="Title"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />

              {/* Description */}
              <div>
                <label
                  htmlFor="task-description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="task-description"
                  className="block w-full rounded-lg border px-3 py-2 text-sm transition-colors
                    bg-white dark:bg-gray-800
                    text-gray-900 dark:text-gray-100
                    placeholder-gray-400 dark:placeholder-gray-500
                    border-gray-300 dark:border-gray-600
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:border-blue-500
                    dark:focus:ring-offset-gray-900"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter task description"
                />
              </div>

              {/* Priority */}
              <Select
                label="Priority"
                options={PRIORITY_OPTIONS}
                value={priority}
                onChange={(val) => setPriority(val as Priority)}
              />

              {/* Status */}
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(val) => setStatus(val as TaskStatus)}
              />

              {/* Assignee */}
              <Select
                label="Assignee"
                options={assigneeOptions}
                value={assignee}
                onChange={(val) => setAssignee(val)}
                placeholder="Select assignee"
              />

              {/* Due Date */}
              <Input
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          )}
        </SlideOver.Body>

        <SlideOver.Footer>
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="mr-auto text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/30"
              >
                <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
                Delete
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" aria-hidden="true" />
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={!isTitleValid}>
                Save Changes
              </Button>
            </>
          )}
        </SlideOver.Footer>
      </SlideOver>

      {/* Delete confirmation modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <Modal.Header>Delete Task</Modal.Header>
        <Modal.Body>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete <strong>{task?.title}</strong>? This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDeleteConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600"
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default TaskPanel;
