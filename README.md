# React + TypeScript + Vite


## Configuracion

1. Copia `.env.example` a `.env`.
2. Completa variables publicas de frontend.
3. Ejecuta la app.

```bash
npm install
npm run dev
```

Variables esperadas:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (opcional)
- `VITE_FIRESTORE_DATABASE_ID` (opcional)
- `VITE_API_BASE_URL` (opcional, para frontend en Cloudflare con backend externo; ejemplo: `https://us-central1-TU_PROYECTO.cloudfunctions.net`)

Variables de servidor (Cloudflare Functions) para acceso seguro con Service Account:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_WEB_API_KEY` (API key web de Firebase, usada solo para validar ID token en backend)
- `FIRESTORE_DATABASE_ID` (opcional, por defecto `(default)`)
- `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON completo de la Service Account)

Alternativa a `FIREBASE_SERVICE_ACCOUNT_JSON`:

- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (con saltos de linea escapados como `\n`)

Endpoints backend agregados para reducir operaciones sensibles en cliente:

- `POST /api/bootstrap-session`
- `POST /api/link-persona`
- `POST /api/register-persona`

## Cloudflare Pages (recomendado para /api)

Para que funcionen los endpoints de `functions/api/*`, despliega en Cloudflare Pages (no solo Worker de assets).

1. Crea un proyecto Pages llamado `codigo316`.
2. Configura variables/secrets en Pages -> Settings -> Variables and Secrets.
3. Despliega con:

```bash
npm run deploy:pages
```

En local puedes probar Pages + Functions con:

```bash
npm run dev:pages
```

Si usas solo `wrangler deploy` en modo Worker de assets, los `POST /api/*` pueden responder 405.

## Frontend Cloudflare + Backend Firebase

Si el frontend se publica en Cloudflare y el backend en Firebase Functions:

1. En Cloudflare (frontend), define `VITE_API_BASE_URL` con la URL base de Firebase Functions.
2. Redeploy del frontend para que Vite inyecte la variable.
3. Verifica en Network que las llamadas vayan a Firebase (no a `/api/*` del mismo dominio).

Ejemplos de `VITE_API_BASE_URL`:

- `https://us-central1-codigo316-837bd.cloudfunctions.net` (funciones separadas)
- `https://us-central1-codigo316-837bd.cloudfunctions.net/api` (una funcion `api` con rutas internas)

Con esta configuracion del repo (funcion unica `api` en Firebase), usa:

- `VITE_API_BASE_URL=https://us-central1-codigo316-837bd.cloudfunctions.net`

Pasos de despliegue del backend Firebase:

```bash
cd firebase-functions
npm install
npx firebase login
cd ..
npm run firebase:functions:deploy
```

Variables requeridas en Firebase Functions (Runtime config / Environment variables):

- `FIREBASE_PROJECT_ID=codigo316-837bd`
- `FIREBASE_WEB_API_KEY` (API key web de Firebase)
- `FIRESTORE_DATABASE_ID=(default)` (opcional)
- `FIREBASE_SERVICE_ACCOUNT_JSON` (recomendado)

Alternativa:

- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
