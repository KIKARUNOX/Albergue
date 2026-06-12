# Codigo316 · Gestión de Asistencias y Retos

Stack: **React 19 + TypeScript + Vite 8** · Frontend  
**Cloudflare Pages Functions** · Backend API  
**Firebase Auth + Firestore** · Authentication & Database

---

## Quick Start

```bash
npm install
npm run dev
```

**Build & Deploy:**

```bash
npm run lint        # ESLint check
npm run build       # TypeScript check + Vite build
npm run deploy:pages # Deploy to Cloudflare Pages (recommended)
```

---

## Configuration

### Frontend Environment Variables

Copy `.env.example` to `.env` and fill in:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)
- `VITE_FIRESTORE_DATABASE_ID` (optional)

### Cloudflare Pages (Backend API)

Deploy at Cloudflare Pages to enable `functions/api/*` endpoints:

```bash
npm run deploy:pages
```

Set secrets in **Pages → Settings → Variables and Secrets**:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_WEB_API_KEY`
- `FIRESTORE_DATABASE_ID` (optional, defaults to `(default)`)
- `FIREBASE_SERVICE_ACCOUNT_JSON` (full Service Account JSON)

**Alternative to `FIREBASE_SERVICE_ACCOUNT_JSON`:**

- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (escaped newlines as `\n`)

**Test locally:**

```bash
npm run dev:pages  # Full Pages + Functions simulation
```

### API Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/bootstrap-session` | POST | Lookup/upsert persona, return profile + permissions |
| `/api/link-persona` | POST | Match existing persona to Firebase user |
| `/api/register-persona` | POST | Create new persona in Firestore |
| `/api/upload-evento-image` | POST | Upload event image to Google Drive |

All endpoints require Firebase ID token in `Authorization: Bearer` header.

**Image Upload Setup:**

Set `GOOGLE_DRIVE_EVENTOS_FOLDER_ID` in Cloudflare secrets (see [SETUP_EVENTOS_DRIVE.md](SETUP_EVENTOS_DRIVE.md)).

---

## Features

### Retos (Challenges)

- **Asistencia Retos**: Add challenges to attendance records. Spaces in name/description are preserved as typed.
- **Próximo Reto Semanal**: Schedule a recurring challenge for the next attendance automatically.
- **Puntos**: Points awarded to users who complete challenges.

### Personas

- Firebase Auth user linking to personas
- Role-based access: `joven` (default), `coordinador`, `lider`
- Permissions managed in `src/lib/permissions.ts`

### Eventos

- Event image gallery with drag-drop upload
- Google Drive integration for image storage

---

## Project Structure

```
src/
├── components/
│   ├── atoms/          Button, Input, Label, etc.
│   ├── molecules/      Reusable component groups
│   ├── organisms/      Feature sections (Asistencia, Retos, etc.)
│   └── pages/          Route components
├── hooks/              React hooks (useAsistenciaPage, etc.)
├── lib/                Utilities (api, permissions, cache, etc.)
├── styles/             CSS (no Tailwind, no CSS-in-JS)
└── type/               TypeScript type definitions

functions/api/         Cloudflare Pages Functions (backend)
firebase-functions/    Separate Firebase Functions project
```

---

## Recent Changes

- **Reto input**: Name and description fields now preserve spaces as typed (no trimming on save).
- **Events**: Image upload to Google Drive via `/api/upload-evento-image`.

---

## Notes

- **No Tests**: Project has no test framework. Use manual testing or add Jest/Vitest as needed.
- **React Compiler**: Enabled in Vite config. May impact dev/build performance.
- **TypeScript Strict**: `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals` active.
- **CSS**: Vanilla CSS files in `src/styles/`. No Tailwind or CSS-in-JS.
- **Caching**: Dual memory + sessionStorage cache via `src/lib/readCache.ts`.
