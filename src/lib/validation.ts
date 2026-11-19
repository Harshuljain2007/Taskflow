import { z } from 'zod';

export const BOOTSTRAP_ADMIN_EMAIL = 'harshuljain923@gmail.com';

export const ALLOWED_ATTACHMENT_MIMES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv',
] as const;

export const MAX_ATTACHMENT_BYTES = 204800; // 200 KB
export const MAX_ATTACHMENT_DATA_CHARS = 300000;

export const TASK_STATUSES = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
] as const;

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
] as const;

export const workspaceSchema = z.object({
  name: z.string().trim().min(2, 'Workspace name must be at least 2 characters').max(80),
  description: z.string().trim().max(300).optional().default(''),
  defaultTaskStatus: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done']).default('todo'),
  allowViewerComments: z.boolean().default(true),
});

export const invitationSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(254),
  role: z.enum(['admin', 'member', 'viewer']),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2, 'Project name must be at least 2 characters').max(100),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Key must be 2–10 characters')
    .max(10)
    .regex(/^[A-Z0-9]+$/, 'Key must use uppercase letters and numbers only'),
  description: z.string().trim().max(1000).default(''),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']).default('active'),
  visibility: z.enum(['workspace', 'private']).default('workspace'),
  startDate: z.string().max(32).optional().default(''),
  dueDate: z.string().max(32).optional().default(''),
});

export const taskSchema = z.object({
  projectId: z.string().trim().min(1, 'Select a project'),
  title: z.string().trim().min(1, 'Task title is required').max(180),
  description: z.string().trim().max(4000).default(''),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigneeIds: z.array(z.string()).max(10).default([]),
  labels: z.array(z.string().trim().min(1).max(32)).max(10).default([]),
  startDate: z.string().max(32).optional().default(''),
  dueDate: z.string().max(32).optional().default(''),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required').max(100),
  jobTitle: z.string().trim().max(80).optional().default(''),
  bio: z.string().trim().max(300).optional().default(''),
});

export function toSlug(input: string): string {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return cleaned.length >= 2 ? cleaned : 'workspace';
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `tf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
