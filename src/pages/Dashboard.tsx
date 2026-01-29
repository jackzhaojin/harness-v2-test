import { FolderKanban, CheckSquare, Users, TrendingUp } from 'lucide-react';
import { useData } from '../context/DataContext';
import { activities, teamMembers as mockTeamMembers } from '../data/mockData';
import { StatCard } from '../components/dashboard/StatCard';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { TaskCompletionChart } from '../components/dashboard/TaskCompletionChart';
import { TaskStatusChart } from '../components/dashboard/TaskStatusChart';

export default function Dashboard(): JSX.Element {
  const { state } = useData();

  const totalProjects = state.projects.length;
  const activeTasks = state.tasks.filter((t) => t.status !== 'done').length;
  const totalTeamMembers = state.team.length;
  const completedTasks = state.tasks.filter((t) => t.status === 'done').length;

  // Use mock teamMembers for resolving activity user names/avatars
  // (activities reference userId, DataContext's team may differ from mock)
  const teamForActivities = state.team.length > 0 ? state.team : mockTeamMembers;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>

      {/* Stat Cards Grid: 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          icon={FolderKanban}
          label="Total Projects"
          value={totalProjects}
          to="/projects"
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-100 dark:bg-blue-900/50"
          testId="stat-total-projects"
        />
        <StatCard
          icon={CheckSquare}
          label="Active Tasks"
          value={activeTasks}
          to="/tasks"
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-100 dark:bg-amber-900/50"
          testId="stat-active-tasks"
        />
        <StatCard
          icon={Users}
          label="Team Members"
          value={totalTeamMembers}
          to="/team"
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-100 dark:bg-emerald-900/50"
          testId="stat-team-members"
        />
        <StatCard
          icon={TrendingUp}
          label="Completed This Week"
          value={completedTasks}
          to="/tasks"
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-100 dark:bg-purple-900/50"
          testId="stat-completed-tasks"
        />
      </div>

      {/* Charts Section: 1 col mobile, 2 col desktop */}
      <section aria-label="Dashboard charts" data-testid="dashboard-charts">
        <h2 className="sr-only">Charts</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <TaskCompletionChart />
          <TaskStatusChart />
        </div>
      </section>

      {/* Activity Feed */}
      <ActivityFeed activities={activities} teamMembers={teamForActivities} />
    </div>
  );
}
