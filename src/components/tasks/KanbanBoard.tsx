import { useMemo, useState, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import type { Task, TeamMember, TaskStatus } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { TaskPanel } from './TaskPanel';

interface ColumnConfig {
  key: TaskStatus;
  title: string;
  variant: 'todo' | 'in-progress' | 'done';
}

const columns: ColumnConfig[] = [
  { key: 'todo', title: 'To Do', variant: 'todo' },
  { key: 'in-progress', title: 'In Progress', variant: 'in-progress' },
  { key: 'done', title: 'Done', variant: 'done' },
];

export function KanbanBoard(): JSX.Element {
  const { state, dispatch } = useData();
  const { showToast } = useToast();

  // Selected task for the slide-over panel
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Build a lookup map: team member ID → TeamMember
  const teamLookup = useMemo(() => {
    const map = new Map<string, TeamMember>();
    state.team.forEach((member) => map.set(member.id, member));
    return map;
  }, [state.team]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      'in-progress': [],
      done: [],
    };
    state.tasks.forEach((task) => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });
    return groups;
  }, [state.tasks]);

  // Keep selectedTask in sync with latest state (e.g. after edit)
  const currentSelectedTask = useMemo(() => {
    if (!selectedTask) return null;
    return state.tasks.find((t) => t.id === selectedTask.id) ?? null;
  }, [selectedTask, state.tasks]);

  const handleTaskClick = useCallback((task: Task): void => {
    setSelectedTask(task);
  }, []);

  const handlePanelClose = useCallback((): void => {
    setSelectedTask(null);
  }, []);

  const handleTaskUpdate = useCallback((task: Task): void => {
    dispatch({ type: 'UPDATE_TASK', payload: task });
    showToast('Task updated', 'success');
  }, [dispatch, showToast]);

  const handleTaskDelete = useCallback((taskId: string): void => {
    dispatch({ type: 'DELETE_TASK', payload: taskId });
    showToast('Task deleted', 'success');
    setSelectedTask(null);
  }, [dispatch, showToast]);

  return (
    <>
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6"
        role="region"
        aria-label="Kanban board"
      >
        {columns.map((col) => (
          <KanbanColumn
            key={col.key}
            title={col.title}
            tasks={tasksByStatus[col.key]}
            teamLookup={teamLookup}
            variant={col.variant}
            onTaskClick={handleTaskClick}
          />
        ))}
      </div>

      {/* Task Detail / Edit Panel */}
      <TaskPanel
        task={currentSelectedTask}
        teamMembers={state.team}
        onClose={handlePanelClose}
        onSave={handleTaskUpdate}
        onDelete={handleTaskDelete}
      />
    </>
  );
}

export default KanbanBoard;
