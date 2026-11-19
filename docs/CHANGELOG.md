# Changelog

## [Phases 2–10 — Full TaskFlow SaaS Application]

### Added
- **Marketing Landing Page (`/`)**: Built complete 10-section Minimal White Premium landing site with interactive Kanban/List/Analytics preview, explicit demo testimonials, pricing comparison, and FAQ accordion.
- **Authentication (`/login`, `/register`)**: Added Firebase Google Sign-In UI (`AuthPage`) and `ProtectedRoute` session guard.
- **Workspaces & Teams (`/app/team`)**: Implemented `WorkspaceContext`, `CreateWorkspaceModal`, `NoWorkspaceView`, email-bound workspace invitations with atomic `writeBatch` acceptance, member role management, and activity logs.
- **Projects, Tasks & Collaboration (`/app/projects`, `/app/tasks`)**: Added project management, full task list search/filter/sort, `CreateTaskModal`, and `TaskDetailDrawer` with subtasks, `@mention` comments, and `<= 200 KB` attachments.
- **Kanban & Calendar (`/app/kanban`, `/app/calendar`)**: Implemented drag-and-drop Kanban board (`@dnd-kit`) and Month/Week/Day calendar views with direct date-based task creation.
- **Dashboard, Analytics & Notifications (`/app`, `/app/analytics`)**: Built live KPI cards, Recharts charts, deadline trackers, workload summaries, and real-time `NotificationMenu`.
- **Settings & Administration (`/app/settings`, `/app/admin`)**: Added user profile/notification/theme preferences, workspace settings, owner deletion confirmation dialog, and isolated Platform Administration directory.
- **Verification**: Added `src/lib/__tests__/validation.test.ts` and synchronized project documentation.

## [Phase 1 — Foundation & Firebase Database Connection]

### Added
- Provisioned Firebase Cloud Firestore database and Google Authentication via `firebase-applet-config.json`.
- Created `firebase-blueprint.json`, `security_spec.md`, hardened `firestore.rules`, and `firestore.rules.test.ts`.
- Added client Firebase SDK module (`src/lib/firebase.ts`) with `testConnection()`, `handleFirestoreError`, and PII-split profile sync.
- Unified Express + Vite full-stack server entrypoint (`server.ts`) on port `3000` with security middleware, health endpoints, and documentation.
