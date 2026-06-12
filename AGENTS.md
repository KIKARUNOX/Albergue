# Codigo316 — AGENTS.md

## Stack

- **Frontend**: React 19 + TypeScript + Vite 8, react-aria-components, sweetalert2, xlsx
- **Backend API**: Cloudflare Pages Functions (`functions/api/*.ts`), called same-origin `/api/*`
- **Auth + DB**: Firebase Auth, Firestore REST API (server-to-server only, never from browser)
- **Image upload**: Google Drive via service account (`upload-evento-image.ts`)
- **No tests** — no test framework or test files; do not assume testing tools exist

## Key commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server (frontend + Cloudflare Functions via `@cloudflare/vite-plugin`) |
| `npm run build` | Typecheck (`tsc -b`) then Vite build |
| `npm run lint` | ESLint (`.`) |
| `npm run dev:pages` | Build + `wrangler pages dev dist` (heavier alternative for local Functions) |
| `npm run deploy:pages` | Full Cloudflare Pages deploy (build, clean artifacts, `wrangler pages deploy`) |
| `npm run firebase:functions:deploy` | Deploy Firebase Functions from separate `firebase-functions/` dir |

**Required order**: `npm run lint` → `npm run build` (`build` already includes typecheck).

## TypeScript quirks

- `verbatimModuleSyntax: true` → must use `import type` for type-only imports
- `erasableSyntaxOnly: true` → no enums, no namespaces, no `constructor` parameter properties
- `noUnusedLocals` + `noUnusedParameters` active — unused code will fail `build`
- `noUncheckedSideEffectImports: true` — imports must be explicit
- `tsconfig.json` is a project reference file; actual configs in `tsconfig.app.json` (src) and `tsconfig.node.json` (vite.config.ts)

## Architecture

- **Entrypoints**: `src/main.tsx` (React SPA), `functions/api/*.ts` (Cloudflare Functions, file-based routing → `/api/*`)
- **`@cloudflare/vite-plugin`** is active in `vite.config.ts` — `npm run dev` serves both the frontend AND Pages Functions. You generally only need `dev:pages` to test the exact wrangler deployment.
- **React Compiler** is enabled (babel `reactCompilerPreset` plugin) — mind the dev/build performance impact.
- **Routing**: react-router-dom `BrowserRouter` with inlined `ProtectedRoute` in `App.tsx`
- **Roles**: `joven` (default, limited), `coordinador`, `lider` — permissions in `src/lib/permissions.ts`
- **Component structure**: `atoms/` (Button, Modal, StatusMessage), `molecules/`, `organisms/` (AppHeader, AppNavigation), `pages/`, `templates/`
- **Styles**: CSS files in `src/styles/` (tokens, base, components, layout, modal, pages). No CSS-in-JS, no Tailwind.
- **Env vars**: `VITE_*` for frontend (`src/env.d.ts`), unprefixed for server (Cloudflare secrets or `.dev.vars`)
- **API client**: `src/lib/apiBase.ts` returns path as-is (same-origin `/api/*`). No `VITE_API_BASE_URL` used.
- **Caching**: `src/lib/readCache.ts` — dual memory + sessionStorage cache utility

## Repo structure notes

- `functions/api/` are Cloudflare Pages Functions (NOT Firebase Functions), deployed via `wrangler pages deploy`
- `firebase-functions/` referenced in `firebase.json` is a **separate project** — not in this repo
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

## Server environment variables (Cloudflare secrets)

Required for `functions/api/` to work:

| Variable | Where used |
|----------|-----------|
| `FIREBASE_PROJECT_ID` | Firestore + Drive |
| `FIREBASE_WEB_API_KEY` | JWT verification |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account JSON (or use `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`) |
| `GOOGLE_DRIVE_EVENTOS_FOLDER_ID` | Image upload target folder |
| `FIRESTORE_DATABASE_ID` | Optional, defaults to `(default)` |

`IMGBB_EVENTOS_API_KEY` in `.env.example` is **unused** by the current codebase — image upload uses Google Drive.

## Firebase Functions (separate project)

`firebase-functions/` is an independent Node.js project at a sibling path. It has its own `package.json` and deployment flow (`npm run firebase:functions:deploy`). The README documents its required environment variables.
