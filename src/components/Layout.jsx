import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Moon, Sun, Menu, X, Home, Radio, BookOpen, MessageSquare, FileText } from 'lucide-react'
import { Button } from './ui/button'
import TopicSidebar from './TopicSidebar'
import { useManifest } from '../hooks/useManifest'

export default function Layout() {
  const [darkMode, setDarkMode] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { manifest } = useManifest()
  const location = useLocation()

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/podcast', label: 'Podcast', icon: Radio },
    { path: '/quiz', label: 'Quiz', icon: BookOpen },
    { path: '/teach-back', label: 'Teach-Back', icon: MessageSquare },
    { path: '/research', label: 'Research', icon: FileText },
  ]

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Top Navigation */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="mr-4 flex">
              <Link to="/" className="mr-6 flex items-center space-x-2">
                <span className="font-bold sm:inline-block">
                  {manifest?.title || 'Study Environment'}
                </span>
              </Link>
            </div>

            <nav className="flex items-center gap-4 text-sm lg:gap-6 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`hidden md:flex items-center gap-2 transition-colors hover:text-foreground/80 ${
                      isActive ? 'text-foreground font-medium' : 'text-foreground/60'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background pt-14 transition-transform duration-200 ease-in-out md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:translate-x-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <TopicSidebar onTopicSelect={() => setSidebarOpen(false)} />
          </aside>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
