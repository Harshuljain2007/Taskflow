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
