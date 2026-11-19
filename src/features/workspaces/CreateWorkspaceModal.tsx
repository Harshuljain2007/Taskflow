import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirebase } from '@/src/app/providers';
import { Button } from '@/src/components/ui/Button';
import { Dialog } from '@/src/components/ui/Dialog';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Textarea } from '@/src/components/ui/Textarea';
import { workspaceSchema } from '@/src/lib/validation';
import { createWorkspace } from '@/src/services/firestore/workspaceService';
import { useUiStore } from '@/src/stores/uiStore';

type WorkspaceFormValues = z.input<typeof workspaceSchema>;

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ open, onClose }: CreateWorkspaceModalProps) {
  const { user } = useFirebase();
  const setActiveWorkspaceId = useUiStore((s) => s.setActiveWorkspaceId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: '',
      description: '',
      defaultTaskStatus: 'todo',
      allowViewerComments: true,
    },
  });

  const onSubmit = async (values: WorkspaceFormValues) => {
    if (!user) return;
    setSubmitError(null);
    try {
      const created = await createWorkspace({
        name: values.name,
        description: values.description,
        defaultTaskStatus: values.defaultTaskStatus ?? 'todo',
        allowViewerComments: values.allowViewerComments ?? true,
        owner: {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Owner',
          photoURL: user.photoURL,
        },
      });
      setActiveWorkspaceId(created.id);
      reset();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to create workspace');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create Workspace"
      description="Workspaces isolate projects, tasks, team members, and activity logs."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="ws-name" className="block text-sm font-medium text-[#171923]">
            Workspace Name
          </label>
          <Input
            id="ws-name"
            placeholder="e.g. Acme Engineering"
            className="mt-1.5"
            {...register('name')}
          />
          {errors.name ? (
            <p className="mt-1 text-xs text-[#DC2626]">{errors.name.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="ws-desc" className="block text-sm font-medium text-[#171923]">
            Description
          </label>
          <Textarea
            id="ws-desc"
            placeholder="Optional summary of this team or organization"
            className="mt-1.5"
            {...register('description')}
          />
          {errors.description ? (
            <p className="mt-1 text-xs text-[#DC2626]">{errors.description.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="ws-default-status" className="block text-sm font-medium text-[#171923]">
            Default New Task Status
          </label>
          <Select id="ws-default-status" className="mt-1.5" {...register('defaultTaskStatus')}>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
          </Select>
        </div>

        {submitError ? (
          <p className="rounded-[10px] border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-xs text-[#DC2626]">
            {submitError}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Workspace'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
