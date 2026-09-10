import { z } from 'zod';
import { TaskStatus, TaskPriority } from '../types';

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  clientId: z.string().min(1, 'Client ID is required'),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  clientId: z.string().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().max(1000).optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  assignedToId: z.string().min(1, 'Assigned developer ID is required'),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid ISO date string is required for due date',
  }),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus, {
    errorMap: () => ({ message: 'Invalid status value provided' }),
  }),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().max(1000).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid ISO date string is required for due date',
    })
    .optional(),
  assignedToId: z.string().optional(),
});

export const createClientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  company: z.string().min(2).max(100),
  phone: z.string().optional(),
});
