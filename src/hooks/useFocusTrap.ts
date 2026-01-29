import { useEffect, useRef, RefObject } from 'react';

/**
 * Custom hook for trapping focus within a container element
 * Used for modals and panels to ensure keyboard accessibility
 */
export function useFocusTrap(isActive: boolean): RefObject<HTMLDivElement> {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when trap activates
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;

      // Shift+Tab on first element: wrap to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
      // Tab on last element: wrap to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
}
