import { useMemo, useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useData } from '../../context/DataContext';
import { Card } from '../ui/Card';
import type { TaskStatus } from '../../types';

interface StatusEntry {
  name: string;
  value: number;
  color: string;
}

/** Light / dark color pairs for each status segment */
const STATUS_COLORS: Record<TaskStatus, { light: string; dark: string }> = {
  todo: { light: '#6b7280', dark: '#9ca3af' }, // gray-500 / gray-400
  'in-progress': { light: '#d97706', dark: '#fbbf24' }, // amber-600 / amber-400
  done: { light: '#059669', dark: '#34d399' }, // emerald-600 / emerald-300
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

/**
 * Returns true when dark mode is active on the document root.
 */
function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = (): void => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    check();

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

/**
 * Custom legend renderer showing coloured circles + label + count.
 */
function renderLegend(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any,
): JSX.Element {
  const { payload } = props as { payload: Array<{ color: string; value: string; payload: { value: number } }> };

  return (
    <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-2" data-testid="chart-legend">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
          <span
            className="inline-block h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          {entry.value}
          <span className="font-semibold">{entry.payload.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function TaskStatusChart(): JSX.Element {
  const { state } = useData();
  const isDark = useIsDarkMode();

  const data: StatusEntry[] = useMemo(() => {
    const grouped: Record<TaskStatus, number> = {
      todo: 0,
      'in-progress': 0,
      done: 0,
    };

    state.tasks.forEach((task) => {
      if (task.status in grouped) {
        grouped[task.status] += 1;
      }
    });

    return (Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => ({
      name: STATUS_LABELS[status],
      value: grouped[status],
      color: isDark ? STATUS_COLORS[status].dark : STATUS_COLORS[status].light,
    }));
  }, [state.tasks, isDark]);

  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';

  return (
    <Card padding="none" shadow="sm" data-testid="chart-task-status">
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tasks by Status
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Distribution of tasks across statuses
        </p>
      </div>
      <div className="p-4 md:p-6" data-testid="pie-chart-container">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: 8,
                fontSize: 13,
                color: isDark ? '#f3f4f6' : '#111827',
              }}
              formatter={(value: number, name: string) => [`${value} tasks`, name]}
            />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default TaskStatusChart;
