import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import type { PlatformAdmin, Workspace } from '@/src/types/domain';

export async function listAllPlatformWorkspaces(): Promise<Workspace[]> {
  const path = 'workspaces';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => d.data() as Workspace);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function listPlatformAdmins(): Promise<PlatformAdmin[]> {
  const path = 'admins';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => d.data() as PlatformAdmin);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function grantPlatformAdmin(params: {
  uid: string;
  email: string;
  grantedBy: string;
}): Promise<void> {
  const path = `admins/${params.uid}`;
  try {
    await setDoc(doc(db, 'admins', params.uid), {
      uid: params.uid.trim().slice(0, 128),
      email: params.email.trim().toLowerCase().slice(0, 254),
      grantedBy: params.grantedBy,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function revokePlatformAdmin(uid: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    await deleteDoc(doc(db, 'admins', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
