import React from 'react';

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

const colorStyles: Record<NonNullable<ProgressBarProps['color']>, string> = {
  blue: 'bg-blue-600 dark:bg-blue-500',
  green: 'bg-green-600 dark:bg-green-500',
  yellow: 'bg-yellow-500 dark:bg-yellow-400',
  red: 'bg-red-600 dark:bg-red-500',
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  color = 'blue',
  className,
  ...props
}: ProgressBarProps): JSX.Element {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={className} {...props}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? `Progress: ${Math.round(percentage)}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorStyles[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
