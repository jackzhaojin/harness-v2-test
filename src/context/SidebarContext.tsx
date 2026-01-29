import { createContext, useContext, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface SidebarContextValue {
  isCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps): JSX.Element {
  // Check synchronously (during render, before any effects) whether the user
  // already has a stored sidebar preference from a previous session.
  // useLocalStorage will write its initialValue to localStorage in an effect,
  // so we must capture this BEFORE that effect runs.
  const hadStoredPreference = useRef<boolean>(
    (() => {
      try {
        return window.localStorage.getItem('sidebar-collapsed') !== null;
      } catch {
        return false;
      }
    })()
  );

  const [isCollapsed, setCollapsed] = useLocalStorage<boolean>('sidebar-collapsed', false);

  // Detect tablet viewport: 768px ≤ width < 1024px (md but not lg in Tailwind)
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  // Track whether the user has explicitly toggled the sidebar in this browser session.
  // Once true, responsive defaults are suppressed until the page is fully reloaded.
  const hasUserToggled = useRef<boolean>(false);

  // Track initialization and previous tablet state for change detection
  const initializedRef = useRef<boolean>(false);
  const prevIsTabletRef = useRef<boolean>(isTablet);

  useEffect(() => {
    // First run (mount): apply responsive default only if user has no stored preference
    if (!initializedRef.current) {
      initializedRef.current = true;

      if (hadStoredPreference.current) {
        // User has a stored preference from a previous session — respect it
        hasUserToggled.current = true;
        return;
      }

      // No stored preference — apply responsive default
      setCollapsed(isTablet);
      return;
    }

    // Subsequent runs: viewport breakpoint changed
    // Only apply if user hasn't manually toggled in this session
    if (hasUserToggled.current) return;

    // Only react when the breakpoint actually changes
    if (prevIsTabletRef.current !== isTablet) {
      prevIsTabletRef.current = isTablet;
      setCollapsed(isTablet);
    }
  }, [isTablet, setCollapsed]);

  const toggle = useCallback((): void => {
    hasUserToggled.current = true;
    setCollapsed(!isCollapsed);
  }, [isCollapsed, setCollapsed]);

  const handleSetCollapsed = useCallback((collapsed: boolean): void => {
    hasUserToggled.current = true;
    setCollapsed(collapsed);
  }, [setCollapsed]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggle, setCollapsed: handleSetCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
