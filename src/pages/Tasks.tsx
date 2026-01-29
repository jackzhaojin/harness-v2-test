// Tasks page — Kanban board layout
import { KanbanBoard } from '../components/tasks/KanbanBoard';

export default function Tasks(): JSX.Element {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
      <KanbanBoard />
    </div>
  );
}
