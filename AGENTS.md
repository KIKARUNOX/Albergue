# Codigo316 — AGENTS.md

## Stack

- **Frontend**: React 19 + TypeScript + Vite 8
- **Backend API**: Cloudflare Pages Functions (`functions/api/*.ts`)
- **Auth + DB**: Firebase Auth, Firestore (server-to-server REST only, never from browser)
- **Image upload**: Google Drive via service account
- **No tests** — no test framework or test files found; do not assume testing tools exist

## Key commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server (frontend only) |
| `npm run build` | Typecheck (`tsc -b`) then Vite build |
| `npm run lint` | ESLint (`.`) |
| `npm run dev:pages` | Build + `wrangler pages dev dist` (local Functions) |
| `npm run deploy:pages` | Full Cloudflare Pages deploy (build, clean artifacts, `wrangler pages deploy`) |
| `npm run firebase:functions:deploy` | Deploy Firebase Functions from separate `firebase-functions/` dir |

**Required order**: `npm run lint` → `npm run build` (`build` already includes typecheck).

## Architecture

- **Entrypoints**: `src/main.tsx` (React SPA), `functions/api/*.ts` (Cloudflare Functions, file-based routing → `/api/*`)
- **Routing**: react-router-dom `BrowserRouter` with permission-gated `ProtectedRoute` component
- **Roles**: `joven` (default, limited), `coordinador`, `lider` — permissions in `src/lib/permissions.ts`
- **Component structure**: `atoms/` (Button, Modal, StatusMessage), `molecules/`, `organisms/`, `templates/`, `pages/`
- **Env vars**: `VITE_*` for frontend (`src/env.d.ts`), unprefixed for server (Cloudflare secrets or `.dev.vars`)
- **Firebase config**: `src/firebase.ts` reads all `VITE_FIREBASE_*` vars, conditionally initializes Analytics

## TypeScript quirks

- `verbatimModuleSyntax: true` → must use `import type` for type-only imports
- `erasableSyntaxOnly: true` → no enums, no namespaces, no `constructor` parameter properties
- `noUnusedLocals` + `noUnusedParameters` active — unused code will fail `build`
- `tsconfig.json` is a project reference file; actual configs in `tsconfig.app.json` (src) and `tsconfig.node.json` (vite.config.ts)

## Repo structure notes

- `functions/api/` are Cloudflare Pages Functions (NOT Firebase Functions), deployed via `wrangler pages deploy`
- `firebase-functions/` is referenced in `firebase.json` but is a **separate project** — not present in this repo
- `cloudflare/` is empty — `publish:worker` script in package.json references `cloudflare/security-worker.js` which does not exist yet
- `.wrangler/` and `dist/` are gitignored; `dist/` is the Pages build output dir

## Backend API endpoints (`functions/api/`)

| File | Route | Purpose |
|------|-------|---------|
| `bootstrap-session.ts` | `POST /api/bootstrap-session` | Lookup/upsert persona, return profile + permissions |
| `link-persona.ts` | `POST /api/link-persona` | Match existing persona by name to Firebase auth user |
| `register-persona.ts` | `POST /api/register-persona` | Create a new persona doc in Firestore |
| `upload-evento-image.ts` | `POST /api/upload-evento-image` | Upload image to Google Drive, return thumbnail URL |

All endpoints use JWT auth via `_firebaseAdmin.ts` (`verifyFirebaseIdToken`). Errors with "token" in message → 401; others → 500.

## Firebase Functions (separate project)

`firebase-functions/` is an independent Node.js project at a sibling path. It has its own `package.json` and deployment flow (`npm run firebase:functions:deploy`). The README documents its required environment variables.

## Setup

```bash
npm install
cp .env.example .env  # fill in VITE_FIREBASE_* vars
npm run dev
```

For local Cloudflare Functions testing: `npm run dev:pages`
