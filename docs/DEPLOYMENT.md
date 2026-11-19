# Deployment Guide

## Architecture Summary

TaskFlow runs as a unified Node.js service (`server.ts`) serving `/api/v1/*` and the compiled Vite SPA (`dist/`), backed by Firebase Cloud Firestore and Firebase Authentication.

## Build & Start

```bash
npm run build
NODE_ENV=production npm start
```

## Production Environment Variables

- `NODE_ENV=production`
- `PORT=3000`
- `CORS_ORIGIN=<Deployed frontend origin>`
- `APP_URL=<Deployed public URL>`

## Firebase Configuration & Quotas

- Ensure `firebase-applet-config.json` points to the target Firebase project and Firestore database ID.
- Deploy `firestore.rules` before allowing production traffic.
- **Firebase Spark / Starter Tier Notes**: Free-tier limits apply to daily Firestore reads/writes/deletes, storage volume, and authentication quotas. Review Firebase project billing/quota limits before scaling to large teams, and review `firestore.rules` carefully before sharing broadly.

## GitHub Pages Deployment

Because TaskFlow uses Vite and TypeScript (`src/main.tsx`), GitHub Pages must serve the compiled `dist/` bundle rather than the raw repository root.

1. Push the `.github/workflows/deploy.yml` workflow to your `main` branch.
2. In your GitHub repository, go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions** (not "Deploy from a branch").
3. The workflow automatically detects the repository subpath (e.g. `/Taskflow/`) via `vite.config.ts`, configures React Router's `basename`, and emits `dist/404.html` + `dist/.nojekyll` for SPA client-side routing.
4. For Google Sign-In to work on GitHub Pages, add `<username>.github.io` under **Firebase Console → Authentication → Settings → Authorized domains**.

