import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { moveTaskPosition } from '@/src/services/firestore/taskService';
import { useUiStore } from '@/src/stores/uiStore';
import type { TaskItem, TaskStatus, WorkspaceMember } from '@/src/types/domain';

const PRIORITY_STYLE: Record<string, string> = {
  urgent: 'text-[#DC2626] font-semibold',
  high: 'text-[#D97706] font-medium',
  medium: 'text-[#3B82F6]',
  low: 'text-[#6B7280]',
};

interface KanbanCardProps {
  task: TaskItem;
  projectKey?: string;
  members: WorkspaceMember[];
  disabled: boolean;
  onOpen: (taskId: string) => void;
}

function KanbanCard({ task, projectKey, members, disabled, onOpen }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled,
    data: { status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isOverdueDate(task.dueDate, task.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task.id)}
      className={`rounded-[10px] border border-[#E5E7EB] bg-white p-3.5 text-left transition-shadow hover:border-[#635BDB]/50 cursor-pointer ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-[11px] text-[#6B7280]">
        <span className="font-mono font-semibold text-[#635BDB]">{projectKey ?? 'TASK'}</span>
        <span className={`capitalize ${PRIORITY_STYLE[task.priority] ?? ''}`}>
          {task.priority}
        </span>
      </div>

      <p className="mt-1.5 text-sm font-medium leading-snug text-[#171923]">{task.title}</p>

      {task.labels.length > 0 ? (
        <p className="mt-1.5 text-[11px] text-[#6B7280] truncate">{task.labels.join(' · ')}</p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-[#E5E7EB]">
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
        </div>

        <span
          className={`text-[11px] font-mono tabular-nums ${
            overdue ? 'text-[#DC2626] font-semibold' : 'text-[#6B7280]'
          }`}
        >
          {task.dueDate ? formatShortDate(task.dueDate) : ''}
        </span>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  tasks,
  projectsMap,
  members,
  canEdit,
  onOpenTask,
  onAddTask,
}: {
  status: TaskStatus;
  label: string;
  tasks: TaskItem[];
  projectsMap: Map<string, string>;
  members: WorkspaceMember[];
  canEdit: boolean;
  onOpenTask: (id: string) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}`, data: { status } });

  const itemIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[420px] w-72 shrink-0 flex-col rounded-[12px] border border-[#E5E7EB] p-3 transition-colors ${
        isOver ? 'bg-[#635BDB]/[0.05] border-[#635BDB]/40' : 'bg-[#F7F8FA]'
      }`}
    >
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-[#171923]">{label}</h3>
          <span className="text-xs font-mono tabular-nums text-[#6B7280]">{tasks.length}</span>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={() => onAddTask(status)}
            aria-label={`Add task to ${label}`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] hover:bg-white hover:text-[#171923] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2.5">
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              projectKey={projectsMap.get(task.projectId)}
              members={members}
              disabled={!canEdit}
              onOpen={onOpenTask}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanPage() {
  const { refsLoaded, workspaceRefs, activeWorkspaceId, tasks, projects, members, canEdit } =
    useWorkspace();
  const setSelectedTaskId = useUiStore((s) => s.setSelectedTaskId);
  const openCreateTask = useUiStore((s) => s.openCreateTask);

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [optimisticOverrides, setOptimisticOverrides] = useState<
    Record<string, { status: TaskStatus; position: number }>
  >({});
  const [moveError, setMoveError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const projectsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) map.set(p.id, p.key);
    return map;
  }, [projects]);

  const effectiveTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .map((t) => {
        const override = optimisticOverrides[t.id];
        return override ? { ...t, status: override.status, position: override.position } : t;
      })
      .filter((t) => {
        if (projectFilter !== 'all' && t.projectId !== projectFilter) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (!q) return true;
        return (
          t.title.toLowerCase().includes(q) ||
          t.labels.some((l) => l.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.position - b.position);
  }, [tasks, optimisticOverrides, search, projectFilter, priorityFilter]);

  if (refsLoaded && workspaceRefs.length === 0) {
    return <NoWorkspaceView />;
  }

  const activeDragTask = activeTaskId ? effectiveTasks.find((t) => t.id === activeTaskId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
    setMoveError(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTaskId(null);
    if (!canEdit || !activeWorkspaceId || !event.over) return;

    const draggedId = String(event.active.id);
    const overId = String(event.over.id);
    const draggedTask = effectiveTasks.find((t) => t.id === draggedId);
    if (!draggedTask) return;

    let targetStatus: TaskStatus = draggedTask.status;
    if (overId.startsWith('col-')) {
      targetStatus = overId.replace('col-', '') as TaskStatus;
    } else {
      const overTask = effectiveTasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    const columnTasks = effectiveTasks.filter(
      (t) => t.status === targetStatus && t.id !== draggedId,
    );

    let newPosition = 1000;
    if (overId.startsWith('col-')) {
      newPosition =
        columnTasks.length > 0 ? Math.max(...columnTasks.map((t) => t.position)) + 1000 : 1000;
    } else {
      const overIndex = columnTasks.findIndex((t) => t.id === overId);
      if (overIndex === -1) {
        newPosition =
          columnTasks.length > 0 ? Math.max(...columnTasks.map((t) => t.position)) + 1000 : 1000;
      } else {
        const prevPos = overIndex > 0 ? columnTasks[overIndex - 1].position : 0;
        const nextPos = columnTasks[overIndex].position;
        newPosition = Math.max(1, Math.round((prevPos + nextPos) / 2));
        if (newPosition === nextPos) {
          newPosition = Math.max(1, nextPos - 1);
        }
      }
    }

    if (draggedTask.status === targetStatus && draggedTask.position === newPosition) {
      return;
    }

    setOptimisticOverrides((prev) => ({
      ...prev,
      [draggedId]: { status: targetStatus, position: newPosition },
    }));

    try {
      await moveTaskPosition({
        workspaceId: activeWorkspaceId,
        taskId: draggedId,
        status: targetStatus,
        position: newPosition,
      });
      setOptimisticOverrides((prev) => {
        const next = { ...prev };
        delete next[draggedId];
        return next;
      });
    } catch (err) {
      // Roll back optimistic move on failure
      setOptimisticOverrides((prev) => {
        const next = { ...prev };
        delete next[draggedId];
        return next;
      });
      setMoveError(err instanceof Error ? err.message : 'Unable to move task');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-[#171923]">Kanban Board</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            {canEdit
              ? 'Drag tasks between workflow columns to persist status and ordering.'
              : 'Read-only board view (viewer role).'}
          </p>
        </div>
        {canEdit ? (
          <Button onClick={() => openCreateTask()}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter board tasks..."
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
        <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="all">All Priorities</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>

      {moveError ? (
        <p className="rounded-[10px] border border-[#DC2626]/30 bg-[#DC2626]/5 px-4 py-2.5 text-xs text-[#DC2626]">
          {moveError}
        </p>
      ) : null}

      {projects.length === 0 ? (
        <EmptyState
          title="No projects available"
          description="Create a project first before organizing tasks on the Kanban board."
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={(e) => void handleDragEnd(e)}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {TASK_STATUSES.map((col) => (
              <KanbanColumn
                key={col.value}
                status={col.value}
                label={col.label}
                tasks={effectiveTasks.filter((t) => t.status === col.value)}
                projectsMap={projectsMap}
                members={members}
                canEdit={canEdit}
                onOpenTask={(id) => setSelectedTaskId(id)}
                onAddTask={(status) => openCreateTask({ status })}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDragTask ? (
              <div className="w-72 rounded-[10px] border border-[#635BDB] bg-white p-3.5 shadow-lg">
                <p className="text-[11px] font-mono font-semibold text-[#635BDB]">
                  {projectsMap.get(activeDragTask.projectId) ?? 'TASK'}
                </p>
                <p className="mt-1 text-sm font-medium text-[#171923]">{activeDragTask.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
