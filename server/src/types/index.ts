import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface TaskFilterParams {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
}

export interface SocketUser {
  userId: string;
  email: string;
  role: Role;
  name: string;
  socketId: string;
}

export const Role = {
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  DEVELOPER: 'DEVELOPER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  DONE: 'DONE',
  OVERDUE: 'OVERDUE',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const NotificationType = {
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_IN_REVIEW: 'TASK_IN_REVIEW',
  TASK_OVERDUE: 'TASK_OVERDUE',
  PROJECT_UPDATE: 'PROJECT_UPDATE',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
