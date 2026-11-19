# API & Service Reference

## Backend Express API (`/api/v1`)

All Express endpoints return standardized JSON envelopes:

Success:
```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

Error:
```json
{
  "success": false,
  "message": "A useful error message",
  "code": "VALIDATION_ERROR"
}
```

### `GET /api/v1/health`
Returns service liveness metadata, runtime environment, uptime, and Firebase/Firestore configuration status (`200 OK`).

### `GET /api/v1/health/ready`
Returns `200 OK` when `firebase-applet-config.json` is valid and ready, or `503 Service Unavailable` (`DATABASE_UNAVAILABLE`) when database configuration is missing.

### Unmatched `/api/*` Routes
Returns `404 Not Found` with `{ "success": false, "message": "Route ... not found", "code": "ROUTE_NOT_FOUND" }`.

## Firestore Service Layer (`src/services/firestore/`)

Domain operations execute directly against Cloud Firestore via Firebase Web SDK with `firestore.rules` enforcement:

- `userService.ts`: Public profile and private notification/theme preference management.
- `workspaceService.ts`: Workspace CRUD, membership subscriptions, invitations, acceptance (`writeBatch` atomic invite + member + workspaceRef creation), role updates, and activity logs.
- `projectService.ts`: Project creation, editing, archiving, and deletion.
- `taskService.ts`: Task CRUD, Kanban reordering, subtasks, comments (`@mentions`), attachments, and notification fan-out.
- `notificationService.ts`: Real-time notifications subscription and read-state updates.
- `adminService.ts`: Platform-wide workspace directory and platform admin grants/revocations.
