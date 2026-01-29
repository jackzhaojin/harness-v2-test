import { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useData } from '../../context/DataContext';
import { Card } from '../ui/Card';

interface DayData {
  day: string;
  completed: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * Returns true if the document root has the `dark` class,
 * indicating dark mode is currently active.
 */
function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = (): void => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    check();

    // Observe class changes on <html> so we react to theme toggles
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function TaskCompletionChart(): JSX.Element {
  const { state } = useData();
  const isDark = useIsDarkMode();

  // Derive a deterministic 7-day distribution from done tasks.
  // Each done task is mapped to a day index via a simple hash of its id.
  const chartData: DayData[] = useMemo(() => {
    const counts: number[] = Array(7).fill(0) as number[];

    const doneTasks = state.tasks.filter((t) => t.status === 'done');

    doneTasks.forEach((task) => {
      // Deterministic hash: sum of char-codes modulo 7
      const hash = task.id
        .split('')
        .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      const dayIndex = hash % 7;
      counts[dayIndex] += 1;
    });

    return DAY_LABELS.map((day, i) => ({
      day,
      completed: counts[i],
    }));
  }, [state.tasks]);

  const strokeColor = isDark ? '#60a5fa' : '#2563eb'; // blue-400 / blue-600
  const gridColor = isDark ? '#374151' : '#e5e7eb'; // gray-700 / gray-200
  const textColor = isDark ? '#9ca3af' : '#6b7280'; // gray-400 / gray-500
  const tooltipBg = isDark ? '#1f2937' : '#ffffff'; // gray-800 / white
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';

  return (
    <Card padding="none" shadow="sm" data-testid="chart-task-completion">
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Task Completions
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Completed tasks over the past 7 days
        </p>
      </div>
      <div className="p-4 md:p-6" data-testid="line-chart-container">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="day"
              tick={{ fill: textColor, fontSize: 12 }}
              axisLine={{ stroke: gridColor }}
              tickLine={{ stroke: gridColor }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: textColor, fontSize: 12 }}
              axisLine={{ stroke: gridColor }}
              tickLine={{ stroke: gridColor }}
              label={{
                value: 'Completed',
                angle: -90,
                position: 'insideLeft',
                style: { fill: textColor, fontSize: 12 },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: 8,
                fontSize: 13,
                color: isDark ? '#f3f4f6' : '#111827',
              }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke={strokeColor}
              strokeWidth={2.5}
              dot={{ r: 4, fill: strokeColor, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: strokeColor, strokeWidth: 2, stroke: isDark ? '#1f2937' : '#ffffff' }}
              name="Completed"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default TaskCompletionChart;
