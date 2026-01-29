import React, { useCallback } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  className,
}: ToggleProps): JSX.Element {
  const toggleId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  const handleClick = useCallback((): void => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [checked, disabled, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(!checked);
      }
    },
    [checked, disabled, onChange]
  );

  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ?? 'Toggle'}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
      {label && (
        <label
          htmlFor={toggleId}
          className={`text-sm font-medium cursor-pointer select-none
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            text-gray-700 dark:text-gray-300`}
        >
          {label}
        </label>
      )}
    </div>
  );
}

export default Toggle;
