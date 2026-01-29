import { useState, useCallback, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps): JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuToggle = useCallback((): void => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const handleMenuClose = useCallback((): void => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header onMenuToggle={handleMenuToggle} />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile navigation overlay */}
      <MobileNav isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
    </div>
  );
}
