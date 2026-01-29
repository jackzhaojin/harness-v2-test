import { useState } from 'react';
import type { Task, TeamMember } from '../../types';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../ui/Badge';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  teamLookup: Map<string, TeamMember>;
  variant: 'todo' | 'in-progress' | 'done';
  onTaskClick?: (task: Task) => void;
}

const columnStyles: Record<KanbanColumnProps['variant'], string> = {
  todo: 'bg-gray-50 dark:bg-gray-900/50',
  'in-progress': 'bg-blue-50/50 dark:bg-blue-900/20',
  done: 'bg-green-50/50 dark:bg-green-900/20',
};

export function KanbanColumn({ title, tasks, teamLookup, variant, onTaskClick }: KanbanColumnProps): JSX.Element {
  const { state, dispatch } = useData();
  const { showToast } = useToast();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLElement>): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>): void => {
    // Only reset if we're leaving the column element itself, not moving between children
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>): void => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      dispatch({ type: 'MOVE_TASK', payload: { taskId, newStatus: variant } });
    }
    setIsDragOver(false);
  };

  const handleAddTask = (task: Task): void => {
    dispatch({ type: 'ADD_TASK', payload: task });
    showToast('Task created', 'success');
    setIsAddingTask(false);
  };

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-xl ${columnStyles[variant]} border border-gray-200 dark:border-gray-700 transition-shadow ${
        isDragOver ? 'ring-2 ring-blue-500 ring-inset' : ''
      }`}
      aria-label={`${title} column`}
      data-testid={`kanban-column-${variant}`}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
        <Badge variant="gray">{tasks.length}</Badge>
      </div>

      {/* Scrollable task list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assignee={teamLookup.get(task.assignee)}
              onClick={onTaskClick}
            />
          ))
        ) : (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No tasks
          </p>
        )}

        {/* Inline Add Task Form */}
        {isAddingTask && (
          <TaskForm
            status={variant}
            teamMembers={state.team}
            onSave={handleAddTask}
            onCancel={() => setIsAddingTask(false)}
          />
        )}
      </div>

      {/* Add Task Button at bottom */}
      {!isAddingTask && (
        <div className="p-3 pt-0">
          <button
            onClick={() => setIsAddingTask(true)}
            className="flex items-center gap-1.5 w-full rounded-lg px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            data-testid={`add-task-${variant}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Task
          </button>
        </div>
      )}
    </section>
  );
}

export default KanbanColumn;
