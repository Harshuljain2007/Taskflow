# Firestore Security Specification (Phases 2–10 Complete)

## 1. Data Invariants

1. **Master Gate Isolation**: Every workspace subresource (`projects`, `tasks`, `subtasks`, `comments`, `attachments`, `invitations`, `activityLogs`) gates single-document reads and all mutations on `/workspaces/{workspaceId}/members/$(request.auth.uid)`.
2. **RBAC Role Separation**:
   - `viewer`: Read-only access to workspace resources (can comment only if `workspace.allowViewerComments == true`).
   - `member`: Can create/update tasks, subtasks, own comments, and attachments; cannot delete workspace or manage roles.
   - `admin`: Can manage projects, invitations, and non-owner members.
   - `owner`: Full workspace authority including workspace deletion and ownership transfer/role changes.
   - **Platform Admin Separation**: Workspace `owner`/`admin` roles never grant global `isAdmin()` access; global admin requires verified bootstrap email (`harshuljain923@gmail.com`) or `/admins/$(uid)`.
3. **PII Isolation**: User email addresses and notification preferences exist solely in `/users/{userId}/private/info` and `/workspaces/{workspaceId}/invitations/{invitationId}` (never in public profiles or member directories).
4. **Zero `get()`/`exists()` in `allow list`**: Every `allow list` rule evaluates strictly against `resource.data` and `request.auth` (e.g. `request.auth.uid in resource.data.memberIds` / `projectMemberIds`), never issuing per-document `get()` reads.
5. **Atomicity (`existsAfter` / `getAfter`)**: Workspace creation requires atomic batch creation of `/workspaces/{wsId}`, `/workspaces/{wsId}/members/{uid}`, and `/users/{uid}/workspaceRefs/{wsId}`.
6. **Immutability & Strict Timestamps**: `id`, `workspaceId`, `createdAt`, `ownerId`/`reporterId`/`authorId`/`actorId` cannot be altered after creation; `createdAt == request.time` on create and `updatedAt == request.time` on updates.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return `PERMISSION_DENIED`)

1. Unauthenticated read or write on any collection.
2. Unverified email (`email_verified: false`) attempting any write or admin check.
3. Workspace `viewer` attempting to create, edit, move, or delete a task.
4. Non-member attempting to read or list projects/tasks inside another tenant workspace.
5. Workspace `admin` attempting to list `/admins` or `/workspaces` globally (privilege escalation).
6. User attempting to self-grant `role: "owner"` in `/workspaces/{wsId}/members/{uid}` for an existing workspace without an invitation.
7. User attempting to inject shadow fields (`isAdmin: true`, `extraField: 1`) into any create or update.
8. User attempting to upload a disallowed executable MIME type (`application/x-msdownload`) or >200KB payload to `/attachments`.
9. User attempting to edit or delete another teammate's comment (`authorId != request.auth.uid` as `member`).
10. User injecting >25 items into `memberIds`/`projectMemberIds` or >10 items into `labels`/`assigneeIds`.
11. User tampering with `createdAt`, `workspaceId`, or `reporterId` on an existing task update.
12. User updating or deleting an immutable `/activityLogs` audit record.
