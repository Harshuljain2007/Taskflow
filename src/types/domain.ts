export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ProjectVisibility = 'workspace' | 'private';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'deadline_approaching'
  | 'task_overdue'
  | 'comment_received'
  | 'mention_received'
  | 'workspace_invitation';

export interface UserPublicProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  jobTitle?: string;
  bio?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPrivateInfo {
  uid: string;
  email: string;
  notifyTaskAssigned?: boolean;
  notifyComments?: boolean;
  notifyDeadlines?: boolean;
  themePreference?: 'light' | 'dark' | 'system';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface WorkspaceRef {
  workspaceId: string;
  userId: string;
  workspaceName: string;
  workspaceSlug: string;
  role: WorkspaceRole;
  joinedAt?: unknown;
  updatedAt?: unknown;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  defaultTaskStatus: TaskStatus;
  allowViewerComments: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  role: WorkspaceRole;
  status: 'active';
  invitationId?: string;
  visibleMemberIds: string[];
  joinedAt?: unknown;
  updatedAt?: unknown;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  workspaceOwnerId: string;
  email: string;
  role: Exclude<WorkspaceRole, 'owner'>;
  invitedBy: string;
  invitedByName: string;
  status: 'pending' | 'accepted' | 'revoked';
  expiresAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  key: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  ownerId: string;
  memberIds: string[];
  startDate?: string;
  dueDate?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TaskItem {
  id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeIds: string[];
  reporterId: string;
  projectMemberIds: string[];
  labels: string[];
  startDate?: string;
  dueDate?: string;
  position: number;
  parentTaskId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SubtaskItem {
  id: string;
  workspaceId: string;
  projectId: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdBy: string;
  projectMemberIds: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommentItem {
  id: string;
  workspaceId: string;
  projectId: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  mentions: string[];
  projectMemberIds: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AttachmentItem {
  id: string;
  workspaceId: string;
  projectId: string;
  taskId: string;
  uploadedBy: string;
  uploadedByName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  contentData: string;
  projectMemberIds: string[];
  createdAt?: unknown;
}

export interface NotificationItem {
  id: string;
  workspaceId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: 'task' | 'project' | 'workspace' | 'comment';
  entityId: string;
  read: boolean;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ActivityLogItem {
  id: string;
  workspaceId: string;
  actorId: string;
  actorName: string;
  entityType: 'workspace' | 'member' | 'invitation' | 'project' | 'task' | 'comment' | 'attachment';
  entityId: string;
  action: string;
  summary: string;
  memberIds: string[];
  createdAt?: unknown;
}

export interface PlatformAdmin {
  uid: string;
  email: string;
  grantedBy: string;
  createdAt?: unknown;
}
