import { useState, useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import TopicSidebar from '@/components/TopicSidebar'
import { Sun, Moon, Menu, X } from 'lucide-react'

export default function AppLayout({ topicTree }) {
  const [darkMode, setDarkMode] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState(null)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/podcast', label: 'Podcast' },
    { to: '/quiz', label: 'Quiz' },
    { to: '/teach-back', label: 'Teach-Back' },
    { to: '/research', label: 'Research' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <span className="font-semibold text-lg hidden sm:inline">
              Claude Cert Study
            </span>
          </div>

          <nav className="flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`
                }
                end={link.to === '/'}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - desktop */}
        <aside className="hidden md:block w-60 border-r border-border bg-card overflow-y-auto flex-shrink-0">
          <TopicSidebar
            topicTree={topicTree}
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
          />
        </aside>

        {/* Sidebar - mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative w-60 h-full bg-card border-r border-border overflow-y-auto">
              <TopicSidebar
                topicTree={topicTree}
                selectedTopic={selectedTopic}
                onSelectTopic={(id) => {
                  setSelectedTopic(id)
                  setSidebarOpen(false)
                }}
              />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ selectedTopic, setSelectedTopic }} />
        </main>
      </div>
    </div>
  )
}
