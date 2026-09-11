import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthUser, Role } from '../types';
import { presence } from './presence';

let io: SocketIOServer | null = null;

interface AuthenticatedSocket extends Socket {
  user?: AuthUser;
}

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication handshake middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Socket authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as AuthUser;
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Socket authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    // Register user presence
    presence.addUser({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      socketId: socket.id,
    });

    // Join personal user room for direct notifications and events
    socket.join(`user:${user.id}`);

    // Join role-specific room (e.g. role:ADMIN)
    socket.join(`role:${user.role}`);

    // Broadcast presence update to admins
    broadcastPresenceUpdate();

    // Client subscribes to a specific project workspace room
    socket.on('project:join', (projectId: string) => {
      if (typeof projectId === 'string' && projectId.trim()) {
        socket.join(`project:${projectId}`);
      }
    });

    // Client unsubscribes from a project room
    socket.on('project:leave', (projectId: string) => {
      if (typeof projectId === 'string' && projectId.trim()) {
        socket.leave(`project:${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      presence.removeUser(user.id, socket.id);
      broadcastPresenceUpdate();
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet');
  }
  return io;
};

export const broadcastPresenceUpdate = (): void => {
  if (!io) return;
  const count = presence.getOnlineCount();
  io.to('role:ADMIN').emit('presence:update', {
    onlineCount: count,
    users: presence.getOnlineUsers(),
  });
};

export interface ActivityPayload {
  id: string;
  taskId: number;
  projectId: string;
  userId?: string | null;
  userName: string;
  taskTitle: string;
  fromStatus: string | null;
  toStatus: string;
  actionText: string;
  createdAt: string | Date;
  taskAssigneeId?: string;
  projectOwnerId?: string;
}

export const emitActivityEvent = (activity: ActivityPayload): void => {
  if (!io) return;

  // 1. Admin room receives all activities globally
  io.to('role:ADMIN').emit('activity:new', activity);

  // 2. Project room receives all activity for this project
  io.to(`project:${activity.projectId}`).emit('activity:new', activity);

  // 3. Project Manager owner user room receives the activity
  if (activity.projectOwnerId) {
    io.to(`user:${activity.projectOwnerId}`).emit('activity:new', activity);
  }

  // 4. Assigned developer user room receives the activity
  if (activity.taskAssigneeId) {
    io.to(`user:${activity.taskAssigneeId}`).emit('activity:new', activity);
  }
};

export const emitTaskUpdated = (task: unknown, projectId: string): void => {
  if (!io) return;
  io.to(`project:${projectId}`).emit('task:updated', task);
  io.to('role:ADMIN').emit('task:updated', task);
};

export const emitNotification = (
  userId: string,
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    taskId?: number | null;
    projectId?: string | null;
    createdAt: Date | string;
    read: boolean;
  }
): void => {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:new', notification);
};
