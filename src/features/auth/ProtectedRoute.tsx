import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useFirebase } from '@/src/app/providers';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, authReady } = useFirebase();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3" aria-busy="true" aria-label="Checking session">
          <div className="h-6 w-36 animate-pulse rounded bg-[#F7F8FA]" />
          <div className="h-4 w-64 animate-pulse rounded bg-[#F7F8FA]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
