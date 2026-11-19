# Development Guide

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Provide a valid `MONGODB_URI` (local MongoDB or MongoDB Atlas).

## Available Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Runs `tsx server.ts` with Express + Vite middleware on port 3000 |
| `npm run build` | Builds frontend production bundle into `dist/` |
| `npm start` | Starts production Node server (`node server.ts`) |
| `npm run lint` | Runs TypeScript type-check (`tsc --noEmit`), `oxlint` (`.ts`/`.tsx`/React), and `eslint` (`.js`/`.mjs`) |
| `npm test` | Runs Vitest unit and Supertest API integration suite |

## Coding Standards

- TypeScript strict type checking with erasable syntax for Node 22 compatibility.
- Centralized error handling via `AppError` and `errorHandler` (no swallowed errors).
- Tailwind CSS v4 design tokens defined in `src/index.css`.
