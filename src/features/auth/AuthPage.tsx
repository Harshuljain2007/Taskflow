import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useFirebase } from '@/src/app/providers';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/Card';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export function AuthPage({ mode }: AuthPageProps) {
  const { user, authReady, authLoading, authError, signInWithGoogle } = useFirebase();
  const navigate = useNavigate();

  useEffect(() => {
    if (authReady && user) {
      navigate('/app', { replace: true });
    }
  }, [authReady, user, navigate]);

  const title = mode === 'register' ? 'Create your TaskFlow account' : 'Sign in to TaskFlow';
  const subtitle =
    mode === 'register'
      ? 'Start managing workspaces, Kanban boards, and team deliverables with verified Google sign-in.'
      : 'Access your workspaces, projects, tasks, and real-time team updates.';

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#171923] flex flex-col">
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-lg font-bold tracking-tight text-[#171923]">
            TaskFlow
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#171923]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-[22px]">{title}</CardTitle>
            <CardDescription className="mt-1.5">{subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button
              size="lg"
              className="w-full"
              onClick={() => void signInWithGoogle()}
              disabled={authLoading || !authReady}
            >
              {authLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </Button>

            {authError ? (
              <p className="rounded-[10px] border border-[#DC2626]/30 bg-[#DC2626]/5 px-3.5 py-2.5 text-xs text-[#DC2626]">
                {authError}
              </p>
            ) : null}

            <div className="rounded-[10px] border border-[#E5E7EB] bg-[#F7F8FA] p-4 text-xs leading-relaxed text-[#6B7280]">
              <div className="flex items-center gap-2 font-semibold text-[#171923]">
                <ShieldCheck className="h-4 w-4 text-[#16A34A] shrink-0" />
                <span>Verified Identity & Tenant Isolation</span>
              </div>
              <p className="mt-1.5">
                Authentication uses Firebase Auth with verified Google accounts. Every workspace
                query and mutation is enforced server-side by Firestore security rules.
              </p>
            </div>

            <div className="border-t border-[#E5E7EB] pt-4 text-center text-xs text-[#6B7280]">
              {mode === 'login' ? (
                <>
                  New to TaskFlow?{' '}
                  <Link to="/register" className="font-medium text-[#635BDB] hover:underline">
                    Create an account
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-[#635BDB] hover:underline">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
