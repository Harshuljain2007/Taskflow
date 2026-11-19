import fs from 'fs';
import path from 'path';

export interface FirebaseAppletConfigSummary {
  configured: boolean;
  projectId: string | null;
  databaseId: string | null;
  authDomain: string | null;
}

interface RawFirebaseConfig {
  projectId?: string;
  firestoreDatabaseId?: string;
  authDomain?: string;
}

export function getFirebaseConfigSummary(): FirebaseAppletConfigSummary {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');

  if (!fs.existsSync(configPath)) {
    return {
      configured: false,
      projectId: null,
      databaseId: null,
      authDomain: null,
    };
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as RawFirebaseConfig;

    const projectId = parsed.projectId?.trim() || null;
    const databaseId = parsed.firestoreDatabaseId?.trim() || null;
    const authDomain = parsed.authDomain?.trim() || null;

    const isPlaceholder =
      !projectId ||
      projectId === 'remixed-project-id' ||
      !databaseId;

    return {
      configured: !isPlaceholder,
      projectId,
      databaseId,
      authDomain,
    };
  } catch {
    return {
      configured: false,
      projectId: null,
      databaseId: null,
      authDomain: null,
    };
  }
}
