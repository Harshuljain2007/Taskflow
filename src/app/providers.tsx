import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { MotionConfig } from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  auth,
  signInWithGooglePopup,
  signOutFirebase,
  testConnection,
  type FirestoreConnectionCheck,
} from '@/src/lib/firebase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;
  firestoreCheck: FirestoreConnectionCheck | null;
  checkingFirestore: boolean;
  recheckFirestore: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used inside AppProviders');
  }
  return ctx;
}

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [firestoreCheck, setFirestoreCheck] = useState<FirestoreConnectionCheck | null>(null);
  const [checkingFirestore, setCheckingFirestore] = useState(true);

  const recheckFirestore = useCallback(async () => {
    setCheckingFirestore(true);
    try {
      const result = await testConnection();
      setFirestoreCheck(result);
    } finally {
      setCheckingFirestore(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void testConnection().then((result) => {
      if (active) {
        setFirestoreCheck(result);
        setCheckingFirestore(false);
      }
    });
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGooglePopup();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Google sign-in failed');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signOutFirebase();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign-out failed');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseContext.Provider
        value={{
          user,
          authReady,
          authLoading,
          authError,
          firestoreCheck,
          checkingFirestore,
          recheckFirestore,
          signInWithGoogle,
          signOut,
        }}
      >
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </FirebaseContext.Provider>
    </QueryClientProvider>
  );
}
