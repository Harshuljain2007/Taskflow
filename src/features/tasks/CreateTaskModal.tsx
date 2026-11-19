import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirebase } from '@/src/app/providers';
import { Button } from '@/src/components/ui/Button';
import { Dialog } from '@/src/components/ui/Dialog';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Textarea } from '@/src/components/ui/Textarea';
import { useWorkspace } from '@/src/features/workspaces/WorkspaceContext';
import { TASK_PRIORITIES, TASK_STATUSES, taskSchema } from '@/src/lib/validation';
import { createTask } from '@/src/services/firestore/taskService';
import { useUiStore } from '@/src/stores/uiStore';

type TaskFormValues = z.input<typeof taskSchema>;

export function CreateTaskModal() {
  const { user } = useFirebase();
  const { activeWorkspaceId, projects, members, tasks } = useWorkspace();
  const {
    createTaskOpen,
    createTaskDefaultStatus,
    createTaskDefaultDueDate,
    createTaskDefaultProjectId,
    closeCreateTask,
  } = useUiStore();

  const [labelsInput, setLabelsInput] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeProjectIdFallback =
    projects.find((p) => p.status !== 'archived')?.id || projects[0]?.id || '';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      projectId: '',
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      startDate: '',
      dueDate: '',
    },
  });

  useEffect(() => {
    if (!createTaskOpen) return;
    const defaultProjId = createTaskDefaultProjectId || activeProjectIdFallback;
    reset({
      projectId: defaultProjId,
      title: '',
      description: '',
      status: createTaskDefaultStatus,
      priority: 'medium',
      startDate: '',
      dueDate: createTaskDefaultDueDate,
    });
    const timer = window.setTimeout(() => {
      setLabelsInput('');
      setSelectedAssignees([]);
      setSubmitError(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    createTaskOpen,
    createTaskDefaultStatus,
    createTaskDefaultDueDate,
    createTaskDefaultProjectId,
    activeProjectIdFallback,
    reset,
  ]);

  const toggleAssignee = (uid: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid].slice(0, 10),
    );
  };

  const onSubmit = async (values: TaskFormValues) => {
    if (!user || !activeWorkspaceId) return;
    setSubmitError(null);

    const project = projects.find((p) => p.id === values.projectId);
    if (!project) {
      setSubmitError('Please create or select a project first.');
      return;
    }

    const labels = labelsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);

    const status = values.status ?? 'todo';
    const columnTasks = tasks.filter((t) => t.status === status);
    const nextPosition =
      columnTasks.length > 0 ? Math.max(...columnTasks.map((t) => t.position)) + 1000 : 1000;

    try {
      await createTask({
        workspaceId: activeWorkspaceId,
        projectId: project.id,
        title: values.title,
        description: values.description ?? '',
        status,
        priority: values.priority ?? 'medium',
        assigneeIds: selectedAssignees,
        reporterId: user.uid,
        reporterName: user.displayName || user.email?.split('@')[0] || 'Member',
        projectMemberIds: project.memberIds,
        labels,
        startDate: values.startDate,
        dueDate: values.dueDate,
        position: nextPosition,
      });
      closeCreateTask();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to create task');
    }
  };

  return (
    <Dialog
      open={createTaskOpen}
      onClose={closeCreateTask}
      title="Create Task"
      description="Add a task with priority, assignees, labels, and target dates."
    >
      {projects.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-[#6B7280]">
            You need at least one project in this workspace before creating tasks.
          </p>
          <div className="flex justify-end">
            <Button onClick={closeCreateTask}>Close</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="task-project" className="block text-sm font-medium text-[#171923]">
              Project
            </label>
            <Select id="task-project" className="mt-1.5" {...register('projectId')}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.key} · {p.name}
                </option>
              ))}
            </Select>
            {errors.projectId ? (
              <p className="mt-1 text-xs text-[#DC2626]">{errors.projectId.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-[#171923]">
              Title
            </label>
            <Input
              id="task-title"
              placeholder="e.g. Implement workspace invitation flow"
              className="mt-1.5"
              {...register('title')}
            />
            {errors.title ? (
              <p className="mt-1 text-xs text-[#DC2626]">{errors.title.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="task-desc" className="block text-sm font-medium text-[#171923]">
              Description
            </label>
            <Textarea
              id="task-desc"
              placeholder="Acceptance criteria, links, or technical notes"
              className="mt-1.5"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-status" className="block text-sm font-medium text-[#171923]">
                Status
              </label>
              <Select id="task-status" className="mt-1.5" {...register('status')}>
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="task-priority" className="block text-sm font-medium text-[#171923]">
                Priority
              </label>
              <Select id="task-priority" className="mt-1.5" {...register('priority')}>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-start" className="block text-sm font-medium text-[#171923]">
                Start Date
              </label>
              <Input id="task-start" type="date" className="mt-1.5" {...register('startDate')} />
            </div>
            <div>
              <label htmlFor="task-due" className="block text-sm font-medium text-[#171923]">
                Due Date
              </label>
              <Input id="task-due" type="date" className="mt-1.5" {...register('dueDate')} />
            </div>
          </div>

          <div>
            <label htmlFor="task-labels" className="block text-sm font-medium text-[#171923]">
              Labels (comma separated)
            </label>
            <Input
              id="task-labels"
              value={labelsInput}
              onChange={(e) => setLabelsInput(e.target.value)}
              placeholder="frontend, security, sprint-4"
              className="mt-1.5"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-[#171923]">Assignees</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {members.map((member) => {
                const selected = selectedAssignees.includes(member.userId);
                return (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => toggleAssignee(member.userId)}
                    className={`rounded-[8px] border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#635BDB] bg-[#635BDB]/10 text-[#635BDB]'
                        : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#171923]'
                    }`}
                  >
                    {member.displayName}
                  </button>
                );
              })}
            </div>
          </div>

          {submitError ? (
            <p className="rounded-[10px] border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-xs text-[#DC2626]">
              {submitError}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={closeCreateTask} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
