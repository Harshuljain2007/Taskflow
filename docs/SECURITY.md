# Security Architecture

## Firestore Security Rules (`firestore.rules`)

- **Default-Deny Safety Net**: `match /{document=**} { allow read, write: if false; }` denies all unmatched paths.
- **Verified Identity**: Write operations require `request.auth != null && request.auth.token.email_verified == true` (verified Google Sign-In).
- **PII Segregation**: Private user fields (`email`, preferences) live under `/users/{uid}/private/info` readable and writable exclusively by the owning user.
- **Tenant & Role Isolation**: Every workspace subcollection validates workspace membership (`owner`, `admin`, `member`, `viewer`), with project-scoped visibility (`workspace` vs `private`) enforced on tasks, subtasks, comments, and attachments.
- **Invitation Integrity**: Accepting an invitation atomically updates the `pending` invitation to `accepted` (`getAfter(...)`) while verifying email ownership and matching `role` to prevent self-join privilege escalation.
- **Strict Field & Size Bounds**: Every collection enforces `hasAll` / `hasOnly` / `affectedKeys().hasOnly(...)`, ID regex checks, bounded arrays (`<= 25` member IDs, `<= 10` labels/assignees), immutable ownership fields, and `<= 200 KB` attachment limits.
- **Platform Admin Isolation**: Platform-level administration (`isAdmin()`) checks the bootstrap admin or `/admins/{uid}` explicitly—workspace `admin` roles never grant cross-tenant platform access.

## Express Security Controls (`server/src/app.ts`)

- **HTTP Security Headers**: `helmet` enabled (`X-Powered-By` disabled).
- **CORS Allowlist**: Validates origins from `CORS_ORIGIN` and `APP_URL`, rejecting unlisted cross-origin callers with `403 CORS_FORBIDDEN`.
- **Rate Limiting**: `express-rate-limit` guards `/api/*` routes (`429 RATE_LIMIT_EXCEEDED`).
- **Payload Caps & Validation**: `100kb` JSON/URL-encoded limits with Zod `validateRequest` middleware and sanitized production error responses.
