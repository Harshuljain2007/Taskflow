import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/src/components/layout/AppShell';
import { AuthPage } from '@/src/features/auth/AuthPage';
import { ProtectedRoute } from '@/src/features/auth/ProtectedRoute';
import { LandingPage } from '@/src/features/landing/LandingPage';
import { CreateTaskModal } from '@/src/features/tasks/CreateTaskModal';
import { TaskDetailDrawer } from '@/src/features/tasks/TaskDetailDrawer';
import { WorkspaceProvider } from '@/src/features/workspaces/WorkspaceContext';

const DashboardPage = lazy(() =>
  import('@/src/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ProjectsPage = lazy(() =>
  import('@/src/features/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage })),
);
const TasksListPage = lazy(() =>
  import('@/src/features/tasks/TasksListPage').then((m) => ({ default: m.TasksListPage })),
);
const KanbanPage = lazy(() =>
  import('@/src/features/kanban/KanbanPage').then((m) => ({ default: m.KanbanPage })),
);
const CalendarPage = lazy(() =>
  import('@/src/features/calendar/CalendarPage').then((m) => ({ default: m.CalendarPage })),
);
const TeamPage = lazy(() =>
  import('@/src/features/teams/TeamPage').then((m) => ({ default: m.TeamPage })),
);
const AnalyticsPage = lazy(() =>
  import('@/src/features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
);
const SettingsPage = lazy(() =>
  import('@/src/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const AdminPage = lazy(() =>
  import('@/src/features/admin/AdminPage').then((m) => ({ default: m.AdminPage })),
);

function RouteSkeleton() {
  return (
    <div className="space-y-4 py-4" aria-busy="true" aria-label="Loading workspace view">
      <div className="h-8 w-56 animate-pulse rounded bg-[#F7F8FA]" />
      <div className="h-4 w-80 animate-pulse rounded bg-[#F7F8FA]" />
      <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
        <div className="h-28 animate-pulse rounded-[12px] border border-[#E5E7EB] bg-[#F7F8FA]" />
        <div className="h-28 animate-pulse rounded-[12px] border border-[#E5E7EB] bg-[#F7F8FA]" />
        <div className="h-28 animate-pulse rounded-[12px] border border-[#E5E7EB] bg-[#F7F8FA]" />
      </div>
    </div>
  );
}

function ProtectedAppLayout() {
  return (
    <ProtectedRoute>
      <WorkspaceProvider>
        <AppShell>
          <Suspense fallback={<RouteSkeleton />}>
            <Outlet />
          </Suspense>
        </AppShell>
        <CreateTaskModal />
        <TaskDetailDrawer />
      </WorkspaceProvider>
    </ProtectedRoute>
  );
}

function resolveRouterBasename(): string {
  const baseUrl = import.meta.env.BASE_URL || '/';
  if (baseUrl === '/' || baseUrl === './') {
    return '/';
  }
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

export function AppRouter() {
  return (
    <BrowserRouter basename={resolveRouterBasename()}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />

        <Route path="/app" element={<ProtectedAppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="tasks" element={<TasksListPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
