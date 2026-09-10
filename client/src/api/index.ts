import { apiFetch, setAccessToken } from './client';
import {
  User,
  Project,
  Task,
  ActivityLog,
  NotificationItem,
  DashboardStats,
  Client,
  TaskStatus,
  TaskPriority,
} from '../types';

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiFetch<{ accessToken: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(res.accessToken);
    return res;
  },

  refresh: async () => {
    const res = await apiFetch<{ accessToken: string; user: User }>('/api/auth/refresh', {
      method: 'POST',
    });
    setAccessToken(res.accessToken);
    return res;
  },

  logout: async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setAccessToken(null);
  },

  getMe: () => apiFetch<User>('/api/auth/me'),
};

export const projectsApi = {
  getAll: () => apiFetch<Project[]>('/api/projects'),
  getById: (id: string) => apiFetch<Project>(`/api/projects/${id}`),
  create: (data: { name: string; description?: string; clientId: string }) =>
    apiFetch<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<{ name: string; description: string; clientId: string }>) =>
    apiFetch<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<{ message: string }>(`/api/projects/${id}`, {
      method: 'DELETE',
    }),
};

export const tasksApi = {
  getAll: (params?: {
    projectId?: string;
    status?: string;
    priority?: string;
    assignedToId?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val) query.append(key, val);
      });
    }
    const qs = query.toString();
    return apiFetch<Task[]>(`/api/tasks${qs ? `?${qs}` : ''}`);
  },

  getById: (id: number) => apiFetch<Task>(`/api/tasks/${id}`),

  create: (data: {
    title: string;
    description?: string;
    projectId: string;
    assignedToId: string;
    priority?: TaskPriority;
    dueDate: string;
  }) =>
    apiFetch<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: number, status: TaskStatus) =>
    apiFetch<Task>(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  update: (
    id: number,
    data: Partial<{
      title: string;
      description: string;
      priority: TaskPriority;
      dueDate: string;
      assignedToId: string;
    }>
  ) =>
    apiFetch<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiFetch<{ message: string }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    }),
};

export const activityApi = {
  getFeed: (params?: { limit?: number; cursor?: string; projectId?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.cursor) query.append('cursor', params.cursor);
    if (params?.projectId) query.append('projectId', params.projectId);
    const qs = query.toString();
    return apiFetch<{ activities: ActivityLog[]; nextCursor: string | null }>(
      `/api/activity${qs ? `?${qs}` : ''}`
    );
  },
};

export const notificationsApi = {
  getAll: (limit = 30) =>
    apiFetch<{ notifications: NotificationItem[]; unreadCount: number }>(
      `/api/notifications?limit=${limit}`
    ),
  getUnreadCount: () => apiFetch<{ unreadCount: number }>('/api/notifications/unread-count'),
  markRead: (id: string) =>
    apiFetch<{ notification: NotificationItem; unreadCount: number }>(
      `/api/notifications/${id}/read`,
      {
        method: 'PATCH',
      }
    ),
  markAllRead: () =>
    apiFetch<{ message: string; unreadCount: number }>('/api/notifications/read-all', {
      method: 'POST',
    }),
};

export const statsApi = {
  getDashboard: () => apiFetch<DashboardStats>('/api/stats/dashboard'),
};

export const usersApi = {
  getUsers: (role?: string) =>
    apiFetch<User[]>(`/api/users${role ? `?role=${role}` : ''}`),
  getClients: () => apiFetch<Client[]>('/api/clients'),
  createClient: (data: { name: string; email: string; company: string; phone?: string }) =>
    apiFetch<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
