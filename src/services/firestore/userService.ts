import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import type { UserPrivateInfo, UserPublicProfile } from '@/src/types/domain';

export async function getUserPublicProfile(uid: string): Promise<UserPublicProfile | null> {
  const path = `users/${uid}/public/profile`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'public', 'profile'));
    return snap.exists() ? (snap.data() as UserPublicProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateUserPublicProfile(params: {
  uid: string;
  displayName: string;
  jobTitle?: string;
  bio?: string;
}): Promise<void> {
  const path = `users/${params.uid}/public/profile`;
  try {
    await updateDoc(doc(db, 'users', params.uid, 'public', 'profile'), {
      displayName: params.displayName.trim().slice(0, 100),
      jobTitle: (params.jobTitle ?? '').trim().slice(0, 80),
      bio: (params.bio ?? '').trim().slice(0, 300),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getUserPrivateInfo(uid: string): Promise<UserPrivateInfo | null> {
  const path = `users/${uid}/private/info`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'private', 'info'));
    return snap.exists() ? (snap.data() as UserPrivateInfo) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateUserPreferences(params: {
  uid: string;
  email: string;
  notifyTaskAssigned: boolean;
  notifyComments: boolean;
  notifyDeadlines: boolean;
  themePreference: 'light' | 'dark' | 'system';
}): Promise<void> {
  const path = `users/${params.uid}/private/info`;
  try {
    await updateDoc(doc(db, 'users', params.uid, 'private', 'info'), {
      email: params.email,
      notifyTaskAssigned: params.notifyTaskAssigned,
      notifyComments: params.notifyComments,
      notifyDeadlines: params.notifyDeadlines,
      themePreference: params.themePreference,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
