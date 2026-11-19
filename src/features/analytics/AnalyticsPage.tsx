import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { NoWorkspaceView } from '@/src/features/workspaces/NoWorkspaceView';
import { useWorkspace } from '@/src/features/workspaces/WorkspaceContext';
import { isOverdueDate, toJsDate } from '@/src/lib/dateUtils';
import { TASK_PRIORITIES, TASK_STATUSES } from '@/src/lib/validation';

const PRIORITY_COLORS = ['#94A3B8', '#3B82F6', '#F59E0B', '#DC2626'];

export function AnalyticsPage() {
  const { refsLoaded, workspaceRefs, tasks, projects, members, activityLogs } = useWorkspace();

  const analytics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const overdue = tasks.filter((t) => isOverdueDate(t.dueDate, t.status)).length;
    const pending = total - completed;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const byStatus = TASK_STATUSES.map((s) => ({
      name: s.label,
      count: tasks.filter((t) => t.status === s.value).length,
    }));

    const byPriority = TASK_PRIORITIES.map((p) => ({
      name: p.label,
      value: tasks.filter((t) => t.priority === p.value).length,
    }));

    const projectProgress = projects.map((p) => {
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      const pDone = pTasks.filter((t) => t.status === 'done').length;
      return {
        name: p.key,
        completed: pDone,
        pending: pTasks.length - pDone,
      };
    });

    const teamWorkload = members.map((m) => {
      const mTasks = tasks.filter((t) => t.assigneeIds.includes(m.userId));
      const mDone = mTasks.filter((t) => t.status === 'done').length;
      return {
        name: m.displayName.split(' ')[0],
        open: mTasks.length - mDone,
        done: mDone,
      };
    });

    const activityTrend = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const events = activityLogs.filter((log) => {
        const dt = toJsDate(log.createdAt);
        return dt ? dt.toISOString().slice(0, 10) === iso : false;
      }).length;
      return { date: label, events };
    });

    return {
      total,
      completed,
      pending,
      overdue,
      completionPct,
      byStatus,
      byPriority,
      projectProgress,
      teamWorkload,
      activityTrend,
    };
  }, [tasks, projects, members, activityLogs]);

  if (refsLoaded && workspaceRefs.length === 0) {
    return <NoWorkspaceView />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[26px] font-bold tracking-tight text-[#171923]">Analytics</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Metrics computed directly from live workspace projects, tasks, and activity records.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'Total Tasks', value: analytics.total },
          { label: 'Completed', value: analytics.completed },
          { label: 'Pending', value: analytics.pending },
          { label: 'Overdue', value: analytics.overdue },
          { label: 'Completion Rate', value: `${analytics.completionPct}%` },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-[#6B7280]">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#171923]">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {analytics.total === 0 ? (
        <EmptyState
          title="Insufficient task data for analytics"
          description="Create tasks across your projects to generate completion rates, priority distributions, and workload charts from real workspace records."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Task Distribution by Status</CardTitle>
              <CardDescription>Current count per workflow column</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <BarChart data={analytics.byStatus} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#635BDB" radius={[6, 6, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Priority Breakdown</CardTitle>
              <CardDescription>Share of tasks across priority tiers</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <PieChart>
                  <Pie
                    data={analytics.byPriority}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {analytics.byPriority.map((entry, idx) => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[idx % PRIORITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
              <CardDescription>Completed vs pending tasks per project</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <BarChart data={analytics.projectProgress} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="completed" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="pending" stackId="a" fill="#E5E7EB" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Workload</CardTitle>
              <CardDescription>Open vs completed assignments per teammate</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <BarChart data={analytics.teamWorkload} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="open" stackId="w" fill="#635BDB" maxBarSize={40} />
                  <Bar dataKey="done" stackId="w" fill="#16A34A" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>7-Day Activity Trend</CardTitle>
              <CardDescription>Recorded workspace events over the past 7 days</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <AreaChart data={analytics.activityTrend} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="#635BDB"
                    fill="#635BDB"
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
