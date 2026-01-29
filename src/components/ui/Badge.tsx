import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'yellow' | 'blue' | 'red' | 'gray';
  children: React.ReactNode;
}

const baseStyles =
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors';

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  green:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  yellow:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  blue:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  red:
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  gray:
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function Badge({
  variant = 'gray',
  className,
  children,
  ...props
}: BadgeProps): JSX.Element {
  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${className ?? ''}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
