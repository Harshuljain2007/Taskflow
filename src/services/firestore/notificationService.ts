import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { generateId } from '@/src/lib/validation';
import type { NotificationItem, NotificationType } from '@/src/types/domain';

export function subscribeNotifications(
  userId: string,
  onData: (items: NotificationItem[]) => void,
): Unsubscribe {
  const path = `users/${userId}/notifications`;
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as NotificationItem);
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
}

export async function createNotification(params: {
  recipientUserId: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationItem['entityType'];
  entityId: string;
  createdBy: string;
}): Promise<void> {
  if (!params.recipientUserId || params.recipientUserId === params.createdBy) {
    return;
  }
  const id = generateId();
  const path = `users/${params.recipientUserId}/notifications/${id}`;
  try {
    await setDoc(doc(db, 'users', params.recipientUserId, 'notifications', id), {
      id,
      workspaceId: params.workspaceId,
      userId: params.recipientUserId,
      type: params.type,
      title: params.title.slice(0, 120),
      message: params.message.slice(0, 300),
      entityType: params.entityType,
      entityId: params.entityId,
      read: false,
      createdBy: params.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  const path = `users/${userId}/notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), {
      read: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markAllNotificationsRead(
  userId: string,
  unreadIds: string[],
): Promise<void> {
  if (unreadIds.length === 0) return;
  const path = `users/${userId}/notifications`;
  try {
    const batch = writeBatch(db);
    for (const id of unreadIds) {
      batch.update(doc(db, 'users', userId, 'notifications', id), {
        read: true,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
