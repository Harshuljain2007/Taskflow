import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import {
  ALLOWED_ATTACHMENT_MIMES,
  generateId,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_DATA_CHARS,
} from '@/src/lib/validation';
import { createNotification } from './notificationService';
import type {
  AttachmentItem,
  CommentItem,
  SubtaskItem,
  TaskItem,
  TaskPriority,
  TaskStatus,
} from '@/src/types/domain';

export function subscribeTasks(
  workspaceId: string,
  currentUserId: string,
  onData: (tasks: TaskItem[]) => void,
): Unsubscribe {
  const path = `workspaces/${workspaceId}/tasks`;
  const q = query(
    collection(db, path),
    where('projectMemberIds', 'array-contains', currentUserId),
    orderBy('position', 'asc'),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as TaskItem));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export async function createTask(params: {
  workspaceId: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeIds: string[];
  reporterId: string;
  reporterName: string;
  projectMemberIds: string[];
  labels: string[];
  startDate?: string;
  dueDate?: string;
  position: number;
}): Promise<TaskItem> {
  const taskId = generateId();
  const path = `workspaces/${params.workspaceId}/tasks/${taskId}`;

  const projectMemberIds = Array.from(
    new Set([params.reporterId, ...params.projectMemberIds]),
  ).slice(0, 25);
  const assigneeIds = params.assigneeIds.slice(0, 10);
  const labels = params.labels.map((l) => l.trim().slice(0, 32)).filter(Boolean).slice(0, 10);

  const taskPayload: Record<string, unknown> = {
    id: taskId,
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    title: params.title.trim().slice(0, 180),
    description: params.description.trim().slice(0, 4000),
    status: params.status,
    priority: params.priority,
    assigneeIds,
    reporterId: params.reporterId,
    projectMemberIds,
    labels,
    position: Math.max(0, params.position),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (params.startDate) taskPayload.startDate = params.startDate.slice(0, 32);
  if (params.dueDate) taskPayload.dueDate = params.dueDate.slice(0, 32);

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'workspaces', params.workspaceId, 'tasks', taskId), taskPayload);
    const logId = generateId();
    batch.set(doc(db, 'workspaces', params.workspaceId, 'activityLogs', logId), {
      id: logId,
      workspaceId: params.workspaceId,
      actorId: params.reporterId,
      actorName: params.reporterName.slice(0, 100),
      entityType: 'task',
      entityId: taskId,
      action: 'created',
      summary: `Created task "${taskPayload.title}"`,
      memberIds: projectMemberIds,
      createdAt: serverTimestamp(),
    });
    await batch.commit();

    for (const assigneeId of assigneeIds) {
      await createNotification({
        recipientUserId: assigneeId,
        workspaceId: params.workspaceId,
        type: 'task_assigned',
        title: 'Assigned to a task',
        message: `${params.reporterName} assigned you "${taskPayload.title}".`,
        entityType: 'task',
        entityId: taskId,
        createdBy: params.reporterId,
      });
    }

    return taskPayload as unknown as TaskItem;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTask(params: {
  workspaceId: string;
  taskId: string;
  previousAssigneeIds?: string[];
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeIds: string[];
  labels: string[];
  startDate?: string;
  dueDate?: string;
  position: number;
  actorId: string;
  actorName: string;
}): Promise<void> {
  const path = `workspaces/${params.workspaceId}/tasks/${params.taskId}`;
  const assigneeIds = params.assigneeIds.slice(0, 10);
  const labels = params.labels.map((l) => l.trim().slice(0, 32)).filter(Boolean).slice(0, 10);

  const updateData: Record<string, unknown> = {
    title: params.title.trim().slice(0, 180),
    description: params.description.trim().slice(0, 4000),
    status: params.status,
    priority: params.priority,
    assigneeIds,
    labels,
    position: Math.max(0, params.position),
    updatedAt: serverTimestamp(),
  };

  if (params.startDate !== undefined) updateData.startDate = params.startDate.slice(0, 32);
  if (params.dueDate !== undefined) updateData.dueDate = params.dueDate.slice(0, 32);

  try {
    await updateDoc(doc(db, 'workspaces', params.workspaceId, 'tasks', params.taskId), updateData);

    const prevSet = new Set(params.previousAssigneeIds ?? []);
    for (const assigneeId of assigneeIds) {
      if (!prevSet.has(assigneeId)) {
        await createNotification({
          recipientUserId: assigneeId,
          workspaceId: params.workspaceId,
          type: 'task_assigned',
          title: 'Task assigned to you',
          message: `${params.actorName} assigned you "${updateData.title}".`,
          entityType: 'task',
          entityId: params.taskId,
          createdBy: params.actorId,
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function moveTaskPosition(params: {
  workspaceId: string;
  taskId: string;
  status: TaskStatus;
  position: number;
}): Promise<void> {
  const path = `workspaces/${params.workspaceId}/tasks/${params.taskId}`;
  try {
    await updateDoc(doc(db, 'workspaces', params.workspaceId, 'tasks', params.taskId), {
      status: params.status,
      position: Math.max(0, params.position),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTask(workspaceId: string, taskId: string): Promise<void> {
  const path = `workspaces/${workspaceId}/tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'workspaces', workspaceId, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Subtasks
export function subscribeSubtasks(
  workspaceId: string,
  taskId: string,
  currentUserId: string,
  onData: (subtasks: SubtaskItem[]) => void,
): Unsubscribe {
  const path = `workspaces/${workspaceId}/tasks/${taskId}/subtasks`;
  const q = query(
    collection(db, path),
    where('projectMemberIds', 'array-contains', currentUserId),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((d) => d.data() as SubtaskItem)),
    (error) => handleFirestoreError(error, OperationType.LIST, path),
  );
}

export async function createSubtask(params: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  title: string;
  createdBy: string;
  projectMemberIds: string[];
}): Promise<void> {
  const id = generateId();
  const path = `workspaces/${params.workspaceId}/tasks/${params.taskId}/subtasks/${id}`;
  try {
    await setDoc(doc(db, 'workspaces', params.workspaceId, 'tasks', params.taskId, 'subtasks', id), {
      id,
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      taskId: params.taskId,
      title: params.title.trim().slice(0, 180),
      completed: false,
      createdBy: params.createdBy,
      projectMemberIds: params.projectMemberIds.slice(0, 25),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleSubtask(
  workspaceId: string,
  taskId: string,
  subtaskId: string,
  completed: boolean,
): Promise<void> {
  const path = `workspaces/${workspaceId}/tasks/${taskId}/subtasks/${subtaskId}`;
  try {
    await updateDoc(
      doc(db, 'workspaces', workspaceId, 'tasks', taskId, 'subtasks', subtaskId),
      {
        completed,
        updatedAt: serverTimestamp(),
      },
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSubtask(
  workspaceId: string,
  taskId: string,
  subtaskId: string,
): Promise<void> {
  const path = `workspaces/${workspaceId}/tasks/${taskId}/subtasks/${subtaskId}`;
  try {
    await deleteDoc(doc(db, 'workspaces', workspaceId, 'tasks', taskId, 'subtasks', subtaskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Comments
export function subscribeComments(
  workspaceId: string,
  taskId: string,
  currentUserId: string,
  onData: (comments: CommentItem[]) => void,
): Unsubscribe {
  const path = `workspaces/${workspaceId}/tasks/${taskId}/comments`;
  const q = query(
    collection(db, path),
    where('projectMemberIds', 'array-contains', currentUserId),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((d) => d.data() as CommentItem)),
    (error) => handleFirestoreError(error, OperationType.LIST, path),
  );
}

export async function createComment(params: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  taskTitle: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string | null;
  content: string;
  mentions: string[];
  projectMemberIds: string[];
}): Promise<void> {
  const id = generateId();
  const path = `workspaces/${params.workspaceId}/tasks/${params.taskId}/comments/${id}`;
  const payload: Record<string, unknown> = {
    id,
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    taskId: params.taskId,
    authorId: params.authorId,
    authorName: params.authorName.slice(0, 100),
    content: params.content.trim().slice(0, 2000),
    mentions: params.mentions.slice(0, 10),
    projectMemberIds: params.projectMemberIds.slice(0, 25),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (params.authorPhotoURL) {
    payload.authorPhotoURL = params.authorPhotoURL.slice(0, 500);
  }

  try {
    await setDoc(
      doc(db, 'workspaces', params.workspaceId, 'tasks', params.taskId, 'comments', id),
      payload,
    );

    for (const mentionedUid of params.mentions.slice(0, 10)) {
      await createNotification({
        recipientUserId: mentionedUid,
        workspaceId: params.workspaceId,
        type: 'mention_received',
        title: 'You were mentioned',
        message: `${params.authorName} mentioned you on "${params.taskTitle}".`,
        entityType: 'task',
        entityId: params.taskId,
        createdBy: params.authorId,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateComment(params: {
  workspaceId: string;
  taskId: string;
  commentId: string;
  content: string;
  mentions: string[];
}): Promise<void> {
  const path = `workspaces/${params.workspaceId}/tasks/${params.taskId}/comments/${params.commentId}`;
  try {
    await updateDoc(
      doc(db, 'workspaces', params.workspaceId, 'tasks', params.taskId, 'comments', params.commentId),
      {
        content: params.content.trim().slice(0, 2000),
        mentions: params.mentions.slice(0, 10),
        updatedAt: serverTimestamp(),
      },
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteComment(
  workspaceId: string,
  taskId: string,
  commentId: string,
): Promise<void> {
  const path = `workspaces/${workspaceId}/tasks/${taskId}/comments/${commentId}`;
  try {
    await deleteDoc(
      doc(db, 'workspaces', workspaceId, 'tasks', taskId, 'comments', commentId),
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Attachments
export function subscribeAttachments(
  workspaceId: string,
  taskId: string,
  currentUserId: string,
  onData: (attachments: AttachmentItem[]) => void,
): Unsubscribe {
  const path = `workspaces/${workspaceId}/tasks/${taskId}/attachments`;
  const q = query(
    collection(db, path),
    where('projectMemberIds', 'array-contains', currentUserId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((d) => d.data() as AttachmentItem)),
    (error) => handleFirestoreError(error, OperationType.LIST, path),
  );
}

export async function uploadTaskAttachment(params: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  file: File;
  uploadedBy: string;
  uploadedByName: string;
  projectMemberIds: string[];
}): Promise<void> {
  if (!(ALLOWED_ATTACHMENT_MIMES as readonly string[]).includes(params.file.type)) {
    throw new Error('Unsupported file type. Allowed: PNG, JPEG, WebP, PDF, TXT, MD, JSON, CSV.');
  }
  if (params.file.size <= 0 || params.file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error('File size must be between 1 byte and 200 KB.');
  }

  const contentData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(params.file);
  });

  if (contentData.length > MAX_ATTACHMENT_DATA_CHARS) {
    throw new Error('Encoded file exceeds maximum safe storage size.');
  }

  const id = generateId();
  const path = `workspaces/${params.workspaceId}/tasks/${params.taskId}/attachments/${id}`;
  const safeFileName = params.file.name.replace(/[/\\<>:"|?*]/g, '_').slice(0, 160) || 'attachment';

  try {
    await setDoc(
      doc(db, 'workspaces', params.workspaceId, 'tasks', params.taskId, 'attachments', id),
      {
        id,
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        taskId: params.taskId,
        uploadedBy: params.uploadedBy,
        uploadedByName: params.uploadedByName.slice(0, 100),
        fileName: safeFileName,
        mimeType: params.file.type,
        fileSize: params.file.size,
        contentData,
        projectMemberIds: params.projectMemberIds.slice(0, 25),
        createdAt: serverTimestamp(),
      },
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteTaskAttachment(
  workspaceId: string,
  taskId: string,
  attachmentId: string,
): Promise<void> {
  const path = `workspaces/${workspaceId}/tasks/${taskId}/attachments/${attachmentId}`;
  try {
    await deleteDoc(
      doc(db, 'workspaces', workspaceId, 'tasks', taskId, 'attachments', attachmentId),
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
