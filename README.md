# RevenueOS — Frontend

React + TypeScript frontend for RevenueOS.

## Stack

- React 18, TypeScript, Vite
- Tailwind CSS + shadcn/ui components
- TanStack Query for server state
- redux-toolkit-state for global client state
- React Router, React Hook Form + Zod
- Axios with automatic token refresh

## Prerequisites

- Node.js 20+
- The backend running at `http://localhost:8080`

## Running locally

```bash
yarn install
cp .env.example .env   # leave VITE_API_URL empty to use the dev proxy
yarn dev
```

The app runs at `http://localhost:5173`. The Vite dev server proxies `/api` to
the backend, so no extra CORS setup is needed.

Sign in with the seeded demo account: **admin@demo.io / Password123!**

## Scripts

- `yarn dev` — start the dev server
- `yarn build` — type-check and build for production
- `yarn generate` — regenerate the API client/hooks from `openapi.json` (Kubb)
- `yarn lint` — lint the source
- `yarn format` — format with Prettier

## Structure

```
src/
  api/         TanStack Query hooks and API calls
  components/  ui/ (shadcn primitives) and shared components
  features/    feature modules (auth, dashboard, …)
  lib/         axios client, query client, utils, token storage
  routes/      route guards (ProtectedRoute)
  store/       global client state (redux-toolkit-state)
  types/       shared TypeScript types
```

Access and refresh tokens are stored in `localStorage` for the Axios layer; the
authenticated user is held in global state. Server data is fetched and cached
with TanStack Query and is not duplicated into the global store.
