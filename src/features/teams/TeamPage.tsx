import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MailPlus, Trash2, XCircle } from 'lucide-react';
import { useFirebase } from '@/src/app/providers';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { NoWorkspaceView } from '@/src/features/workspaces/NoWorkspaceView';
import { useWorkspace } from '@/src/features/workspaces/WorkspaceContext';
import { formatRelativeDateTime } from '@/src/lib/dateUtils';
import { invitationSchema } from '@/src/lib/validation';
import {
  inviteWorkspaceMember,
  removeWorkspaceMember,
  revokeWorkspaceInvitation,
  subscribeWorkspaceInvitations,
  updateMemberRole,
} from '@/src/services/firestore/workspaceService';
import type { WorkspaceInvitation, WorkspaceRole } from '@/src/types/domain';

type InviteFormValues = z.input<typeof invitationSchema>;

export function TeamPage() {
  const { user } = useFirebase();
  const {
    refsLoaded,
    workspaceRefs,
    activeWorkspace,
    activeWorkspaceId,
    members,
    tasks,
    activityLogs,
    canManage,
  } = useWorkspace();

  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: { email: '', role: 'member' },
  });

  useEffect(() => {
    if (!user || !activeWorkspaceId || !canManage) return;
    return subscribeWorkspaceInvitations(activeWorkspaceId, user.uid, setInvitations);
  }, [user, activeWorkspaceId, canManage]);

  if (refsLoaded && workspaceRefs.length === 0) {
    return <NoWorkspaceView />;
  }

  const onInvite = async (values: InviteFormValues) => {
    if (!user || !activeWorkspace) return;
    setInviteError(null);
    setInviteSuccess(null);
    try {
      await inviteWorkspaceMember({
        workspace: activeWorkspace,
        email: values.email,
        role: values.role,
        invitedBy: user.uid,
        invitedByName: user.displayName || user.email?.split('@')[0] || 'Admin',
        memberIds: members.map((m) => m.userId),
      });
      setInviteSuccess(`Invitation sent to ${values.email.trim().toLowerCase()}.`);
      reset({ email: '', role: 'member' });
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Unable to send invitation');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[26px] font-bold tracking-tight text-[#171923]">Team & Collaboration</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Manage workspace members, RBAC permissions, invitations, and activity history.
        </p>
      </div>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Invite Teammate</CardTitle>
            <CardDescription>
              Invited users can accept directly after signing in with their matching verified Google
              email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onInvite)} className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="teammate@company.com"
                  {...register('email')}
                />
                {errors.email ? (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.email.message}</p>
                ) : null}
              </div>
              <div className="w-full sm:w-40">
                <Select {...register('role')}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                <MailPlus className="h-4 w-4" />
                {isSubmitting ? 'Sending...' : 'Send Invite'}
              </Button>
            </form>
            {inviteError ? <p className="mt-2 text-xs text-[#DC2626]">{inviteError}</p> : null}
            {inviteSuccess ? <p className="mt-2 text-xs text-[#16A34A]">{inviteSuccess}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Member Directory ({members.length})</CardTitle>
          <CardDescription>Active collaborators and assigned task workload</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-[#E5E7EB]">
          {members.map((member) => {
            const assignedCount = tasks.filter(
              (t) => t.assigneeIds.includes(member.userId) && t.status !== 'done',
            ).length;
            const isOwnerRow = member.role === 'owner';

            return (
              <div
                key={member.userId}
                className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={member.displayName} photoURL={member.photoURL} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#171923]">
                      {member.displayName}
                      {member.userId === user?.uid ? ' (You)' : ''}
                    </p>
                    <p className="text-xs font-mono tabular-nums text-[#6B7280]">
                      {assignedCount} active tasks
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canManage && !isOwnerRow && activeWorkspaceId && user ? (
                    <>
                      <Select
                        aria-label={`Role for ${member.displayName}`}
                        value={member.role}
                        onChange={(e) =>
                          void updateMemberRole({
                            workspaceId: activeWorkspaceId,
                            targetUserId: member.userId,
                            role: e.target.value as Exclude<WorkspaceRole, 'owner'>,
                            actorId: user.uid,
                            actorName: user.displayName || 'Admin',
                            memberIds: members.map((m) => m.userId),
                          })
                        }
                        className="w-32 h-9 text-xs"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </Select>
                      <button
                        type="button"
                        aria-label={`Remove ${member.displayName}`}
                        onClick={() =>
                          void removeWorkspaceMember({
                            workspaceId: activeWorkspaceId,
                            targetUserId: member.userId,
                          })
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E5E7EB] text-[#6B7280] hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-medium capitalize text-[#6B7280]">
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {canManage && invitations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sent Invitations</CardTitle>
            <CardDescription>Manage pending and processed workspace invitations</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-[#E5E7EB]">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-[#171923]">{inv.email}</p>
                  <p className="text-xs capitalize text-[#6B7280]">
                    Role: {inv.role} · Status: {inv.status}
                  </p>
                </div>
                {inv.status === 'pending' && activeWorkspaceId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void revokeWorkspaceInvitation(activeWorkspaceId, inv.id)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Revoke
                  </Button>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Team Activity Log</CardTitle>
          <CardDescription>Immutable audit trail across workspace events</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-[#E5E7EB]">
          {activityLogs.length === 0 ? (
            <p className="text-sm text-[#6B7280]">No activity recorded yet.</p>
          ) : (
            activityLogs.slice(0, 15).map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-4 py-2.5 text-xs">
                <p className="text-[#171923]">
                  <span className="font-semibold">{log.actorName}</span> · {log.summary}
                </p>
                <span className="shrink-0 font-mono text-[#6B7280]">
                  {formatRelativeDateTime(log.createdAt)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
