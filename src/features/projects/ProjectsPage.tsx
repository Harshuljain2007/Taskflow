import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Archive, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useFirebase } from '@/src/app/providers';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Dialog } from '@/src/components/ui/Dialog';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Textarea } from '@/src/components/ui/Textarea';
import { NoWorkspaceView } from '@/src/features/workspaces/NoWorkspaceView';
import { useWorkspace } from '@/src/features/workspaces/WorkspaceContext';
import { formatShortDate } from '@/src/lib/dateUtils';
import { PROJECT_STATUSES, projectSchema } from '@/src/lib/validation';
import {
  createProject,
  deleteProject,
  setProjectStatus,
  updateProject,
} from '@/src/services/firestore/projectService';
import type { Project, ProjectStatus } from '@/src/types/domain';

type ProjectFormValues = z.input<typeof projectSchema>;

export function ProjectsPage() {
  const { user } = useFirebase();
  const {
    refsLoaded,
    workspaceRefs,
    activeWorkspaceId,
    projects,
    tasks,
    members,
    canEdit,
    canManage,
  } = useWorkspace();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
      status: 'active',
      visibility: 'workspace',
      startDate: '',
      dueDate: '',
    },
  });

  const filteredProjects = useMemo(() => {
    const queryLower = searchTerm.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!queryLower) return true;
      return (
        p.name.toLowerCase().includes(queryLower) ||
        p.key.toLowerCase().includes(queryLower) ||
        p.description.toLowerCase().includes(queryLower)
      );
    });
  }, [projects, searchTerm, statusFilter]);

  if (refsLoaded && workspaceRefs.length === 0) {
    return <NoWorkspaceView />;
  }

  const openCreateModal = () => {
    setEditingProject(null);
    setFormError(null);
    reset({
      name: '',
      key: '',
      description: '',
      status: 'active',
      visibility: 'workspace',
      startDate: '',
      dueDate: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormError(null);
    reset({
      name: project.name,
      key: project.key,
      description: project.description,
      status: project.status,
      visibility: project.visibility,
      startDate: project.startDate ?? '',
      dueDate: project.dueDate ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: ProjectFormValues) => {
    if (!user || !activeWorkspaceId) return;
    setFormError(null);

    const normalizedKey = values.key.trim().toUpperCase();
    const duplicateKey = projects.some(
      (p) => p.key === normalizedKey && p.id !== editingProject?.id,
    );
    if (duplicateKey) {
      setFormError(`Project key "${normalizedKey}" already exists in this workspace.`);
      return;
    }

    try {
      const workspaceMemberIds = members.map((m) => m.userId);
      if (editingProject) {
        const nextMembers =
          values.visibility === 'private'
            ? [editingProject.ownerId]
            : Array.from(new Set([editingProject.ownerId, ...workspaceMemberIds])).slice(0, 25);

        await updateProject({
          workspaceId: activeWorkspaceId,
          projectId: editingProject.id,
          name: values.name,
          key: normalizedKey,
          description: values.description ?? '',
          status: values.status ?? 'active',
          visibility: values.visibility ?? 'workspace',
          memberIds: nextMembers,
          startDate: values.startDate,
          dueDate: values.dueDate,
        });
      } else {
        await createProject({
          workspaceId: activeWorkspaceId,
          name: values.name,
          key: normalizedKey,
          description: values.description ?? '',
          status: values.status ?? 'active',
          visibility: values.visibility ?? 'workspace',
          startDate: values.startDate,
          dueDate: values.dueDate,
          ownerId: user.uid,
          ownerName: user.displayName || user.email?.split('@')[0] || 'Member',
          workspaceMemberIds,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save project');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-[#171923]">Projects</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Track project milestones, team scope, and delivery progress.
          </p>
        </div>
        {canEdit ? (
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-[10px] bg-[#F7F8FA] p-1 border border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-[8px] whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-[#171923] shadow-xs'
                : 'text-[#6B7280] hover:text-[#171923]'
            }`}
          >
            All
          </button>
          {PROJECT_STATUSES.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setStatusFilter(st.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[8px] whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === st.value
                  ? 'bg-white text-[#171923] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#171923]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState
          title="No matching projects"
          description={
            projects.length === 0
              ? 'Create a project to start adding tasks and tracking progress.'
              : 'Try clearing your search or selecting another status filter.'
          }
          action={
            canEdit && projects.length === 0 ? (
              <Button onClick={openCreateModal}>Create First Project</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            const doneCount = projectTasks.filter((t) => t.status === 'done').length;
            const progress =
              projectTasks.length > 0 ? Math.round((doneCount / projectTasks.length) * 100) : 0;
            const canModifyProject = canManage || project.ownerId === user?.uid;

            return (
              <Card key={project.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#6B7280]">
                    <span className="font-mono font-semibold text-[#635BDB]">{project.key}</span>
                    <span className="capitalize">
                      {project.status.replace('_', ' ')} · {project.visibility}
                    </span>
                  </div>
                  <CardTitle className="mt-2">{project.name}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {project.description || 'No description provided.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#6B7280]">
                      <span>Progress</span>
                      <span className="font-mono tabular-nums text-[#171923]">
                        {doneCount}/{projectTasks.length} tasks ({progress}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#F7F8FA]">
                      <div
                        className="h-full rounded-full bg-[#635BDB] transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-xs text-[#6B7280]">
                    <span>
                      {project.dueDate ? `Due ${formatShortDate(project.dueDate)}` : 'No deadline'}
                    </span>

                    {canModifyProject && activeWorkspaceId ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${project.name}`}
                          onClick={() => openEditModal(project)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F7F8FA] hover:text-[#171923] cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {project.status === 'archived' ? (
                          <button
                            type="button"
                            aria-label={`Restore ${project.name}`}
                            onClick={() =>
                              void setProjectStatus(activeWorkspaceId, project.id, 'active')
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F7F8FA] hover:text-[#16A34A] cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Archive ${project.name}`}
                            onClick={() =>
                              void setProjectStatus(activeWorkspaceId, project.id, 'archived')
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F7F8FA] hover:text-[#D97706] cursor-pointer"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`Delete ${project.name}`}
                          onClick={() => void deleteProject(activeWorkspaceId, project.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F7F8FA] hover:text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProject ? 'Edit Project' : 'Create Project'}
        description="Projects group tasks, Kanban columns, deadlines, and team visibility."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="proj-name" className="block text-sm font-medium text-[#171923]">
                Project Name
              </label>
              <Input
                id="proj-name"
                placeholder="e.g. Core Web Platform"
                className="mt-1.5"
                {...register('name')}
              />
              {errors.name ? (
                <p className="mt-1 text-xs text-[#DC2626]">{errors.name.message}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="proj-key" className="block text-sm font-medium text-[#171923]">
                Key
              </label>
              <Input
                id="proj-key"
                placeholder="WEB"
                className="mt-1.5 uppercase font-mono"
                {...register('key')}
              />
              {errors.key ? (
                <p className="mt-1 text-xs text-[#DC2626]">{errors.key.message}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="proj-desc" className="block text-sm font-medium text-[#171923]">
              Description
            </label>
            <Textarea
              id="proj-desc"
              placeholder="Goals, deliverables, and key context"
              className="mt-1.5"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="proj-status" className="block text-sm font-medium text-[#171923]">
                Status
              </label>
              <Select id="proj-status" className="mt-1.5" {...register('status')}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="proj-visibility" className="block text-sm font-medium text-[#171923]">
                Visibility
              </label>
              <Select id="proj-visibility" className="mt-1.5" {...register('visibility')}>
                <option value="workspace">Workspace Members</option>
                <option value="private">Private (Owner Only)</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="proj-start" className="block text-sm font-medium text-[#171923]">
                Start Date
              </label>
              <Input id="proj-start" type="date" className="mt-1.5" {...register('startDate')} />
            </div>
            <div>
              <label htmlFor="proj-due" className="block text-sm font-medium text-[#171923]">
                Due Date
              </label>
              <Input id="proj-due" type="date" className="mt-1.5" {...register('dueDate')} />
            </div>
          </div>

          {formError ? (
            <p className="rounded-[10px] border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-xs text-[#DC2626]">
              {formError}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
