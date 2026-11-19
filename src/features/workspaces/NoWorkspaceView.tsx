import { useState } from 'react';
import { Plus, MailCheck } from 'lucide-react';
import { useFirebase } from '@/src/app/providers';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { CreateWorkspaceModal } from '@/src/features/workspaces/CreateWorkspaceModal';
import { useWorkspace } from '@/src/features/workspaces/WorkspaceContext';
import { acceptWorkspaceInvitation } from '@/src/services/firestore/workspaceService';
import { useUiStore } from '@/src/stores/uiStore';

export function NoWorkspaceView() {
  const { user } = useFirebase();
  const { pendingInvitations } = useWorkspace();
  const setActiveWorkspaceId = useUiStore((s) => s.setActiveWorkspaceId);
  const [createOpen, setCreateOpen] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async (inv: (typeof pendingInvitations)[number]) => {
    if (!user) return;
    setAcceptingId(inv.id);
    setError(null);
    try {
      await acceptWorkspaceInvitation({
        invitation: inv,
        user: {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Team Member',
          photoURL: user.photoURL,
        },
      });
      setActiveWorkspaceId(inv.workspaceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept invitation');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-[22px]">Welcome to TaskFlow</CardTitle>
          <CardDescription className="mt-1.5">
            Create your first workspace to organize projects, tasks, Kanban boards, and team
            collaboration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create First Workspace
          </Button>
        </CardContent>
      </Card>

      {pendingInvitations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending Workspace Invitations</CardTitle>
            <CardDescription>
              You have been invited to collaborate in the following workspaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? <p className="text-xs text-[#DC2626]">{error}</p> : null}
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col gap-3 rounded-[10px] border border-[#E5E7EB] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[#171923]">{inv.workspaceName}</p>
                  <p className="mt-0.5 text-xs text-[#6B7280]">
                    Invited by {inv.invitedByName} · Role: {inv.role}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => void handleAccept(inv)}
                  disabled={acceptingId === inv.id}
                >
                  <MailCheck className="h-4 w-4" />
                  {acceptingId === inv.id ? 'Joining...' : 'Accept & Join'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <CreateWorkspaceModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
