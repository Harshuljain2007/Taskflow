import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Shield,
  Users,
  View,
  X,
} from 'lucide-react';
import { useFirebase } from '@/src/app/providers';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { Select } from '@/src/components/ui/Select';
import { NotificationMenu } from '@/src/features/notifications/NotificationMenu';
import { CreateWorkspaceModal } from '@/src/features/workspaces/CreateWorkspaceModal';
import { useWorkspace } from '@/src/features/workspaces/WorkspaceContext';
import { useUiStore } from '@/src/stores/uiStore';

interface AppShellProps {
  children: ReactNode;
}

const ROUTE_TITLES: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/projects': 'Projects',
  '/app/tasks': 'Tasks',
  '/app/kanban': 'Kanban Board',
  '/app/calendar': 'Calendar',
  '/app/team': 'Team',
  '/app/analytics': 'Analytics',
  '/app/settings': 'Settings',
  '/app/admin': 'Administration',
};

export function AppShell({ children }: AppShellProps) {
  const { user, signOut } = useFirebase();
  const {
    workspaceRefs,
    activeWorkspace,
    activeWorkspaceId,
    currentRole,
    canEdit,
    isPlatformAdmin,
  } = useWorkspace();
  const { setActiveWorkspaceId, openCreateTask } = useUiStore();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [createWsOpen, setCreateWsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = ROUTE_TITLES[location.pathname] ?? 'Workspace';

  const navItems = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/projects', label: 'Projects', icon: FolderKanban },
    { to: '/app/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/app/kanban', label: 'Kanban', icon: View },
    { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/app/team', label: 'Team', icon: Users },
    { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/app/settings', label: 'Settings', icon: Settings },
  ];

  if (isPlatformAdmin) {
    navItems.push({ to: '/app/admin', label: 'Admin', icon: Shield });
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#F7F8FA] p-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <Link to="/" className="text-lg font-bold tracking-tight text-[#171923]">
            TaskFlow
          </Link>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close sidebar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:bg-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-[#6B7280]">Workspace</span>
            <button
              type="button"
              onClick={() => setCreateWsOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#635BDB] hover:text-[#5148C9] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>
          {workspaceRefs.length > 0 ? (
            <Select
              aria-label="Switch active workspace"
              value={activeWorkspaceId ?? ''}
              onChange={(e) => setActiveWorkspaceId(e.target.value)}
            >
              {workspaceRefs.map((ref) => (
                <option key={ref.workspaceId} value={ref.workspaceId}>
                  {ref.workspaceName}
                </option>
              ))}
            </Select>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setCreateWsOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Workspace
            </Button>
          )}
          {currentRole ? (
            <p className="px-1 text-[11px] text-[#6B7280]">
              Role: <span className="font-medium capitalize text-[#171923]">{currentRole}</span>
            </p>
          ) : null}
        </div>

        <nav aria-label="Workspace Navigation" className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-[#171923] border border-[#E5E7EB]'
                      : 'text-[#6B7280] hover:bg-white/70 hover:text-[#171923] border border-transparent'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {user ? (
        <div className="border-t border-[#E5E7EB] pt-4">
          <div className="flex items-center gap-3 px-1">
            <Avatar
              name={user.displayName || user.email || 'User'}
              photoURL={user.photoURL || undefined}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#171923]">
                {user.displayName || 'TaskFlow User'}
              </p>
              <p className="truncate text-[11px] text-[#6B7280]">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start text-[#6B7280]"
            onClick={async () => {
              await signOut();
              navigate('/', { replace: true });
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#171923] flex">
      <aside className="hidden lg:block w-60 shrink-0 border-r border-[#E5E7EB]">
        <div className="sticky top-0 h-screen overflow-y-auto">{sidebarContent}</div>
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 bg-[#171923]/30"
          />
          <aside className="relative z-10 w-64 max-w-[80vw] border-r border-[#E5E7EB] bg-[#F7F8FA]">
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#E5E7EB] bg-white/95 px-4 sm:px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E5E7EB] text-[#171923] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="hidden sm:inline text-[#6B7280] truncate max-w-[180px]">
                {activeWorkspace?.name ?? 'TaskFlow'}
              </span>
              <span className="hidden sm:inline text-[#E5E7EB]" aria-hidden="true">
                /
              </span>
              <h1 className="font-semibold text-[#171923] truncate">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeWorkspace && canEdit ? (
              <Button size="sm" onClick={() => openCreateTask()}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Task</span>
              </Button>
            ) : null}
            <NotificationMenu />
          </div>
        </header>

        <main className="flex-1 bg-[#FFFFFF] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <CreateWorkspaceModal open={createWsOpen} onClose={() => setCreateWsOpen(false)} />
    </div>
  );
}
