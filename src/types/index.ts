// Union types for status and role enumerations
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type ProjectStatus = 'active' | 'on-hold' | 'completed' | 'archived';
export type Priority = 'low' | 'medium' | 'high';
export type TeamRole = 'developer' | 'designer' | 'manager';

// Project interface
export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  teamLead: string;
  dueDate: string;
  createdAt: string;
}

// Task interface
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee: string;
  dueDate: string;
  projectId: string;
}

// TeamMember interface
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatar: string;
  isOnline: boolean;
}

// Activity interface
export interface Activity {
  id: string;
  userId: string;
  action: string;
  target: string;
  timestamp: string;
}
