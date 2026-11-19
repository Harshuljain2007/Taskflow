import mongoose from 'mongoose';
import { getFirebaseConfigSummary } from './firebase.ts';

export type DatabaseConnectionState =
  | 'configured'
  | 'connected'
  | 'connecting'
  | 'disconnecting'
  | 'disconnected'
  | 'unconfigured';

export interface DatabaseStatus {
  provider: 'firebase-firestore' | 'mongodb';
  state: DatabaseConnectionState;
  ready: boolean;
  configured: boolean;
  projectId: string | null;
  databaseId: string | null;
  lastError: string | null;
}

let lastConnectionError: string | null = null;
let mongoConfiguredFlag = false;

function mapMongoReadyState(readyState: number): DatabaseConnectionState {
  switch (readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'disconnected';
  }
}

export function sanitizeMongoError(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error);
  return rawMessage.replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, 'mongodb$1://***:***@');
}

export async function connectDatabase(uri: string): Promise<DatabaseStatus> {
  const firebaseSummary = getFirebaseConfigSummary();
  const trimmedUri = uri.trim();

  if (firebaseSummary.configured && !trimmedUri) {
    mongoConfiguredFlag = false;
    lastConnectionError = null;
    return getDatabaseStatus();
  }

  if (!trimmedUri) {
    mongoConfiguredFlag = false;
    lastConnectionError = 'No database connection configured.';
    return getDatabaseStatus();
  }

  mongoConfiguredFlag = true;
  lastConnectionError = null;
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(trimmedUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    lastConnectionError = null;
  } catch (error) {
    lastConnectionError = sanitizeMongoError(error);
  }

  return getDatabaseStatus();
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  const firebaseSummary = getFirebaseConfigSummary();

  if (firebaseSummary.configured) {
    return {
      provider: 'firebase-firestore',
      state: 'configured',
      ready: true,
      configured: true,
      projectId: firebaseSummary.projectId,
      databaseId: firebaseSummary.databaseId,
      lastError: null,
    };
  }

  const readyState = mongoose.connection.readyState;

  if (!mongoConfiguredFlag && readyState === 0) {
    return {
      provider: 'mongodb',
      state: 'unconfigured',
      ready: false,
      configured: false,
      projectId: null,
      databaseId: null,
      lastError: lastConnectionError ?? 'Neither Firebase Firestore nor MONGODB_URI is configured.',
    };
  }

  return {
    provider: 'mongodb',
    state: mapMongoReadyState(readyState),
    ready: readyState === 1,
    configured: mongoConfiguredFlag || readyState === 1,
    projectId: null,
    databaseId: null,
    lastError: readyState === 1 ? null : lastConnectionError,
  };
}
