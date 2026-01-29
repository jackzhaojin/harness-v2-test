import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, User, Settings, LogOut } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useClickOutside } from '../../hooks/useClickOutside';

interface HeaderProps {
  onMenuToggle: () => void;
}

interface UserMenuItem {
  label: string;
  icon: typeof User;
  action: string;
}

const userMenuItems: UserMenuItem[] = [
  { label: 'Profile', icon: User, action: 'profile' },
  { label: 'Settings', icon: Settings, action: 'settings' },
  { label: 'Logout', icon: LogOut, action: 'logout' },
];

export default function Header({ onMenuToggle }: HeaderProps): JSX.Element {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const closeUserMenu = useCallback((): void => {
    setIsUserMenuOpen(false);
  }, []);

  useClickOutside(userMenuRef as React.RefObject<HTMLElement>, closeUserMenu);

  const handleUserMenuAction = useCallback(
    (action: string): void => {
      setIsUserMenuOpen(false);
      switch (action) {
        case 'profile':
          navigate('/settings');
          break;
        case 'settings':
          navigate('/settings');
          break;
        case 'logout':
          // In a real app, this would log out; for now, navigate home
          navigate('/');
          break;
      }
    },
    [navigate]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    },
    []
  );

  return (
    <header className="sticky top-0 z-30 flex items-center h-16 px-4 md:px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="md:hidden mr-3 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-offset-gray-900"
          aria-label="Search"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notifications bell */}
        <button
          className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {/* Unread dot indicator */}
          <span
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"
            data-testid="notification-dot"
            aria-hidden="true"
          />
        </button>

        {/* User avatar + dropdown */}
        <div ref={userMenuRef} className="relative" onKeyDown={handleKeyDown}>
          <button
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            aria-haspopup="true"
            aria-expanded={isUserMenuOpen}
            aria-label="User menu"
          >
            <Avatar
              name="Sarah Chen"
              src="https://i.pravatar.cc/150?img=1"
              size="sm"
            />
          </button>

          {/* Dropdown menu */}
          {isUserMenuOpen && (
            <div
              role="menu"
              aria-label="User menu"
              className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 shadow-lg z-50"
            >
              {userMenuItems.map((menuItem) => (
                <button
                  key={menuItem.action}
                  role="menuitem"
                  onClick={() => handleUserMenuAction(menuItem.action)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <menuItem.icon className="h-4 w-4" aria-hidden="true" />
                  {menuItem.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
