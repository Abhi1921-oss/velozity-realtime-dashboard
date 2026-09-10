import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest, Role } from '../types';

export const getProjects = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;

    let whereClause: any = {};

    if (user.role === Role.ADMIN) {
      // Admin sees all projects
      whereClause = {};
    } else if (user.role === Role.PROJECT_MANAGER) {
      // PM sees strictly their own projects
      whereClause = { ownerId: user.id };
    } else if (user.role === Role.DEVELOPER) {
      // Developer sees projects where they have assigned tasks
      whereClause = {
        tasks: {
          some: {
            assignedToId: user.id,
          },
        },
      };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true },
        },
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        error: { message: 'Project not found.', code: 'PROJECT_NOT_FOUND' },
      });
      return;
    }

    // Role-based boundary enforcement at API level
    if (user.role === Role.PROJECT_MANAGER && project.ownerId !== user.id) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You can only view projects you created.',
          code: 'FORBIDDEN_PROJECT_ACCESS',
        },
      });
      return;
    }

    if (user.role === Role.DEVELOPER) {
      const hasTask = project.tasks.some((t) => t.assignedToId === user.id);
      if (!hasTask) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Access denied. You do not have assigned tasks in this project.',
            code: 'FORBIDDEN_PROJECT_ACCESS',
          },
        });
        return;
      }
      // Developer can only view their own assigned tasks in this project
      project.tasks = project.tasks.filter((t) => t.assignedToId === user.id);
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { name, description, clientId } = req.body;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      res.status(400).json({
        success: false,
        error: { message: 'Assigned client does not exist.', code: 'CLIENT_NOT_FOUND' },
      });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        clientId,
        ownerId: user.id,
      },
      include: {
        client: true,
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { name, description, clientId } = req.body;

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { message: 'Project not found.', code: 'PROJECT_NOT_FOUND' },
      });
      return;
    }

    if (user.role === Role.PROJECT_MANAGER && existing.ownerId !== user.id) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You can only modify projects you created.',
          code: 'FORBIDDEN_PROJECT_UPDATE',
        },
      });
      return;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(clientId && { clientId }),
      },
      include: {
        client: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { message: 'Project not found.', code: 'PROJECT_NOT_FOUND' },
      });
      return;
    }

    if (user.role === Role.PROJECT_MANAGER && existing.ownerId !== user.id) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You can only delete projects you created.',
          code: 'FORBIDDEN_PROJECT_DELETE',
        },
      });
      return;
    }

    await prisma.project.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      data: { message: 'Project successfully deleted.' },
    });
  } catch (error) {
    next(error);
  }
};
