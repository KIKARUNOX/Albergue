# Albergue — AGENTS.md

## Stack

- **Frontend**: React 19 + TypeScript + Vite 8, react-router-dom, sweetalert2, xlsx
- **Auth + DB**: Supabase (Auth + PostgreSQL via `@supabase/supabase-js`)
- **No backend server** — all data operations go directly from the browser to Supabase
- **No tests** — no test framework or test files exist

## Key commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck (`tsc -b`) then Vite build |
| `npm run lint` | ESLint (`.`) |
| `npm run preview` | Serve production build locally |

**Required order**: `npm run lint` → `npm run build` (`build` includes typecheck).

## TypeScript quirks

- `verbatimModuleSyntax: true` → must use `import type` for type-only imports
- `erasableSyntaxOnly: true` → no enums, no namespaces, no `constructor` parameter properties
- `noUnusedLocals` + `noUnusedParameters` active — unused code will fail `build`
- `noUncheckedSideEffectImports: true` — imports must be explicit
- `tsconfig.json` is a project reference file; actual configs in `tsconfig.app.json` (src) and `tsconfig.node.json` (vite.config.ts)

## Architecture

- **Entrypoint**: `src/main.tsx` → React SPA with `BrowserRouter`
- **React Compiler** enabled (babel `reactCompilerPreset` plugin in `vite.config.ts`)
- **Supabase client**: `src/supabase.ts` — exports `supabase` (client) and `ADMIN_EMAIL`
- **Admin gating**: `ADMIN_EMAIL` from `VITE_ADMIN_EMAIL` env var. Components check `isAdmin` prop to show/hide admin features (personas CRUD, import). Supabase RLS should enforce this server-side.
- **Routing** (`src/App.tsx`): unauthenticated → login only. Authenticated → dashboard, personas (admin), import (admin)
- **Component structure**: `atoms/` (Button, Input, Label, Modal, Select, Spinner, StatusMessage, TextArea), `molecules/` (ExportarSection), `organisms/` (AppHeader, AppNavigation, LoginForm, PersonaCreateModal, PersonaEditModal, PersonasManagementSection, ImportarJovenesSection), `pages/` (DashboardPage, LoginPage, PersonasPageView, ImportarPage)
- **Styles**: vanilla CSS in `src/styles/` (tokens, base, components, layout, modal, pages). No Tailwind, no CSS-in-JS. `Modal.tsx` imports `modal.css` directly.
- **Env vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL` — all declared in `src/env.d.ts`

## Data model

Single table `personas` in Supabase PostgreSQL:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, auto-generated |
| `nombre` | text | Required |
| `apellido1` | text | |
| `apellido2` | text | |
| `sexo` | text | "M" or "F" |
| `cedula` | text | Unique |
| `edad` | integer | |
| `direccion` | text | |
| `estado_salud` | text | |
| `escolaridad` | text | |
| `created_at` | timestamptz | Auto |

SQL to create:
```sql
create table personas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido1 text not null default '',
  apellido2 text not null default '',
  sexo text not null default '',
  cedula text unique not null,
  edad integer default 0,
  direccion text not null default '',
  estado_salud text not null default '',
  escolaridad text not null default '',
  created_at timestamptz default now()
);
```

## Supabase setup required

1. Create project at supabase.com
2. Run the SQL above in SQL Editor
3. Enable RLS on `personas` table with appropriate policies
4. Create admin user in Auth → Users (email must match `VITE_ADMIN_EMAIL`)
5. Set `.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`

## Repo notes

- `functions/` directory was removed — no server-side code exists
- `wrangler.jsonc`, `firebase.json`, `.firebaserc` were removed
- `README.md` is outdated (still references Firebase/Cloudflare) — trust `AGENTS.md` instead
- `dist/` is gitignored (Vite build output)
- `src/lib/excelUtils.ts` — shared Excel helpers (normalizeHeader, findValue, downloadExcel, etc.)
- `src/lib/textNormalization.ts` — normalizeName, normalizeCedula, normalizeWhitespace
