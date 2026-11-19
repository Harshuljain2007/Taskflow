import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useFirebase } from '@/src/app/providers';
import { BOOTSTRAP_ADMIN_EMAIL } from '@/src/lib/validation';
import { subscribeNotifications } from '@/src/services/firestore/notificationService';
import { subscribeProjects } from '@/src/services/firestore/projectService';
import { subscribeTasks } from '@/src/services/firestore/taskService';
import {
  subscribeActivityLogs,
  subscribePendingInvitationsByEmail,
  subscribeWorkspace,
  subscribeWorkspaceMembers,
  subscribeWorkspaceRefs,
} from '@/src/services/firestore/workspaceService';
import { useUiStore } from '@/src/stores/uiStore';
import type {
  ActivityLogItem,
  NotificationItem,
  Project,
  TaskItem,
  Workspace,
  WorkspaceInvitation,
  WorkspaceMember,
  WorkspaceRef,
  WorkspaceRole,
} from '@/src/types/domain';

interface WorkspaceContextValue {
  workspaceRefs: WorkspaceRef[];
  refsLoaded: boolean;
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string | null;
  members: WorkspaceMember[];
  projects: Project[];
  tasks: TaskItem[];
  activityLogs: ActivityLogItem[];
  notifications: NotificationItem[];
  pendingInvitations: WorkspaceInvitation[];
  currentRole: WorkspaceRole | null;
  canEdit: boolean;
  canManage: boolean;
  isWorkspaceOwner: boolean;
  isPlatformAdmin: boolean;
  loadingWorkspaceData: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider');
  }
  return ctx;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, authReady } = useFirebase();
  const activeWorkspaceId = useUiStore((s) => s.activeWorkspaceId);
  const setActiveWorkspaceId = useUiStore((s) => s.setActiveWorkspaceId);

  const [workspaceRefs, setWorkspaceRefs] = useState<WorkspaceRef[]>([]);
  const [refsLoaded, setRefsLoaded] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loadingWorkspaceData, setLoadingWorkspaceData] = useState(false);

  // User-level subscriptions (workspaceRefs, notifications, incoming invitations)
  useEffect(() => {
    if (!authReady || !user) {
      return;
    }

    const unsubRefs = subscribeWorkspaceRefs(user.uid, (refs) => {
      setWorkspaceRefs(refs);
      setRefsLoaded(true);

      const stored = useUiStore.getState().activeWorkspaceId;
      if (refs.length === 0) {
        if (stored !== null) setActiveWorkspaceId(null);
      } else if (!stored || !refs.some((r) => r.workspaceId === stored)) {
        setActiveWorkspaceId(refs[0].workspaceId);
      }
    });

    const unsubNotifications = subscribeNotifications(user.uid, (items) => {
      setNotifications(items);
    });

    let unsubInvites = () => {};
    if (user.email) {
      unsubInvites = subscribePendingInvitationsByEmail(user.email, (invites) => {
        setPendingInvitations(invites);
      });
    }

    return () => {
      unsubRefs();
      unsubNotifications();
      unsubInvites();
    };
  }, [authReady, user, setActiveWorkspaceId]);

  const resolvedWorkspaceId = useMemo(() => {
    if (!user || workspaceRefs.length === 0) return null;
    if (activeWorkspaceId && workspaceRefs.some((r) => r.workspaceId === activeWorkspaceId)) {
      return activeWorkspaceId;
    }
    return workspaceRefs[0].workspaceId;
  }, [user, workspaceRefs, activeWorkspaceId]);

  // Active workspace subscriptions
  useEffect(() => {
    if (!authReady || !user || !resolvedWorkspaceId) {
      return;
    }

    const timer = window.setTimeout(() => setLoadingWorkspaceData(true), 0);

    const unsubWorkspace = subscribeWorkspace(resolvedWorkspaceId, (ws) => {
      setActiveWorkspace(ws);
      setLoadingWorkspaceData(false);
    });
    const unsubMembers = subscribeWorkspaceMembers(resolvedWorkspaceId, user.uid, setMembers);
    const unsubProjects = subscribeProjects(resolvedWorkspaceId, user.uid, setProjects);
    const unsubTasks = subscribeTasks(resolvedWorkspaceId, user.uid, setTasks);
    const unsubLogs = subscribeActivityLogs(resolvedWorkspaceId, user.uid, setActivityLogs);

    return () => {
      window.clearTimeout(timer);
      unsubWorkspace();
      unsubMembers();
      unsubProjects();
      unsubTasks();
      unsubLogs();
    };
  }, [authReady, user, resolvedWorkspaceId]);

  const currentRole = useMemo<WorkspaceRole | null>(() => {
    if (!user || !resolvedWorkspaceId) return null;
    const member = members.find((m) => m.userId === user.uid);
    if (member) return member.role;
    const ref = workspaceRefs.find((r) => r.workspaceId === resolvedWorkspaceId);
    return ref?.role ?? null;
  }, [user, resolvedWorkspaceId, members, workspaceRefs]);

  const isPlatformAdmin = Boolean(
    user?.emailVerified && user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL,
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaceRefs: user ? workspaceRefs : [],
      refsLoaded: user ? refsLoaded : false,
      activeWorkspace: resolvedWorkspaceId ? activeWorkspace : null,
      activeWorkspaceId: resolvedWorkspaceId,
      members: resolvedWorkspaceId ? members : [],
      projects: resolvedWorkspaceId ? projects : [],
      tasks: resolvedWorkspaceId ? tasks : [],
      activityLogs: resolvedWorkspaceId ? activityLogs : [],
      notifications: user ? notifications : [],
      pendingInvitations: user ? pendingInvitations : [],
      currentRole,
      canEdit: currentRole === 'owner' || currentRole === 'admin' || currentRole === 'member',
      canManage: currentRole === 'owner' || currentRole === 'admin',
      isWorkspaceOwner: currentRole === 'owner',
      isPlatformAdmin,
      loadingWorkspaceData: resolvedWorkspaceId ? loadingWorkspaceData : false,
    }),
    [
      user,
      workspaceRefs,
      refsLoaded,
      resolvedWorkspaceId,
      activeWorkspace,
      members,
      projects,
      tasks,
      activityLogs,
      notifications,
      pendingInvitations,
      currentRole,
      isPlatformAdmin,
      loadingWorkspaceData,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
