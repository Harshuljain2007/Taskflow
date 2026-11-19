import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { generateId } from '@/src/lib/validation';
import type { Project, ProjectStatus, ProjectVisibility } from '@/src/types/domain';

export function subscribeProjects(
  workspaceId: string,
  currentUserId: string,
  onData: (projects: Project[]) => void,
): Unsubscribe {
  const path = `workspaces/${workspaceId}/projects`;
  const q = query(
    collection(db, path),
    where('memberIds', 'array-contains', currentUserId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as Project));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export async function createProject(params: {
  workspaceId: string;
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  startDate?: string;
  dueDate?: string;
  ownerId: string;
  ownerName: string;
  workspaceMemberIds: string[];
}): Promise<Project> {
  const projectId = generateId();
  const path = `workspaces/${params.workspaceId}/projects/${projectId}`;

  const memberIds =
    params.visibility === 'private'
      ? [params.ownerId]
      : Array.from(new Set([params.ownerId, ...params.workspaceMemberIds])).slice(0, 25);

  const projectData: Record<string, unknown> = {
    id: projectId,
    workspaceId: params.workspaceId,
    name: params.name.trim().slice(0, 100),
    description: params.description.trim().slice(0, 1000),
    key: params.key.trim().toUpperCase().slice(0, 10),
    status: params.status,
    visibility: params.visibility,
    ownerId: params.ownerId,
    memberIds,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (params.startDate) projectData.startDate = params.startDate.slice(0, 32);
  if (params.dueDate) projectData.dueDate = params.dueDate.slice(0, 32);

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'workspaces', params.workspaceId, 'projects', projectId), projectData);
    const logId = generateId();
    batch.set(doc(db, 'workspaces', params.workspaceId, 'activityLogs', logId), {
      id: logId,
      workspaceId: params.workspaceId,
      actorId: params.ownerId,
      actorName: params.ownerName.slice(0, 100),
      entityType: 'project',
      entityId: projectId,
      action: 'created',
      summary: `Created project ${projectData.key} · ${projectData.name}`,
      memberIds,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return projectData as unknown as Project;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProject(params: {
  workspaceId: string;
  projectId: string;
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  memberIds: string[];
  startDate?: string;
  dueDate?: string;
}): Promise<void> {
  const path = `workspaces/${params.workspaceId}/projects/${params.projectId}`;
  const updateData: Record<string, unknown> = {
    name: params.name.trim().slice(0, 100),
    key: params.key.trim().toUpperCase().slice(0, 10),
    description: params.description.trim().slice(0, 1000),
    status: params.status,
    visibility: params.visibility,
    memberIds: params.memberIds.slice(0, 25),
    updatedAt: serverTimestamp(),
  };
  if (params.startDate) updateData.startDate = params.startDate.slice(0, 32);
  if (params.dueDate) updateData.dueDate = params.dueDate.slice(0, 32);

  try {
    await updateDoc(doc(db, 'workspaces', params.workspaceId, 'projects', params.projectId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function setProjectStatus(
  workspaceId: string,
  projectId: string,
  status: ProjectStatus,
): Promise<void> {
  const path = `workspaces/${workspaceId}/projects/${projectId}`;
  try {
    await updateDoc(doc(db, 'workspaces', workspaceId, 'projects', projectId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProject(workspaceId: string, projectId: string): Promise<void> {
  const path = `workspaces/${workspaceId}/projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'workspaces', workspaceId, 'projects', projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
