import { useState, useEffect } from 'react';

/**
 * Custom hook that listens to a CSS media query and returns whether it matches.
 * Uses the matchMedia API with proper event listener setup and cleanup.
 *
 * @param query - A valid CSS media query string (e.g. '(min-width: 768px)')
 * @returns boolean indicating whether the media query currently matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Sync initial value in case it changed between render and effect
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent): void => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}
