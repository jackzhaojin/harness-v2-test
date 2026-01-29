import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { navItems } from './navItems';

export default function Sidebar(): JSX.Element {
  const { isCollapsed, toggle } = useSidebar();

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo / Brand */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
        {!isCollapsed && (
          <span className="text-lg font-bold text-gray-900 dark:text-white truncate">
            ProjectHub
          </span>
        )}
        {isCollapsed && (
          <span className="text-lg font-bold text-gray-900 dark:text-white mx-auto">
            P
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4" aria-label="Main navigation">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2 shrink-0">
        <button
          onClick={toggle}
          className="flex items-center justify-center w-full rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft className="h-5 w-5" aria-hidden="true" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="ml-3">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
