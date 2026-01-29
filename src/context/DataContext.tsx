import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Project, Task, TeamMember } from '../types';
import { projects as mockProjects, tasks as mockTasks, teamMembers as mockTeamMembers } from '../data/mockData';

interface DataState {
  projects: Project[];
  tasks: Task[];
  team: TeamMember[];
}

type DataAction =
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'MOVE_TASK'; payload: { taskId: string; newStatus: 'todo' | 'in-progress' | 'done' } };

interface DataContextValue {
  state: DataState;
  dispatch: (action: DataAction) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

// Reducer function for data state management
function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
      };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.id ? action.payload : project
        ),
      };

    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter((project) => project.id !== action.payload),
      };

    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id ? action.payload : task
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
      };

    case 'MOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? { ...task, status: action.payload.newStatus }
            : task
        ),
      };

    default:
      return state;
  }
}

// Initialize state from localStorage or use mock data
function getInitialState(): DataState {
  try {
    const stored = localStorage.getItem('appData');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Error reading appData from localStorage:', error);
  }

  // Fallback to mock data
  return {
    projects: mockProjects,
    tasks: mockTasks,
    team: mockTeamMembers,
  };
}

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(dataReducer, getInitialState());

  // Sync state to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem('appData', JSON.stringify(state));
    } catch (error) {
      console.warn('Error writing appData to localStorage:', error);
    }
  }, [state]);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
