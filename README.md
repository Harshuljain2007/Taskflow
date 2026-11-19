# TaskFlow

TaskFlow is a production-grade Project Management and Team Collaboration SaaS platform built with React, Vite, TypeScript, Tailwind CSS, Express, and Firebase (Cloud Firestore & Firebase Authentication).

## Implemented Capabilities (Phases 1–10)

- **Marketing Landing Page (`/`)**: Minimal White Premium landing site with interactive product preview, feature grid, workflow steps, demo testimonials, pricing comparison, and FAQ accordion.
- **Authentication (`/login`, `/register`)**: Verified Google Sign-In powered by Firebase Auth with PII-split user profile bootstrapping (`/users/{uid}/public/profile` and `/users/{uid}/private/info`).
- **Multi-Tenant Workspaces & RBAC (`/app`, `/app/team`)**: Workspace creation, switcher, invitation workflow (`admin`, `member`, `viewer`), member role updates, and server-side security rules isolation.
- **Projects & Tasks (`/app/projects`, `/app/tasks`)**: Project management with keys, statuses, visibility (`workspace` / `private`), task CRUD, subtasks, labels, priorities, assignees, search, filtering, and sorting.
- **Kanban Board (`/app/kanban`)**: Drag-and-drop task workflow across `Backlog`, `To Do`, `In Progress`, `In Review`, and `Done` via `@dnd-kit` with persisted ordering.
- **Calendar (`/app/calendar`)**: Month, Week, and Day calendar scheduling with direct task creation on target dates.
- **Comments, Mentions & Attachments**: Threaded task discussions with `@mention` notifications, inline comment editing, and file attachments (up to 200 KB with MIME allowlists).
- **Notifications & Analytics (`/app/analytics`)**: Real-time unread notification drawer plus Recharts analytics for completion ratios, priority breakdown, overdue counts, and team workload.
- **Settings & Platform Administration (`/app/settings`, `/app/admin`)**: Profile/preferences management, workspace settings, owner deletion, and isolated platform administration diagnostics.

## Prerequisites

- Node.js 22+
- npm 10+
- Provisioned Firebase project & Cloud Firestore configuration (`firebase-applet-config.json`)

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (optional backend overrides):
   ```bash
   cp .env.example .env
   ```

3. Start the full-stack development server (port 3000):
   ```bash
   npm run dev
   ```

4. Run verification checks:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

## Documentation Index

- [Architecture](docs/ARCHITECTURE.md)
- [Database Design](docs/DATABASE.md)
- [API Reference](docs/API.md)
- [Security Architecture](docs/SECURITY.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Testing Guide](docs/TESTING.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Changelog](docs/CHANGELOG.md)
