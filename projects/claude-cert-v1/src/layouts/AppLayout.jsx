import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import TopicSidebar from '@/components/TopicSidebar'
import { cn } from '@/lib/utils'
import {
  Home,
  Headphones,
  HelpCircle,
  MessageSquare,
  BookOpen,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/podcast', label: 'Podcast', icon: Headphones },
  { path: '/quiz', label: 'Quiz', icon: HelpCircle },
  { path: '/teach-back', label: 'Teach-Back', icon: MessageSquare },
  { path: '/research', label: 'Research', icon: BookOpen },
]

export default function AppLayout({ topicTree, selectedTopic, onSelectTopic }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const location = useLocation()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Initialize dark mode on mount
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>

          {/* Title */}
          <Link to="/" className="font-semibold text-sm md:text-base truncate">
            Claude Developer Certification
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1 ml-auto" aria-label="Main navigation">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Button
                key={path}
                variant={location.pathname === path ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to={path} className="gap-1.5">
                  <Icon className="size-4" />
                  {label}
                </Link>
              </Button>
            ))}
          </nav>

          {/* Dark/Light mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="ml-auto md:ml-0"
          >
            {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>

        {/* Mobile navigation */}
        <nav className={cn('md:hidden border-t', sidebarOpen ? 'block' : 'hidden')} aria-label="Mobile navigation">
          <div className="flex flex-col p-2 gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Button
                key={path}
                variant={location.pathname === path ? 'secondary' : 'ghost'}
                size="sm"
                asChild
                className="justify-start"
                onClick={() => setSidebarOpen(false)}
              >
                <Link to={path} className="gap-2">
                  <Icon className="size-4" />
                  {label}
                </Link>
              </Button>
            ))}
          </div>
        </nav>
      </header>

      <div className="flex">
        {/* Sidebar - desktop */}
        <aside className="hidden md:block w-60 shrink-0 border-r bg-background h-[calc(100vh-3.5rem)] sticky top-14 overflow-hidden">
          <TopicSidebar
            topicTree={topicTree}
            selectedTopic={selectedTopic}
            onSelectTopic={onSelectTopic}
          />
        </aside>

        {/* Sidebar - mobile overlay */}
        {sidebarOpen && (
          <aside className="md:hidden fixed inset-0 top-14 z-40 bg-background/95 backdrop-blur w-72 border-r overflow-y-auto">
            <TopicSidebar
              topicTree={topicTree}
              selectedTopic={selectedTopic}
              onSelectTopic={(id) => {
                onSelectTopic(id)
                setSidebarOpen(false)
              }}
            />
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
