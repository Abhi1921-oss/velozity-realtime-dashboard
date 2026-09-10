import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest, Role, TaskStatus } from '../types';
import { presence } from '../realtime/presence';

export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;

    if (user.role === Role.ADMIN) {
      // 1. Total projects
      const totalProjects = await prisma.project.count();

      // 2. Total tasks by status
      const tasksByStatusRaw = await prisma.task.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      const tasksByStatus: Record<string, number> = {
        TODO: 0,
        IN_PROGRESS: 0,
        IN_REVIEW: 0,
        DONE: 0,
        OVERDUE: 0,
      };

      tasksByStatusRaw.forEach((item) => {
        tasksByStatus[item.status] = item._count.id;
      });

      // 3. Overdue task count
      const overdueTaskCount = tasksByStatus.OVERDUE || 0;

      // 4. Active users online right now (WebSocket presence)
      const activeUsersOnline = presence.getOnlineCount();
      const onlineUsersList = presence.getOnlineUsers();

      res.status(200).json({
        success: true,
        data: {
          role: Role.ADMIN,
          totalProjects,
          tasksByStatus,
          totalTasks: Object.values(tasksByStatus).reduce((a, b) => a + b, 0),
          overdueTaskCount,
          activeUsersOnline,
          onlineUsersList,
        },
      });
      return;
    }

    if (user.role === Role.PROJECT_MANAGER) {
      // PM dashboard: their projects summary, tasks by priority, upcoming due dates this week
      const myProjects = await prisma.project.findMany({
        where: { ownerId: user.id },
        select: { id: true, name: true, createdAt: true },
      });

      const myProjectIds = myProjects.map((p) => p.id);

      // Tasks by priority in PM's projects
      const tasksByPriorityRaw = await prisma.task.groupBy({
        by: ['priority'],
        where: { projectId: { in: myProjectIds } },
        _count: { id: true },
      });

      const tasksByPriority: Record<string, number> = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0,
      };

      tasksByPriorityRaw.forEach((item) => {
        tasksByPriority[item.priority] = item._count.id;
      });

      // Upcoming due dates this week
      const today = new Date();
      const endOfWeek = new Date();
      endOfWeek.setDate(today.getDate() + 7);

      const upcomingTasksThisWeek = await prisma.task.findMany({
        where: {
          projectId: { in: myProjectIds },
          dueDate: {
            gte: today,
            lte: endOfWeek,
          },
          status: { not: TaskStatus.DONE },
        },
        include: {
          assignedTo: { select: { id: true, name: true, avatarUrl: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
      });

      const totalTasksInProjects = await prisma.task.count({
        where: { projectId: { in: myProjectIds } },
      });

      res.status(200).json({
        success: true,
        data: {
          role: Role.PROJECT_MANAGER,
          projectsSummary: {
            totalProjects: myProjects.length,
            projects: myProjects,
            totalTasks: totalTasksInProjects,
          },
          tasksByPriority,
          upcomingTasksThisWeek,
        },
      });
      return;
    }

    if (user.role === Role.DEVELOPER) {
      // Developer dashboard: their assigned tasks, sorted by priority then due date
      const assignedTasks = await prisma.task.findMany({
        where: { assignedToId: user.id },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
      });

      const statusBreakdown: Record<string, number> = {
        TODO: 0,
        IN_PROGRESS: 0,
        IN_REVIEW: 0,
        DONE: 0,
        OVERDUE: 0,
      };

      assignedTasks.forEach((t) => {
        statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;
      });

      res.status(200).json({
        success: true,
        data: {
          role: Role.DEVELOPER,
          totalAssigned: assignedTasks.length,
          statusBreakdown,
          tasks: assignedTasks,
        },
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: { message: 'Unrecognized user role', code: 'INVALID_ROLE' },
    });
  } catch (error) {
    next(error);
  }
};
