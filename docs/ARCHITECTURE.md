# Architecture

## Overview

TaskFlow combines a unified Node.js/Express server (port `3000`) for health/diagnostics and SPA delivery with a feature-sliced React + TypeScript client powered by Cloud Firestore real-time subscriptions and Firebase Authentication.

## Directory Layout

```
.
├── server.ts                         # Unified Express + Vite/Static entrypoint (port 3000)
├── firebase-applet-config.json       # Provisioned Firebase project & Firestore DB configuration
├── firebase-blueprint.json           # Canonical 14-entity Firestore data schema
├── firestore.rules                   # Eight-pillar server-side Firestore security rules
├── server/
│   └── src/
│       ├── app.ts                    # Express app factory (Helmet, CORS, rate limit, API routes)
│       ├── config/
│       │   ├── env.ts                # Zod-validated environment configuration
│       │   ├── firebase.ts           # Safe firebase-applet-config loader (Starter Tier compatible)
│       │   └── db.ts                 # Database readiness reporter
│       ├── middleware/               # errorHandler, notFound, validate
│       ├── modules/health/           # /api/v1/health & /api/v1/health/ready
│       └── utils/                    # AppError & standardized JSON response envelopes
└── src/
    ├── app/                          # AppProviders (Firebase + TanStack Query + Motion) & AppRouter
    ├── components/
    │   ├── layout/                   # AppShell & TopNav
    │   ├── shared/                   # ErrorBoundary
    │   └── ui/                       # Avatar, Button, Card, Dialog, EmptyState, Input, Select, Textarea
    ├── features/
    │   ├── landing/                  # Marketing Landing Page (/)
    │   ├── auth/                     # AuthPage & ProtectedRoute
    │   ├── workspaces/               # WorkspaceContext, CreateWorkspaceModal, NoWorkspaceView
    │   ├── dashboard/                # KPI overview, charts, deadlines, activity feed
    │   ├── projects/                 # Project lifecycle & visibility management
    │   ├── tasks/                    # TasksListPage, CreateTaskModal, TaskDetailDrawer
    │   ├── kanban/                   # @dnd-kit Kanban Board
    │   ├── calendar/                 # Month / Week / Day schedule views
    │   ├── teams/                    # Member management & invitations
    │   ├── notifications/            # Real-time NotificationMenu
    │   ├── analytics/                # Recharts velocity & workload dashboards
    │   ├── settings/                 # User profile, preferences & workspace settings
    │   └── admin/                    # Isolated Platform Administration directory
    ├── lib/                          # firebase.ts, validation.ts, dateUtils.ts, apiClient.ts, utils.ts
    ├── services/firestore/           # Modular Firestore CRUD & subscription services
    ├── stores/                       # Zustand UI state store (active workspace, drawer, modals)
    └── types/                        # Shared TypeScript domain interfaces
```

## Runtime Request Flow

- **Express API (`/api/v1/*`)**: Handles health and readiness checks with Helmet headers, origin-checked CORS, rate limiting, Zod validation, and standardized error responses.
- **Real-Time Data Layer**: Client-side Firestore listeners (`onSnapshot`) synchronize workspaces, members, projects, tasks, subtasks, comments, attachments, notifications, and activity logs in real time, enforced by `firestore.rules`.
- **SPA Delivery**: Non-API routes are served via `vite.middlewares` in development and compiled static assets from `dist/` in production.
