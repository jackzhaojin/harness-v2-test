import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import type { Task, TeamMember, TaskStatus } from '../../types';
import { KanbanColumn } from './KanbanColumn';

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
  const { state } = useData();

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

  return (
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
        />
      ))}
    </div>
  );
}

export default KanbanBoard;
