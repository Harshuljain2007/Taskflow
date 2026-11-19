# Testing Strategy

## Tooling

- **Vitest**: Unit and integration test runner (`vitest.config.ts`).
- **Supertest**: HTTP endpoint testing against the Express app factory (`createApp()`).
- **ESLint + Oxlint + TypeScript**: Static typechecking (`tsc --noEmit`), React/TS linting (`oxlint`), and Firebase security rules linting (`@firebase/eslint-plugin-security-rules` via `eslint`).

## Test Coverage

- `server/src/modules/health/tests/health.test.ts`:
  - Verifies `/api/v1/health` standardized response envelope and database diagnostics.
  - Verifies `/api/v1/health/ready` readiness behavior.
  - Verifies unmatched `/api/v1/*` routes return `404 ROUTE_NOT_FOUND` and malformed JSON returns `400 INVALID_JSON`.
  - Verifies `sanitizeMongoError` masks URI credentials cleanly.
- `firestore.rules.test.ts`:
  - Validates `firestore.rules` syntax, default-deny safety net, RBAC helpers, invitation rules, and alignment with `firebase-blueprint.json`.
- `src/lib/__tests__/utils.test.ts`:
  - Verifies Tailwind class merging (`cn`) and uptime formatting (`formatUptime`).
- `src/lib/__tests__/validation.test.ts`:
  - Verifies Zod validation schemas (`workspaceSchema`, `invitationSchema`, `projectSchema`, `taskSchema`, `profileSchema`), slug/ID helpers, and deadline date utilities.

## Running Verification

```bash
npm run lint
npm test
npm run build
```
