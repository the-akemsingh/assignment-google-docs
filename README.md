# Collaborative Document Editor

A small collaborative document editor with a React/Vite frontend and an Express/TypeScript backend. Documents are stored in Supabase as Tiptap/ProseMirror JSON, and owners can share documents with other seeded users.

## Stack

- Frontend: React, TypeScript, Vite, Tiptap
- Backend: Node.js, TypeScript, Express
- Persistence and file storage: Supabase Postgres and Storage
- Authentication: backend-issued JWT for seeded users (intentionally mocked)

## Prerequisites

- Node.js 18+ and npm
- A Supabase project
- Git, if cloning the repository

There is no root `package.json`; install and run the frontend and backend separately.

## Supabase setup

1. Create a Supabase project.
2. In the Supabase SQL Editor, run `backend/supabase/migrations/0001_init.sql`.
3. Run `backend/supabase/seed.sql` to create the demo users.
4. In **Storage**, create a bucket named `imports`. The bucket is required for file imports and is not created by the SQL migration.
5. Copy the project URL and service-role key from the Supabase project settings. The service-role key is server-only and must never be exposed to the frontend.

The seeded login accounts are:

- `alice@example.com`
- `bob@example.com`
- `carol@example.com`

The login flow only checks that the email exists in the seeded `users` table. It does not verify a password.

## Backend setup

```powershell
cd backend
npm install
```

Create `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=replace-with-a-long-random-secret
PORT=4000
```

Start the API in development mode:

```powershell
npm run dev
```

The API listens on `http://localhost:4000` by default. Check it with:

```powershell
curl http://localhost:4000/health
```

## Frontend setup

In a second terminal:

```powershell
cd frontend
npm install
```

The frontend defaults to `http://localhost:4000` for the API. To use another backend URL, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000
```

Start the frontend:

```powershell
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Useful commands

Backend, from `backend/`:

```powershell
npm run dev       # start the development API
npm run build     # compile TypeScript to dist/
npm test          # run the integration test suite
```

Frontend, from `frontend/`:

```powershell
npm run dev       # start Vite
npm run build     # type-check and create a production build
npm run lint      # run Oxlint
npm run preview   # preview the production build
```

The backend integration test uses Supabase and seeded data. It needs a reachable, correctly configured test database and may leave test documents behind; use a disposable project when possible.

## API overview

Successful responses use `{ "data": ... }`; failures use `{ "error": { "message", "code" } }`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/login` | Issue a JWT for a seeded email |
| `GET` | `/health` | Check that the API is running |
| `POST` | `/documents` | Create an empty document |
| `GET` | `/documents` | List owned and shared documents |
| `GET` | `/documents/:id` | Read a document the user can access |
| `PATCH` | `/documents/:id` | Update title or Tiptap content |
| `DELETE` | `/documents/:id` | Delete a document as its owner |
| `POST` | `/documents/:id/share` | Share a document with a seeded user |
| `GET` | `/documents/:id/shares` | List a document's shares as its owner |
| `DELETE` | `/documents/:id/share/:userId` | Revoke a share as its owner |
| `POST` | `/documents/import` | Import a `.txt` or `.md` file, up to 2 MB |

Protected endpoints require `Authorization: Bearer <token>`.

## Project layout

```text
backend/                 Express API, services, middleware, SQL
  src/routes/             HTTP endpoints
  src/services/           Supabase-backed application logic
  supabase/               Migration and seed SQL
  docs/                   Architecture note
frontend/                React/Vite application
  src/api/                API client functions
  src/pages/              Login, dashboard, and document views
  src/components/         Editor, toolbar, sharing, and import UI
```

See [backend/docs/architecture.md](backend/docs/architecture.md) for the request flow, data model, and current scope.
