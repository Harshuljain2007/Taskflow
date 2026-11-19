import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MailCheck, Plus } from 'lucide-react';
import { useFirebase } from '@/src/app/providers';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { NoWorkspaceView } from '@/src/features/workspaces/NoWorkspaceView';
import { useWorkspace } from '@/src/features/workspaces/WorkspaceContext';
import {
  formatRelativeDateTime,
  formatShortDate,
  isApproachingDate,
  isOverdueDate,
} from '@/src/lib/dateUtils';
import { TASK_STATUSES } from '@/src/lib/validation';
import { acceptWorkspaceInvitation } from '@/src/services/firestore/workspaceService';
import { useUiStore } from '@/src/stores/uiStore';

export function DashboardPage() {
  const { user } = useFirebase();
  const {
    refsLoaded,
    workspaceRefs,
    activeWorkspace,
    projects,
    tasks,
    members,
    activityLogs,
    pendingInvitations,
    canEdit,
  } = useWorkspace();
  const { setSelectedTaskId, openCreateTask, setActiveWorkspaceId } = useUiStore();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const overdueTasks = tasks.filter((t) => isOverdueDate(t.dueDate, t.status)).length;
    const pendingTasks = totalTasks - completedTasks;

    const statusData = TASK_STATUSES.map((s) => ({
      name: s.label,
      count: tasks.filter((t) => t.status === s.value).length,
    }));

    const myTasks = user
      ? tasks.filter((t) => t.assigneeIds.includes(user.uid) && t.status !== 'done')
      : [];

    const upcomingDeadlines = tasks
      .filter((t) => t.dueDate && t.status !== 'done')
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
      .slice(0, 6);

    const workload = members.map((member) => {
      const assigned = tasks.filter((t) => t.assigneeIds.includes(member.userId));
      const doneCount = assigned.filter((t) => t.status === 'done').length;
      return {
        member,
        openCount: assigned.length - doneCount,
        doneCount,
      };
    });

    return {
      totalProjects: projects.length,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      statusData,
      myTasks,
      upcomingDeadlines,
      workload,
    };
  }, [projects, tasks, members, user]);

  if (refsLoaded && workspaceRefs.length === 0) {
    return <NoWorkspaceView />;
  }

  const handleAcceptInvite = async (inv: (typeof pendingInvitations)[number]) => {
    if (!user) return;
    setAcceptingId(inv.id);
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
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-[#171923]">
            Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Real-time overview across {activeWorkspace?.name ?? 'your workspace'}.
          </p>
        </div>
        {canEdit && projects.length > 0 ? (
          <Button onClick={() => openCreateTask()}>
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        ) : null}
      </div>

      {pendingInvitations.length > 0 ? (
        <div className="rounded-[12px] border border-[#635BDB]/30 bg-[#635BDB]/[0.04] p-4 space-y-3">
          <p className="text-sm font-semibold text-[#171923]">
            Pending Workspace Invitations ({pendingInvitations.length})
          </p>
          <div className="space-y-2">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col gap-2 rounded-[10px] border border-[#E5E7EB] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-xs">
                  <span className="font-semibold text-[#171923]">{inv.workspaceName}</span>
                  <span className="text-[#6B7280]">
                    {' '}
                    · Invited by {inv.invitedByName} as {inv.role}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => void handleAcceptInvite(inv)}
                  disabled={acceptingId === inv.id}
                >
                  <MailCheck className="h-3.5 w-3.5" />
                  {acceptingId === inv.id ? 'Joining...' : 'Join Workspace'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'Total Projects', value: metrics.totalProjects, tone: 'text-[#171923]' },
          { label: 'Total Tasks', value: metrics.totalTasks, tone: 'text-[#171923]' },
          { label: 'Completed', value: metrics.completedTasks, tone: 'text-[#16A34A]' },
          { label: 'Pending', value: metrics.pendingTasks, tone: 'text-[#3B82F6]' },
          { label: 'Overdue', value: metrics.overdueTasks, tone: 'text-[#DC2626]' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-[#6B7280]">{kpi.label}</p>
              <p className={`mt-2 text-2xl font-bold font-mono tabular-nums ${kpi.tone}`}>
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects in this workspace yet"
          description="Create your first project to unlock Kanban boards, task assignments, deadlines, and real-time analytics."
          action={
            <Link to="/app/projects">
              <Button>Go to Projects</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Task Distribution by Status</CardTitle>
              <CardDescription>Live task breakdown across workflow stages</CardDescription>
            </CardHeader>
            <CardContent className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <BarChart data={metrics.statusData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#635BDB" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Workload</CardTitle>
              <CardDescription>Open vs completed tasks per member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.workload.length === 0 ? (
                <p className="text-sm text-[#6B7280]">No team members found.</p>
              ) : (
                metrics.workload.map(({ member, openCount, doneCount }) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between gap-3 py-1.5 border-b border-[#E5E7EB] last:border-b-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={member.displayName} photoURL={member.photoURL} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[#171923]">
                          {member.displayName}
                        </p>
                        <p className="text-[11px] capitalize text-[#6B7280]">{member.role}</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-xs font-mono tabular-nums text-[#6B7280]">
                      {openCount} open · {doneCount} done
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Assigned Tasks</CardTitle>
              <CardDescription>Active items assigned to you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {metrics.myTasks.length === 0 ? (
                <p className="text-sm text-[#6B7280]">You have no pending assigned tasks.</p>
              ) : (
                metrics.myTasks.slice(0, 6).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedTaskId(task.id)}
                    className="w-full rounded-[10px] border border-[#E5E7EB] p-3 text-left transition-colors hover:bg-[#F7F8FA] cursor-pointer"
                  >
                    <p className="text-sm font-medium text-[#171923] truncate">{task.title}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      {task.priority} priority · {task.dueDate ? `Due ${formatShortDate(task.dueDate)}` : 'No due date'}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Nearest target dates across projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {metrics.upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-[#6B7280]">No tasks with upcoming due dates.</p>
              ) : (
                metrics.upcomingDeadlines.map((task) => {
                  const overdue = isOverdueDate(task.dueDate, task.status);
                  const soon = isApproachingDate(task.dueDate, task.status);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-[#E5E7EB] p-3 text-left transition-colors hover:bg-[#F7F8FA] cursor-pointer"
                    >
                      <span className="truncate text-xs font-medium text-[#171923]">
                        {task.title}
                      </span>
                      <span
                        className={`shrink-0 text-xs font-mono tabular-nums ${
                          overdue
                            ? 'text-[#DC2626] font-semibold'
                            : soon
                              ? 'text-[#D97706] font-medium'
                              : 'text-[#6B7280]'
                        }`}
                      >
                        {formatShortDate(task.dueDate)}
                      </span>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest workspace updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activityLogs.length === 0 ? (
                <p className="text-sm text-[#6B7280]">No recorded activity yet.</p>
              ) : (
                activityLogs.slice(0, 6).map((log) => (
                  <div
                    key={log.id}
                    className="border-b border-[#E5E7EB] pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <p className="text-xs text-[#171923]">
                      <span className="font-semibold">{log.actorName}</span> · {log.summary}
                    </p>
                    <p className="mt-0.5 text-[11px] font-mono text-[#6B7280]">
                      {formatRelativeDateTime(log.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
