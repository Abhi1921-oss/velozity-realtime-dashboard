import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { ActivityLog, Task, NotificationItem } from '../types';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  onlineCount: number;
  onlineUsers: Array<{ userId: string; name: string; email: string; role: string }>;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  onActivity: (cb: (activity: ActivityLog) => void) => () => void;
  onTaskUpdated: (cb: (task: Task) => void) => () => void;
  onNotification: (cb: (notif: NotificationItem) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_WS_URL || window.location.origin;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userId: string; name: string; email: string; role: string }>>([]);

  const activityListenersRef = useRef<Set<(a: ActivityLog) => void>>(new Set());
  const taskUpdateListenersRef = useRef<Set<(t: Task) => void>>(new Set());
  const notifListenersRef = useRef<Set<(n: NotificationItem) => void>>(new Set());

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const s: Socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      setConnected(true);
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    s.on('presence:update', (data: { onlineCount: number; users: any[] }) => {
      setOnlineCount(data.onlineCount);
      setOnlineUsers(data.users || []);
    });

    s.on('activity:new', (activity: ActivityLog) => {
      activityListenersRef.current.forEach((cb) => cb(activity));
    });

    s.on('task:updated', (task: Task) => {
      taskUpdateListenersRef.current.forEach((cb) => cb(task));
    });

    s.on('notification:new', (notif: NotificationItem) => {
      notifListenersRef.current.forEach((cb) => cb(notif));
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [token, user?.id]);

  const joinProject = useCallback((projectId: string) => {
    if (socket && socket.connected) {
      socket.emit('project:join', projectId);
    }
  }, [socket]);

  const leaveProject = useCallback((projectId: string) => {
    if (socket && socket.connected) {
      socket.emit('project:leave', projectId);
    }
  }, [socket]);

  const onActivity = useCallback((cb: (activity: ActivityLog) => void) => {
    activityListenersRef.current.add(cb);
    return () => {
      activityListenersRef.current.delete(cb);
    };
  }, []);

  const onTaskUpdated = useCallback((cb: (task: Task) => void) => {
    taskUpdateListenersRef.current.add(cb);
    return () => {
      taskUpdateListenersRef.current.delete(cb);
    };
  }, []);

  const onNotification = useCallback((cb: (notif: NotificationItem) => void) => {
    notifListenersRef.current.add(cb);
    return () => {
      notifListenersRef.current.delete(cb);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        onlineCount,
        onlineUsers,
        joinProject,
        leaveProject,
        onActivity,
        onTaskUpdated,
        onNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
