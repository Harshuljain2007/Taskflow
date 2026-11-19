import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FirestoreConnectionCheck {
  online: boolean;
  projectId: string;
  databaseId: string;
  checkedAt: string;
  error: string | null;
}

const VALID_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const MAX_DISPLAY_NAME_LENGTH = 100;
const MAX_PHOTO_URL_LENGTH = 500;
const MAX_EMAIL_LENGTH = 254;

export async function testConnection(): Promise<FirestoreConnectionCheck> {
  const checkedAt = new Date().toISOString();
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return {
      online: true,
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
      checkedAt,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // A permission-denied response confirms the Firestore server was reached and rules evaluated.
    if (message.toLowerCase().includes('permission') || message.includes('PERMISSION_DENIED')) {
      return {
        online: true,
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId,
        checkedAt,
        error: null,
      };
    }

    if (message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }

    return {
      online: false,
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
      checkedAt,
      error: message,
    };
  }
}

export async function signInWithGooglePopup(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await syncUserProfileToFirestore(result.user);
  return result.user;
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

export async function syncUserProfileToFirestore(user: User): Promise<void> {
  if (!VALID_ID_REGEX.test(user.uid) || user.uid.length > 128) {
    throw new Error('Invalid user UID format for Firestore blueprint constraints.');
  }

  const rawDisplayName = (user.displayName || user.email?.split('@')[0] || 'TaskFlow User').trim();
  const displayName = rawDisplayName.slice(0, MAX_DISPLAY_NAME_LENGTH) || 'TaskFlow User';
  const photoURL = user.photoURL ? user.photoURL.slice(0, MAX_PHOTO_URL_LENGTH) : undefined;

  const publicPath = `users/${user.uid}/public/profile`;
  const publicRef = doc(db, 'users', user.uid, 'public', 'profile');

  try {
    const existingPublic = await getDoc(publicRef);
    if (!existingPublic.exists()) {
      const payload: Record<string, unknown> = {
        uid: user.uid,
        displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (photoURL) {
        payload.photoURL = photoURL;
      }
      await setDoc(publicRef, payload);
    } else {
      const updatePayload: Record<string, unknown> = {
        displayName,
        updatedAt: serverTimestamp(),
      };
      if (photoURL) {
        updatePayload.photoURL = photoURL;
      }
      await updateDoc(publicRef, updatePayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }

  if (user.email) {
    const email = user.email.trim().slice(0, MAX_EMAIL_LENGTH);
    const privatePath = `users/${user.uid}/private/info`;
    const privateRef = doc(db, 'users', user.uid, 'private', 'info');

    try {
      const existingPrivate = await getDoc(privateRef);
      if (!existingPrivate.exists()) {
        await setDoc(privateRef, {
          uid: user.uid,
          email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(privateRef, {
          email,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, privatePath);
    }
  }
}

export { firebaseConfig };
