import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'grid_view', mobileLabel: 'Hub' },
  { to: '/research', label: 'Knowledge Graph', icon: 'search_insights', mobileLabel: 'Research' },
  { to: '/quiz', label: 'Reasoning Arena', icon: 'psychology', mobileLabel: 'Arena' },
  { to: '/podcast', label: 'Audio Lab', icon: 'headphones', mobileLabel: 'Audio' },
  { to: '/teach-back', label: 'Teach Back', icon: 'school', mobileLabel: 'Teach' },
]

function NavItem({ to, label, icon, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 py-3 font-headline font-medium text-sm transition-transform duration-200',
          isActive ? 'nav-item-active' : 'nav-item hover:translate-x-1'
        )
      }
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-[#000000] border-r border-outline-variant/15 shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-[60] font-headline">
        <div className="mb-8 px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
            </div>
            <div>
              <h2 className="text-secondary font-black italic text-base tracking-tighter leading-none">NEURAL CORE</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Logic Sync: 98.4%</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
          ))}
        </nav>

        <div className="mt-auto p-4 space-y-4">
          <button
            className="w-full py-3 gradient-cta text-on-primary-container rounded-xl font-headline font-bold text-xs tracking-widest uppercase shadow-[0_0_20px_rgba(157,143,255,0.3)] hover:scale-[1.02] transition-all"
            onClick={() => navigate('/teach-back')}
          >
            INITIATE TEACHING
          </button>
          <div className="pt-4 border-t border-outline-variant/20 space-y-1">
            <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-sm">analytics</span>
              <span>System Status</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-sm">help_center</span>
              <span>Help</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Panel */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 h-full w-64 bg-[#000000] border-r border-outline-variant/15 shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-50 font-headline transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-outline-variant/20">
          <h2 className="text-secondary font-black italic text-base tracking-tighter">NEURAL CORE</h2>
          <button onClick={() => setSidebarOpen(false)} className="text-on-surface-variant hover:text-primary">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="flex-1 space-y-1 mt-2">
          {NAV_ITEMS.map(item => (
            <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>
      </aside>

      {/* Top Header */}
      <header className="lg:ml-64 sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="flex justify-between items-center px-4 lg:px-8 py-3 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-on-surface-variant hover:text-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="font-headline text-xl font-bold tracking-tighter text-primary drop-shadow-[0_0_8px_rgba(157,143,255,0.5)]">
              AIGENT LOOM
            </h1>
            <nav className="hidden md:flex items-center gap-5">
              <NavLink to="/research" className={({ isActive }) => cn('font-headline uppercase tracking-widest text-xs transition-colors', isActive ? 'text-secondary border-b-2 border-secondary pb-0.5' : 'text-on-surface-variant hover:text-on-surface')}>
                Research
              </NavLink>
              <NavLink to="/quiz" className={({ isActive }) => cn('font-headline uppercase tracking-widest text-xs transition-colors', isActive ? 'text-secondary border-b-2 border-secondary pb-0.5' : 'text-on-surface-variant hover:text-on-surface')}>
                Arena
              </NavLink>
              <NavLink to="/podcast" className={({ isActive }) => cn('font-headline uppercase tracking-widest text-xs transition-colors', isActive ? 'text-secondary border-b-2 border-secondary pb-0.5' : 'text-on-surface-variant hover:text-on-surface')}>
                Podcasts
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-surface-container-low border border-outline-variant/30 rounded-full px-3 py-1.5 gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
              <input
                className="bg-transparent border-none outline-none text-xs text-on-surface w-36 placeholder:text-outline"
                placeholder="Scan knowledge base..."
              />
            </div>
            <button className="p-1.5 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-surface-container-high border-2 border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm text-primary">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-surface/90 backdrop-blur-2xl border-t border-outline-variant/30 z-50 rounded-t-xl shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn('flex flex-col items-center justify-center gap-0.5 transition-all', isActive ? 'text-secondary scale-110' : 'text-on-surface-variant hover:text-primary')
            }
          >
            <span className="material-symbols-outlined text-lg">{item.icon}</span>
            <span className="font-body text-[9px] uppercase font-bold tracking-tight">{item.mobileLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
