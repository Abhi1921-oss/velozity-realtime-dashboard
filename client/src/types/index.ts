export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'OVERDUE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  createdAt?: string;
  _count?: {
    projects: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  client?: Client;
  ownerId: string;
  owner?: User;
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
    ownerId?: string;
  };
  assignedToId: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  activityLogs?: ActivityLog[];
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  taskId: number;
  projectId: string;
  userId?: string | null;
  userName: string;
  taskTitle: string;
  fromStatus?: TaskStatus | null;
  toStatus: TaskStatus;
  actionText: string;
  createdAt: string;
  task?: {
    id: number;
    title: string;
    assignedToId: string;
  };
  project?: {
    id: string;
    name: string;
    ownerId: string;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  taskId?: number | null;
  projectId?: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AdminStats {
  role: 'ADMIN';
  totalProjects: number;
  totalTasks: number;
  overdueTaskCount: number;
  activeUsersOnline: number;
  tasksByStatus: Record<TaskStatus, number>;
  onlineUsersList: { userId: string; name: string; email: string; role: Role }[];
}

export interface PMStats {
  role: 'PROJECT_MANAGER';
  projectsSummary: {
    totalProjects: number;
    projects: { id: string; name: string; createdAt: string }[];
    totalTasks: number;
  };
  tasksByPriority: Record<TaskPriority, number>;
  upcomingTasksThisWeek: Task[];
}

export interface DevStats {
  role: 'DEVELOPER';
  totalAssigned: number;
  statusBreakdown: Record<TaskStatus, number>;
  tasks: Task[];
}

export type DashboardStats = AdminStats | PMStats | DevStats;

export interface TaskFilterState {
  status: string;
  priority: string;
  projectId: string;
  dueDateFrom: string;
  dueDateTo: string;
  search: string;
}
