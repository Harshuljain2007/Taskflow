import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { NoWorkspaceView } from '@/src/features/workspaces/NoWorkspaceView';
import { useWorkspace } from '@/src/features/workspaces/WorkspaceContext';
import { formatShortDate, isOverdueDate } from '@/src/lib/dateUtils';
import { TASK_PRIORITIES, TASK_STATUSES } from '@/src/lib/validation';
import { useUiStore } from '@/src/stores/uiStore';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-[#DC2626] font-semibold',
  high: 'text-[#D97706] font-medium',
  medium: 'text-[#3B82F6]',
  low: 'text-[#6B7280]',
};

export function TasksListPage() {
  const { refsLoaded, workspaceRefs, tasks, projects, members, canEdit } = useWorkspace();
  const { setSelectedTaskId, openCreateTask } = useUiStore();

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const priorityRank = { urgent: 0, high: 1, medium: 2, low: 3 };

    return tasks
      .filter((t) => {
        if (projectFilter !== 'all' && t.projectId !== projectFilter) return false;
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (!q) return true;
        return (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.labels.some((l) => l.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          return priorityRank[a.priority] - priorityRank[b.priority];
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
      });
  }, [tasks, search, projectFilter, statusFilter, priorityFilter, sortBy]);

  if (refsLoaded && workspaceRefs.length === 0) {
    return <NoWorkspaceView />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-[#171923]">Tasks</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Search, filter, prioritize, and inspect deliverables across workspace projects.
          </p>
        </div>
        {canEdit ? (
          <Button onClick={() => openCreateTask()}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks or labels..."
            className="pl-9"
          />
        </div>
        <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.key} · {p.name}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {TASK_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All Priorities</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Sort tasks"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'title')}
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </Select>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description={
            tasks.length === 0
              ? 'Create your first task to start tracking work.'
              : 'No tasks match your current filters.'
          }
          action={
            canEdit && tasks.length === 0 ? (
              <Button onClick={() => openCreateTask()}>Create First Task</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-[#E5E7EB] bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F7F8FA] text-xs font-medium text-[#6B7280]">
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Assignees</th>
                <th className="px-4 py-3 text-right">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredTasks.map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                const overdue = isOverdueDate(task.dueDate, task.status);
                const statusLabel =
                  TASK_STATUSES.find((s) => s.value === task.status)?.label ?? task.status;

                return (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="transition-colors hover:bg-[#F7F8FA] cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#171923]">{task.title}</p>
                      {task.labels.length > 0 ? (
                        <p className="mt-0.5 text-xs text-[#6B7280]">{task.labels.join(' · ')}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">
                      {project?.key ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#171923] whitespace-nowrap">
                      {statusLabel}
                    </td>
                    <td
                      className={`px-4 py-3 text-xs capitalize whitespace-nowrap ${
                        PRIORITY_COLORS[task.priority] ?? 'text-[#6B7280]'
                      }`}
                    >
                      {task.priority}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-1.5">
                        {task.assigneeIds.slice(0, 3).map((uid) => {
                          const m = members.find((mem) => mem.userId === uid);
                          return (
                            <Avatar
                              key={uid}
                              name={m?.displayName ?? 'Member'}
                              photoURL={m?.photoURL}
                              size="xs"
                            />
                          );
                        })}
                        {task.assigneeIds.length === 0 ? (
                          <span className="text-xs text-[#6B7280]">Unassigned</span>
                        ) : null}
                      </div>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono text-xs tabular-nums whitespace-nowrap ${
                        overdue ? 'text-[#DC2626] font-semibold' : 'text-[#6B7280]'
                      }`}
                    >
                      {task.dueDate ? formatShortDate(task.dueDate) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
