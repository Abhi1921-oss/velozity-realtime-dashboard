import { SocketUser } from '../types';

class PresenceManager {
  private userSockets = new Map<string, Set<string>>();
  private userDetails = new Map<string, SocketUser>();

  addUser(user: SocketUser): void {
    if (!this.userSockets.has(user.userId)) {
      this.userSockets.set(user.userId, new Set());
    }
    this.userSockets.get(user.userId)!.add(user.socketId);
    this.userDetails.set(user.userId, user);
  }

  removeUser(userId: string, socketId: string): boolean {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return false;

    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.userSockets.delete(userId);
      this.userDetails.delete(userId);
      return true; // user is completely offline now
    }
    return false; // user still has other active sockets
  }

  getOnlineCount(): number {
    return this.userSockets.size;
  }

  getOnlineUsers(): SocketUser[] {
    return Array.from(this.userDetails.values());
  }

  isOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}

export const presence = new PresenceManager();
