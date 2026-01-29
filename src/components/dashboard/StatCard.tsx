import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  to: string;
  iconColor?: string;
  iconBg?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  to,
  iconColor = 'text-blue-600 dark:text-blue-400',
  iconBg = 'bg-blue-100 dark:bg-blue-900/50',
}: StatCardProps): JSX.Element {
  const navigate = useNavigate();

  return (
    <Card
      padding="md"
      shadow="sm"
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${value}. Click to view details.`}
      onClick={() => navigate(to)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(to);
        }
      }}
    >
      <div className="flex items-center gap-4">
        <div className={`flex items-center justify-center h-12 w-12 rounded-lg ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default StatCard;
