import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { NoWorkspaceView } from '@/src/features/workspaces/NoWorkspaceView';
import { useWorkspace } from '@/src/features/workspaces/WorkspaceContext';
import { isOverdueDate } from '@/src/lib/dateUtils';
import { useUiStore } from '@/src/stores/uiStore';

type CalendarView = 'month' | 'week' | 'day';

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CalendarPage() {
  const { refsLoaded, workspaceRefs, tasks, projects, canEdit } = useWorkspace();
  const { setSelectedTaskId, openCreateTask } = useUiStore();

  const [view, setView] = useState<CalendarView>('month');
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [todayIso] = useState(() => toIsoDate(new Date()));

  const monthCells = useMemo(() => {
    const year = cursorDate.getFullYear();
    const month = cursorDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const startDate = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, idx) => {
      const cellDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + idx);
      return {
        date: cellDate,
        iso: toIsoDate(cellDate),
        inMonth: cellDate.getMonth() === month,
      };
    });
  }, [cursorDate]);

  const weekCells = useMemo(() => {
    const dayOfWeek = cursorDate.getDay();
    const startOfWeek = new Date(
      cursorDate.getFullYear(),
      cursorDate.getMonth(),
      cursorDate.getDate() - dayOfWeek,
    );
    return Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + idx);
      return {
        date: d,
        iso: toIsoDate(d),
        inMonth: true,
      };
    });
  }, [cursorDate]);

  if (refsLoaded && workspaceRefs.length === 0) {
    return <NoWorkspaceView />;
  }

  const navigatePeriod = (dir: -1 | 1) => {
    const next = new Date(cursorDate);
    if (view === 'month') next.setMonth(next.getMonth() + dir);
    else if (view === 'week') next.setDate(next.getDate() + dir * 7);
    else next.setDate(next.getDate() + dir);
    setCursorDate(next);
  };

  const periodLabel =
    view === 'month'
      ? cursorDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      : view === 'week'
        ? `Week of ${weekCells[0].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
        : cursorDate.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });

  const activeDayIso = toIsoDate(cursorDate);
  const activeDayTasks = tasks.filter((t) => t.dueDate === activeDayIso);
  const activeDayMilestones = projects.filter((p) => p.dueDate === activeDayIso);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-[#171923]">Calendar</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Track task deadlines, overdue alerts, and project milestone dates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-[10px] border border-[#E5E7EB] bg-[#F7F8FA] p-1">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`px-3 py-1.5 text-xs font-medium capitalize rounded-[8px] cursor-pointer transition-colors ${
                  view === mode
                    ? 'bg-white text-[#171923] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#171923]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => navigatePeriod(-1)} aria-label="Previous period">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursorDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigatePeriod(1)} aria-label="Next period">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#171923]">{periodLabel}</h3>
        {canEdit ? (
          <Button size="sm" onClick={() => openCreateTask({ dueDate: activeDayIso })}>
            <Plus className="h-4 w-4" />
            Add Task on {activeDayIso}
          </Button>
        ) : null}
      </div>

      {view === 'day' ? (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-[#171923]">Project Milestones</h4>
            {activeDayMilestones.length === 0 ? (
              <p className="mt-1.5 text-sm text-[#6B7280]">No project milestones on this date.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {activeDayMilestones.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-[10px] border border-[#635BDB]/30 bg-[#635BDB]/[0.04] px-3.5 py-2.5 text-sm font-medium text-[#171923]"
                  >
                    Milestone: {p.key} · {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#E5E7EB] pt-5">
            <h4 className="text-sm font-semibold text-[#171923]">Tasks Due</h4>
            {activeDayTasks.length === 0 ? (
              <p className="mt-1.5 text-sm text-[#6B7280]">No tasks due on {activeDayIso}.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {activeDayTasks.map((t) => {
                  const overdue = isOverdueDate(t.dueDate, t.status);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTaskId(t.id)}
                      className="flex w-full items-center justify-between rounded-[10px] border border-[#E5E7EB] px-4 py-3 text-left hover:bg-[#F7F8FA] cursor-pointer"
                    >
                      <span className="text-sm font-medium text-[#171923]">{t.title}</span>
                      <span
                        className={`text-xs capitalize ${
                          overdue ? 'text-[#DC2626] font-semibold' : 'text-[#6B7280]'
                        }`}
                      >
                        {overdue ? 'Overdue · ' : ''}
                        {t.status.replace('_', ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">
          <div className="grid grid-cols-7 border-b border-[#E5E7EB] bg-[#F7F8FA] text-xs font-medium text-[#6B7280]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="px-3 py-2.5 text-center">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-[#E5E7EB]">
            {(view === 'month' ? monthCells : weekCells).map((cell) => {
              const dayTasks = tasks.filter((t) => t.dueDate === cell.iso);
              const dayMilestones = projects.filter((p) => p.dueDate === cell.iso);
              const isToday = cell.iso === todayIso;

              return (
                <div
                  key={cell.iso}
                  className={`min-h-[112px] p-2 ${
                    cell.inMonth ? 'bg-white' : 'bg-[#F7F8FA]/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-mono tabular-nums ${
                        isToday
                          ? 'bg-[#635BDB] text-white font-semibold'
                          : cell.inMonth
                            ? 'text-[#171923]'
                            : 'text-[#6B7280]'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    {canEdit ? (
                      <button
                        type="button"
                        aria-label={`Create task due ${cell.iso}`}
                        onClick={() => openCreateTask({ dueDate: cell.iso })}
                        className="rounded p-0.5 text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#171923] cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-1.5 space-y-1">
                    {dayMilestones.map((p) => (
                      <div
                        key={p.id}
                        className="truncate rounded px-1.5 py-0.5 text-[11px] font-medium bg-[#635BDB]/10 text-[#635BDB]"
                      >
                        {p.key} Milestone
                      </div>
                    ))}

                    {dayTasks.slice(0, 3).map((task) => {
                      const overdue = isOverdueDate(task.dueDate, task.status);
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`block w-full truncate rounded border px-1.5 py-0.5 text-left text-[11px] cursor-pointer ${
                            overdue
                              ? 'border-[#DC2626]/30 bg-[#DC2626]/5 text-[#DC2626]'
                              : task.status === 'done'
                                ? 'border-[#16A34A]/30 bg-[#16A34A]/5 text-[#16A34A]'
                                : 'border-[#E5E7EB] bg-[#F7F8FA] text-[#171923] hover:border-[#635BDB]'
                          }`}
                        >
                          {task.title}
                        </button>
                      );
                    })}

                    {dayTasks.length > 3 ? (
                      <p className="px-1 text-[10px] font-mono text-[#6B7280]">
                        +{dayTasks.length - 3} more
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
