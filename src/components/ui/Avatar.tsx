import React, { useState, useCallback } from 'react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  isOnline?: boolean;
}

const sizeStyles: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

const statusSizeStyles: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-2.5 w-2.5 -bottom-0 -right-0',
  md: 'h-3 w-3 -bottom-0.5 -right-0.5',
  lg: 'h-3.5 w-3.5 -bottom-0.5 -right-0.5',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  showStatus = false,
  isOnline = false,
  className,
  ...props
}: AvatarProps): JSX.Element {
  const [imgError, setImgError] = useState(false);

  const handleImgError = useCallback((): void => {
    setImgError(true);
  }, []);

  const showImage = src && !imgError;
  const initials = name ? getInitials(name) : alt ? getInitials(alt) : '?';
  const displayAlt = alt ?? name ?? 'User avatar';

  return (
    <div className={`relative inline-flex shrink-0 ${className ?? ''}`} {...props}>
      {showImage ? (
        <img
          src={src}
          alt={displayAlt}
          onError={handleImgError}
          className={`${sizeStyles[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeStyles[size]} rounded-full flex items-center justify-center font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300`}
          role="img"
          aria-label={displayAlt}
        >
          {initials}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute block rounded-full ring-2 ring-white dark:ring-gray-800 ${statusSizeStyles[size]} ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}

export default Avatar;
