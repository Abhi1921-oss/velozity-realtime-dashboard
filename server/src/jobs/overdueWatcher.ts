import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { TaskStatus, NotificationType } from '../types';
import { emitActivityEvent, emitTaskUpdated, emitNotification } from '../realtime/socket';

export const startOverdueWatcher = (): void => {
  // Run every minute: checks for tasks past due date
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find all tasks past due date that are not DONE or already marked OVERDUE
      const overdueCandidates = await prisma.task.findMany({
        where: {
          dueDate: { lt: now },
          status: {
            notIn: [TaskStatus.DONE, TaskStatus.OVERDUE],
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              ownerId: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (overdueCandidates.length === 0) {
        return;
      }

      for (const task of overdueCandidates) {
        const previousStatus = task.status;

        // Update task status in database
        const updatedTask = await prisma.task.update({
          where: { id: task.id },
          data: { status: TaskStatus.OVERDUE },
        });

        const actionText = `System marked Task #${task.id} (${task.title}) from ${formatStatusLabel(
          previousStatus
        )} → Overdue · due date passed`;

        // Create persistent activity log
        const activity = await prisma.activityLog.create({
          data: {
            taskId: task.id,
            projectId: task.projectId,
            userName: 'System Scheduler',
            taskTitle: task.title,
            fromStatus: previousStatus,
            toStatus: TaskStatus.OVERDUE,
            actionText,
          },
        });

        // Create notification for assigned developer
        const devNotification = await prisma.notification.create({
          data: {
            userId: task.assignedToId,
            taskId: task.id,
            projectId: task.projectId,
            type: NotificationType.TASK_OVERDUE,
            title: 'Task Overdue',
            message: `Task #${task.id} "${task.title}" in project "${task.project.name}" is past due and flagged Overdue.`,
          },
        });

        // Create notification for project manager (owner)
        const pmNotification = await prisma.notification.create({
          data: {
            userId: task.project.ownerId,
            taskId: task.id,
            projectId: task.projectId,
            type: NotificationType.TASK_OVERDUE,
            title: 'Task Overdue in Your Project',
            message: `Task #${task.id} assigned to ${task.assignedTo.name} has exceeded its due date.`,
          },
        });

        // Broadcast real-time events
        emitActivityEvent({
          id: activity.id,
          taskId: task.id,
          projectId: task.projectId,
          userName: 'System Scheduler',
          taskTitle: task.title,
          fromStatus: previousStatus,
          toStatus: TaskStatus.OVERDUE,
          actionText,
          createdAt: activity.createdAt,
          taskAssigneeId: task.assignedToId,
          projectOwnerId: task.project.ownerId,
        });

        emitTaskUpdated(updatedTask, task.projectId);
        emitNotification(task.assignedToId, devNotification);
        emitNotification(task.project.ownerId, pmNotification);
      }
    } catch (error) {
      console.error('[Cron] Error scanning for overdue tasks:', error);
    }
  });
};

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
