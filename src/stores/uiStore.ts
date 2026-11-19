import { create } from 'zustand';
import type { TaskStatus } from '@/src/types/domain';

const ACTIVE_WORKSPACE_KEY = 'taskflow_active_workspace_id';

function readStoredWorkspaceId(): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(ACTIVE_WORKSPACE_KEY) : null;
  } catch {
    return null;
  }
}

interface UiState {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (workspaceId: string | null) => void;

  selectedTaskId: string | null;
  setSelectedTaskId: (taskId: string | null) => void;

  createTaskOpen: boolean;
  createTaskDefaultStatus: TaskStatus;
  createTaskDefaultDueDate: string;
  createTaskDefaultProjectId: string;
  openCreateTask: (opts?: { status?: TaskStatus; dueDate?: string; projectId?: string }) => void;
  closeCreateTask: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

  activeWorkspaceId: readStoredWorkspaceId(),
  setActiveWorkspaceId: (workspaceId) => {
    try {
      if (typeof window !== 'undefined') {
        if (workspaceId) {
          window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
        } else {
          window.localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
        }
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    set({ activeWorkspaceId: workspaceId, selectedTaskId: null });
  },

  selectedTaskId: null,
  setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),

  createTaskOpen: false,
  createTaskDefaultStatus: 'todo',
  createTaskDefaultDueDate: '',
  createTaskDefaultProjectId: '',
  openCreateTask: (opts) =>
    set({
      createTaskOpen: true,
      createTaskDefaultStatus: opts?.status ?? 'todo',
      createTaskDefaultDueDate: opts?.dueDate ?? '',
      createTaskDefaultProjectId: opts?.projectId ?? '',
    }),
  closeCreateTask: () => set({ createTaskOpen: false }),
}));
