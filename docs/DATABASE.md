# Database Architecture

## Provisioned Database — Firebase Cloud Firestore

TaskFlow uses **Firebase Cloud Firestore** configured via `firebase-applet-config.json` and `src/lib/firebase.ts`:

- **Client SDK**: Initializes `getFirestore(app, firebaseConfig.firestoreDatabaseId)` and `getAuth(app)`.
- **Startup Verification**: `testConnection()` calls `getDocFromServer(doc(db, 'test', 'connection'))` on boot to verify live Firestore connectivity.
- **Structured Error Diagnostics**: `handleFirestoreError(error, operationType, path)` logs structured JSON diagnostics for permission and network errors.

## Canonical Collections (`firebase-blueprint.json`)

1. `/users/{userId}/public/profile` (`UserPublicProfile`) — Public display name, avatar URL, job title, bio.
2. `/users/{userId}/private/info` (`UserPrivateInfo`) — Isolated email PII plus notification and theme preferences.
3. `/users/{userId}/workspaceRefs/{workspaceId}` (`WorkspaceRef`) — Fast per-user workspace index for safe list queries.
4. `/users/{userId}/notifications/{notificationId}` (`NotificationItem`) — Real-time user notifications.
5. `/workspaces/{workspaceId}` (`Workspace`) — Workspace settings, slug, and owner ID.
6. `/workspaces/{workspaceId}/members/{memberId}` (`WorkspaceMember`) — Active membership records (`owner`, `admin`, `member`, `viewer`) with bounded `visibleMemberIds`.
7. `/workspaces/{workspaceId}/invitations/{invitationId}` (`WorkspaceInvitation`) — Time-bounded email invitations (`pending`, `accepted`, `revoked`).
8. `/workspaces/{workspaceId}/projects/{projectId}` (`Project`) — Workspace or private projects with bounded `memberIds`.
9. `/workspaces/{workspaceId}/tasks/{taskId}` (`TaskItem`) — Tasks with status, priority, assignees, labels, dates, and Kanban `position`.
10. `/workspaces/{workspaceId}/tasks/{taskId}/subtasks/{subtaskId}` (`SubtaskItem`) — Task checklist items.
11. `/workspaces/{workspaceId}/tasks/{taskId}/comments/{commentId}` (`CommentItem`) — Discussion threads with `@mentions`.
12. `/workspaces/{workspaceId}/tasks/{taskId}/attachments/{attachmentId}` (`AttachmentItem`) — Inline encoded attachments (`<= 200 KB`).
13. `/workspaces/{workspaceId}/activityLogs/{logId}` (`ActivityLogItem`) — Workspace audit trail.
14. `/admins/{userId}` (`PlatformAdmin`) — Delegated platform administrators isolated from workspace admins.
