import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest, Role } from '../types';

export const getActivityFeed = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 50);
    const cursor = req.query.cursor as string | undefined;
    const projectId = req.query.projectId as string | undefined;

    let whereClause: any = {};

    // Strict Role-based Activity Filtering
    if (user.role === Role.ADMIN) {
      // Admin sees activity across all projects
      whereClause = projectId ? { projectId } : {};
    } else if (user.role === Role.PROJECT_MANAGER) {
      // PM sees activity only from their own projects
      whereClause = {
        project: {
          ownerId: user.id,
        },
      };
      if (projectId) {
        whereClause.projectId = projectId;
      }
    } else if (user.role === Role.DEVELOPER) {
      // Developer sees activity only on tasks assigned to them
      whereClause = {
        task: {
          assignedToId: user.id,
        },
      };
      if (projectId) {
        whereClause.projectId = projectId;
      }
    }

    const activities = await prisma.activityLog.findMany({
      where: whereClause,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            assignedToId: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    const nextCursor = activities.length === limit ? activities[activities.length - 1].id : null;

    res.status(200).json({
      success: true,
      data: {
        activities,
        nextCursor,
      },
    });
  } catch (error) {
    next(error);
  }
};
