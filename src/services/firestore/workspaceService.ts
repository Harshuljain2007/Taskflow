import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { generateId, toSlug } from '@/src/lib/validation';
import type {
  ActivityLogItem,
  TaskStatus,
  Workspace,
  WorkspaceInvitation,
  WorkspaceMember,
  WorkspaceRef,
  WorkspaceRole,
} from '@/src/types/domain';

export function subscribeWorkspaceRefs(
  userId: string,
  onData: (refs: WorkspaceRef[]) => void,
): Unsubscribe {
  const path = `users/${userId}/workspaceRefs`;
  const q = query(collection(db, path), orderBy('joinedAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const committed = snapshot.docs
        .filter((d) => !d.metadata.hasPendingWrites)
        .map((d) => d.data() as WorkspaceRef);
      onData(committed);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export function subscribeWorkspace(
  workspaceId: string,
  onData: (workspace: Workspace | null) => void,
): Unsubscribe {
  const path = `workspaces/${workspaceId}`;
  return onSnapshot(
    doc(db, 'workspaces', workspaceId),
    (snapshot) => {
      onData(snapshot.exists() ? (snapshot.data() as Workspace) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    },
  );
}

export function subscribeWorkspaceMembers(
  workspaceId: string,
  currentUserId: string,
  onData: (members: WorkspaceMember[]) => void,
): Unsubscribe {
  const path = `workspaces/${workspaceId}/members`;
  const q = query(
    collection(db, path),
    where('visibleMemberIds', 'array-contains', currentUserId),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as WorkspaceMember));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export function subscribeWorkspaceInvitations(
  workspaceId: string,
  currentUserId: string,
  onData: (invitations: WorkspaceInvitation[]) => void,
): Unsubscribe {
  const path = `workspaces/${workspaceId}/invitations`;
  const q = query(
    collection(db, path),
    where('invitedBy', '==', currentUserId),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as WorkspaceInvitation));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export function subscribePendingInvitationsByEmail(
  email: string,
  onData: (invitations: WorkspaceInvitation[]) => void,
): Unsubscribe {
  const normalizedEmail = email.trim().toLowerCase();
  const path = 'invitations';
  const q = query(
    collectionGroup(db, 'invitations'),
    where('email', '==', normalizedEmail),
    where('status', '==', 'pending'),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as WorkspaceInvitation));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export function subscribeActivityLogs(
  workspaceId: string,
  currentUserId: string,
  onData: (logs: ActivityLogItem[]) => void,
): Unsubscribe {
  const path = `workspaces/${workspaceId}/activityLogs`;
  const q = query(
    collection(db, path),
    where('memberIds', 'array-contains', currentUserId),
    orderBy('createdAt', 'desc'),
    limit(40),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as ActivityLogItem));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export async function createWorkspace(params: {
  name: string;
  description?: string;
  defaultTaskStatus?: TaskStatus;
  allowViewerComments?: boolean;
  owner: { uid: string; displayName: string; photoURL?: string | null };
}): Promise<Workspace> {
  const workspaceId = generateId();
  const slug = `${toSlug(params.name)}-${workspaceId.slice(0, 6).toLowerCase()}`.slice(0, 80);
  const path = `workspaces/${workspaceId}`;

  const workspaceData: Workspace = {
    id: workspaceId,
    name: params.name.trim().slice(0, 80),
    slug,
    description: (params.description ?? '').trim().slice(0, 300),
    ownerId: params.owner.uid,
    defaultTaskStatus: params.defaultTaskStatus ?? 'todo',
    allowViewerComments: params.allowViewerComments ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const memberPayload: Record<string, unknown> = {
    workspaceId,
    userId: params.owner.uid,
    displayName: (params.owner.displayName || 'Workspace Owner').slice(0, 100),
    role: 'owner',
    status: 'active',
    visibleMemberIds: [params.owner.uid],
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (params.owner.photoURL) {
    memberPayload.photoURL = params.owner.photoURL.slice(0, 500);
  }

  const refPayload: WorkspaceRef = {
    workspaceId,
    userId: params.owner.uid,
    workspaceName: workspaceData.name,
    workspaceSlug: slug,
    role: 'owner',
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const logId = generateId();
  const logPayload: ActivityLogItem = {
    id: logId,
    workspaceId,
    actorId: params.owner.uid,
    actorName: (params.owner.displayName || 'Workspace Owner').slice(0, 100),
    entityType: 'workspace',
    entityId: workspaceId,
    action: 'created',
    summary: `Created workspace "${workspaceData.name}"`,
    memberIds: [params.owner.uid],
    createdAt: serverTimestamp(),
  };

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'workspaces', workspaceId), workspaceData);
    batch.set(doc(db, 'workspaces', workspaceId, 'members', params.owner.uid), memberPayload);
    batch.set(doc(db, 'users', params.owner.uid, 'workspaceRefs', workspaceId), refPayload);
    batch.set(doc(db, 'workspaces', workspaceId, 'activityLogs', logId), logPayload);
    await batch.commit();
    return workspaceData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateWorkspaceDetails(params: {
  workspaceId: string;
  name: string;
  description?: string;
  defaultTaskStatus: TaskStatus;
  allowViewerComments: boolean;
  memberUserIds: string[];
  actorId: string;
  actorName: string;
}): Promise<void> {
  const path = `workspaces/${params.workspaceId}`;
  const trimmedName = params.name.trim().slice(0, 80);
  const slug = `${toSlug(trimmedName)}-${params.workspaceId.slice(0, 6).toLowerCase()}`.slice(0, 80);

  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'workspaces', params.workspaceId), {
      name: trimmedName,
      slug,
      description: (params.description ?? '').trim().slice(0, 300),
      defaultTaskStatus: params.defaultTaskStatus,
      allowViewerComments: params.allowViewerComments,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'users', params.actorId, 'workspaceRefs', params.workspaceId), {
      workspaceName: trimmedName,
      workspaceSlug: slug,
      updatedAt: serverTimestamp(),
    });
    const logId = generateId();
    batch.set(doc(db, 'workspaces', params.workspaceId, 'activityLogs', logId), {
      id: logId,
      workspaceId: params.workspaceId,
      actorId: params.actorId,
      actorName: params.actorName.slice(0, 100),
      entityType: 'workspace',
      entityId: params.workspaceId,
      action: 'updated',
      summary: `Updated workspace settings for "${trimmedName}"`,
      memberIds: params.memberUserIds.slice(0, 25),
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteWorkspace(workspaceId: string, ownerId: string): Promise<void> {
  const path = `workspaces/${workspaceId}`;
  try {
    await deleteDoc(doc(db, 'users', ownerId, 'workspaceRefs', workspaceId));
    await deleteDoc(doc(db, 'workspaces', workspaceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function inviteWorkspaceMember(params: {
  workspace: Workspace;
  email: string;
  role: Exclude<WorkspaceRole, 'owner'>;
  invitedBy: string;
  invitedByName: string;
  memberIds: string[];
}): Promise<void> {
  const normalizedEmail = params.email.trim().toLowerCase().slice(0, 254);
  const invId = generateId();
  const path = `workspaces/${params.workspace.id}/invitations/${invId}`;

  try {
    const existingPending = await getDocs(
      query(
        collection(db, 'workspaces', params.workspace.id, 'invitations'),
        where('invitedBy', '==', params.invitedBy),
        where('email', '==', normalizedEmail),
        where('status', '==', 'pending'),
      ),
    );
    if (!existingPending.empty) {
      throw new Error('An active pending invitation already exists for this email.');
    }

    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 86_400_000));
    const batch = writeBatch(db);
    batch.set(doc(db, 'workspaces', params.workspace.id, 'invitations', invId), {
      id: invId,
      workspaceId: params.workspace.id,
      workspaceName: params.workspace.name.slice(0, 80),
      workspaceSlug: params.workspace.slug,
      workspaceOwnerId: params.workspace.ownerId,
      email: normalizedEmail,
      role: params.role,
      invitedBy: params.invitedBy,
      invitedByName: params.invitedByName.slice(0, 100),
      status: 'pending',
      expiresAt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const logId = generateId();
    batch.set(doc(db, 'workspaces', params.workspace.id, 'activityLogs', logId), {
      id: logId,
      workspaceId: params.workspace.id,
      actorId: params.invitedBy,
      actorName: params.invitedByName.slice(0, 100),
      entityType: 'invitation',
      entityId: invId,
      action: 'invited',
      summary: `Sent ${params.role} invitation`,
      memberIds: params.memberIds.slice(0, 25),
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    if (error instanceof Error && error.message.includes('active pending invitation')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function revokeWorkspaceInvitation(
  workspaceId: string,
  invitationId: string,
): Promise<void> {
  const path = `workspaces/${workspaceId}/invitations/${invitationId}`;
  try {
    await updateDoc(doc(db, 'workspaces', workspaceId, 'invitations', invitationId), {
      status: 'revoked',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function acceptWorkspaceInvitation(params: {
  invitation: WorkspaceInvitation;
  user: { uid: string; displayName: string; photoURL?: string | null };
}): Promise<void> {
  const { invitation, user } = params;
  const path = `workspaces/${invitation.workspaceId}/invitations/${invitation.id}`;

  const memberPayload: Record<string, unknown> = {
    workspaceId: invitation.workspaceId,
    userId: user.uid,
    displayName: (user.displayName || 'Team Member').slice(0, 100),
    role: invitation.role,
    status: 'active',
    invitationId: invitation.id,
    visibleMemberIds: [user.uid, invitation.workspaceOwnerId].slice(0, 25),
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (user.photoURL) {
    memberPayload.photoURL = user.photoURL.slice(0, 500);
  }

  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'workspaces', invitation.workspaceId, 'invitations', invitation.id), {
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });
    batch.set(
      doc(db, 'workspaces', invitation.workspaceId, 'members', user.uid),
      memberPayload,
    );
    batch.set(
      doc(db, 'users', user.uid, 'workspaceRefs', invitation.workspaceId),
      {
        workspaceId: invitation.workspaceId,
        userId: user.uid,
        workspaceName: invitation.workspaceName,
        workspaceSlug: invitation.workspaceSlug,
        role: invitation.role,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    );
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateMemberRole(params: {
  workspaceId: string;
  targetUserId: string;
  role: Exclude<WorkspaceRole, 'owner'>;
  actorId: string;
  actorName: string;
  memberIds: string[];
}): Promise<void> {
  const path = `workspaces/${params.workspaceId}/members/${params.targetUserId}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'workspaces', params.workspaceId, 'members', params.targetUserId), {
      role: params.role,
      updatedAt: serverTimestamp(),
    });
    const logId = generateId();
    batch.set(doc(db, 'workspaces', params.workspaceId, 'activityLogs', logId), {
      id: logId,
      workspaceId: params.workspaceId,
      actorId: params.actorId,
      actorName: params.actorName.slice(0, 100),
      entityType: 'member',
      entityId: params.targetUserId,
      action: 'role_updated',
      summary: `Changed member role to ${params.role}`,
      memberIds: params.memberIds.slice(0, 25),
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeWorkspaceMember(params: {
  workspaceId: string;
  targetUserId: string;
}): Promise<void> {
  const path = `workspaces/${params.workspaceId}/members/${params.targetUserId}`;
  try {
    await deleteDoc(doc(db, 'workspaces', params.workspaceId, 'members', params.targetUserId));
    await deleteDoc(doc(db, 'users', params.targetUserId, 'workspaceRefs', params.workspaceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
