import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import { ToastProvider } from './context/ToastContext';
import { DataProvider } from './context/DataContext';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Settings from './pages/Settings';
import ComponentShowcase from './pages/ComponentShowcase';

function App(): JSX.Element {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <ToastProvider>
          <DataProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/team" element={<Team />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/components" element={<ComponentShowcase />} />
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </ToastProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
