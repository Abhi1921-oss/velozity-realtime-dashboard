import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest, Role, TaskStatus, TaskPriority, NotificationType } from '../types';
import { emitActivityEvent, emitTaskUpdated, emitNotification } from '../realtime/socket';

const formatStatusLabel = (status: string | null | undefined): string => {
  if (!status) return 'None';
  switch (status) {
    case TaskStatus.TODO:
      return 'To Do';
    case TaskStatus.IN_PROGRESS:
      return 'In Progress';
    case TaskStatus.IN_REVIEW:
      return 'In Review';
    case TaskStatus.DONE:
      return 'Done';
    case TaskStatus.OVERDUE:
      return 'Overdue';
    default:
      return status;
  }
};

export const getTasks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const {
      projectId,
      status,
      priority,
      assignedToId,
      dueDateFrom,
      dueDateTo,
      search,
    } = req.query;

    const where: any = {};

    // 1. Strict Role Scoping at API Level
    if (user.role === Role.ADMIN) {
      if (projectId) where.projectId = String(projectId);
      if (assignedToId) where.assignedToId = String(assignedToId);
    } else if (user.role === Role.PROJECT_MANAGER) {
      // PM can only access tasks belonging to projects they created
      where.project = { ownerId: user.id };
      if (projectId) where.projectId = String(projectId);
      if (assignedToId) where.assignedToId = String(assignedToId);
    } else if (user.role === Role.DEVELOPER) {
      // Developer can strictly see tasks assigned to them
      where.assignedToId = user.id;
      if (projectId) where.projectId = String(projectId);
    }

    // 2. Query Filters (Shareable URL parameters)
    if (status) {
      where.status = status as TaskStatus;
    }

    if (priority) {
      where.priority = priority as TaskPriority;
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) where.dueDate.gte = new Date(String(dueDateFrom));
      if (dueDateTo) where.dueDate.lte = new Date(String(dueDateTo));
    }

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    // Sort priority order: for Developer dashboard "sorted by priority then due date"
    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, ownerId: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid task ID format.', code: 'INVALID_ID' },
      });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!task) {
      res.status(404).json({
        success: false,
        error: { message: 'Task not found.', code: 'TASK_NOT_FOUND' },
      });
      return;
    }

    // Role-level checks
    if (user.role === Role.PROJECT_MANAGER && task.project.ownerId !== user.id) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You do not own the project for this task.',
          code: 'FORBIDDEN_TASK_ACCESS',
        },
      });
      return;
    }

    if (user.role === Role.DEVELOPER && task.assignedToId !== user.id) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You cannot view other developers’ tasks.',
          code: 'FORBIDDEN_TASK_ACCESS',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { title, description, projectId, assignedToId, priority, dueDate } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        error: { message: 'Referenced project does not exist.', code: 'PROJECT_NOT_FOUND' },
      });
      return;
    }

    // Project Manager boundary enforcement
    if (user.role === Role.PROJECT_MANAGER && project.ownerId !== user.id) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You cannot create tasks in another PM’s project.',
          code: 'FORBIDDEN_PROJECT_ACCESS',
        },
      });
      return;
    }

    // Validate developer exists
    const assignee = await prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!assignee || assignee.role !== Role.DEVELOPER) {
      res.status(400).json({
        success: false,
        error: { message: 'Assigned user must be a valid Developer.', code: 'INVALID_ASSIGNEE' },
      });
      return;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assignedToId,
        priority: priority || TaskPriority.MEDIUM,
        dueDate: new Date(dueDate),
        status: TaskStatus.TODO,
      },
      include: {
        project: { select: { id: true, name: true, ownerId: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // 1. Initial Activity Log
    const actionText = `${user.name} created Task #${task.id} (${task.title}) and assigned to ${assignee.name}`;
    const activity = await prisma.activityLog.create({
      data: {
        taskId: task.id,
        projectId: task.projectId,
        userId: user.id,
        userName: user.name,
        taskTitle: task.title,
        fromStatus: null,
        toStatus: TaskStatus.TODO,
        actionText,
      },
    });

    // 2. Notification to assigned developer
    const notification = await prisma.notification.create({
      data: {
        userId: task.assignedToId,
        taskId: task.id,
        projectId: task.projectId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'New Task Assigned',
        message: `You were assigned Task #${task.id}: "${task.title}" in ${project.name}`,
      },
    });

    // 3. Real-Time WebSocket emission
    emitActivityEvent({
      id: activity.id,
      taskId: task.id,
      projectId: task.projectId,
      userId: user.id,
      userName: user.name,
      taskTitle: task.title,
      fromStatus: null,
      toStatus: TaskStatus.TODO,
      actionText,
      createdAt: activity.createdAt,
      taskAssigneeId: task.assignedToId,
      projectOwnerId: project.ownerId,
    });

    emitTaskUpdated(task, task.projectId);
    emitNotification(task.assignedToId, notification);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const taskId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(taskId)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid task ID format.', code: 'INVALID_ID' },
      });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { id: true, name: true, ownerId: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (!task) {
      res.status(404).json({
        success: false,
        error: { message: 'Task not found.', code: 'TASK_NOT_FOUND' },
      });
      return;
    }

    // Strict Authorization:
    // Developer can ONLY update status of tasks assigned to them
    if (user.role === Role.DEVELOPER && task.assignedToId !== user.id) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You can only update the status of your assigned tasks.',
          code: 'FORBIDDEN_TASK_STATUS_UPDATE',
        },
      });
      return;
    }

    // PM can only update tasks in projects they own
    if (user.role === Role.PROJECT_MANAGER && task.project.ownerId !== user.id) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You can only update tasks in your own projects.',
          code: 'FORBIDDEN_TASK_STATUS_UPDATE',
        },
      });
      return;
    }

    const previousStatus = task.status;
    const newStatus = status as TaskStatus;

    if (previousStatus === newStatus) {
      res.status(200).json({ success: true, data: task });
      return;
    }

    // Persist new status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
      include: {
        project: { select: { id: true, name: true, ownerId: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Exact required format: "Ravi moved Task #12 from In Progress → In Review · 2 mins ago"
    const actionText = `${user.name} moved Task #${task.id} from ${formatStatusLabel(
      previousStatus
    )} → ${formatStatusLabel(newStatus)}`;

    // Persist activity log to database
    const activity = await prisma.activityLog.create({
      data: {
        taskId: task.id,
        projectId: task.projectId,
        userId: user.id,
        userName: user.name,
        taskTitle: task.title,
        fromStatus: previousStatus,
        toStatus: newStatus,
        actionText,
      },
    });

    // Requirement: When a task they own is moved to In Review, the PM receives a notification
    if (newStatus === TaskStatus.IN_REVIEW && task.project.ownerId) {
      const pmNotification = await prisma.notification.create({
        data: {
          userId: task.project.ownerId,
          taskId: task.id,
          projectId: task.projectId,
          type: NotificationType.TASK_IN_REVIEW,
          title: 'Task Ready for Review',
          message: `${user.name} moved Task #${task.id} "${task.title}" to In Review for project "${task.project.name}".`,
        },
      });

      emitNotification(task.project.ownerId, pmNotification);
    }

    // Broadcast live activity event
    emitActivityEvent({
      id: activity.id,
      taskId: task.id,
      projectId: task.projectId,
      userId: user.id,
      userName: user.name,
      taskTitle: task.title,
      fromStatus: previousStatus,
      toStatus: newStatus,
      actionText,
      createdAt: activity.createdAt,
      taskAssigneeId: task.assignedToId,
      projectOwnerId: task.project.ownerId,
    });

    // Broadcast real-time task update to project room and admin
    emitTaskUpdated(updatedTask, task.projectId);

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const taskId = parseInt(req.params.id, 10);
    const { title, description, priority, dueDate, assignedToId } = req.body;

    if (isNaN(taskId)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid task ID format.', code: 'INVALID_ID' },
      });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { id: true, name: true, ownerId: true } },
      },
    });

    if (!task) {
      res.status(404).json({
        success: false,
        error: { message: 'Task not found.', code: 'TASK_NOT_FOUND' },
      });
      return;
    }

    // Developer cannot edit full task metadata
    if (user.role === Role.DEVELOPER) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Developers cannot edit task metadata.',
          code: 'FORBIDDEN_TASK_EDIT',
        },
      });
      return;
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.ownerId !== user.id) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You can only edit tasks within your own projects.',
          code: 'FORBIDDEN_TASK_EDIT',
        },
      });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(assignedToId && { assignedToId }),
      },
      include: {
        project: { select: { id: true, name: true, ownerId: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // If reassigned, notify the new developer
    if (assignedToId && assignedToId !== task.assignedToId) {
      const notification = await prisma.notification.create({
        data: {
          userId: assignedToId,
          taskId: task.id,
          projectId: task.projectId,
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task Reassigned',
          message: `You were assigned Task #${task.id}: "${updatedTask.title}" in ${task.project.name}`,
        },
      });
      emitNotification(assignedToId, notification);
    }

    emitTaskUpdated(updatedTask, task.projectId);

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid task ID format.', code: 'INVALID_ID' },
      });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { id: true, ownerId: true } },
      },
    });

    if (!task) {
      res.status(404).json({
        success: false,
        error: { message: 'Task not found.', code: 'TASK_NOT_FOUND' },
      });
      return;
    }

    if (user.role === Role.DEVELOPER) {
      res.status(403).json({
        success: false,
        error: { message: 'Developers cannot delete tasks.', code: 'FORBIDDEN_TASK_DELETE' },
      });
      return;
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.ownerId !== user.id) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You can only delete tasks in your own projects.',
          code: 'FORBIDDEN_TASK_DELETE',
        },
      });
      return;
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    res.status(200).json({
      success: true,
      data: { message: 'Task deleted successfully.' },
    });
  } catch (error) {
    next(error);
  }
};
