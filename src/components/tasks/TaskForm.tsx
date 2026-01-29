import { useState, useEffect, useMemo } from 'react';
import type { Task, TaskStatus, Priority, TeamMember } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface TaskFormProps {
  status: TaskStatus;
  teamMembers: TeamMember[];
  onSave: (task: Task) => void;
  onCancel: () => void;
}

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

export function TaskForm({ status, teamMembers, onSave, onCancel }: TaskFormProps): JSX.Element {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);

  const assigneeOptions = useMemo(
    () => teamMembers.map((m) => ({ label: m.name, value: m.id })),
    [teamMembers]
  );

  // Set default assignee when team members are available
  useEffect(() => {
    if (teamMembers.length > 0) {
      setAssignee(teamMembers[0].id);
    }
  }, [teamMembers]);

  const isTitleValid = title.trim().length > 0;
  const titleError = titleTouched && !isTitleValid ? 'Title is required' : undefined;

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setTitleTouched(true);

    if (!isTitleValid) return;

    const now = new Date().toISOString().split('T')[0];

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: '',
      status,
      priority,
      assignee,
      dueDate: dueDate || now,
      projectId: '',
    };

    onSave(newTask);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 space-y-3"
      data-testid="task-form"
    >
      {/* Title */}
      <Input
        label="Title"
        placeholder="Enter task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => setTitleTouched(true)}
        error={titleError}
        required
        autoFocus
      />

      {/* Priority */}
      <Select
        label="Priority"
        options={PRIORITY_OPTIONS}
        value={priority}
        onChange={(val) => setPriority(val as Priority)}
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

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" size="sm" disabled={titleTouched && !isTitleValid}>
          Add Task
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default TaskForm;
