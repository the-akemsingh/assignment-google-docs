# project demo url : https://www.loom.com/share/62e68db6de684a47b86c8357d9e0e733
# project github url : https://github.com/the-akemsingh/assignment-google-docs


# Project Documentation

# Project Status

## What Is Working

- File sharing between seeded users.
- Document editing and persistence.
- Revoking document access.
- Authentication using seeded users for now.

## What Is Incomplete

- Document upload functionality is not complete.

## What I Would Build Next With Another 2-4 Hours

1. Complete and verify the document upload functionality end to end.
2. Dockerize the frontend and backend applications.
3. Add CI/CD workflow YAML files for automated checks and deployment workflows.

---

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

---

# Architecture Note

## Overview

The application is split into a React/Vite frontend and an Express/TypeScript API. Supabase provides Postgres persistence and raw file storage. The API uses the Supabase service-role client, so Supabase credentials stay on the server and the API is responsible for authorization.

```text
Browser
  |  React pages, Tiptap editor, fetch API client
  v
Express API
  |-- /auth       mocked email login -> signed JWT
  |-- /documents  CRUD, sharing, and file import
  |-- middleware  JWT authentication, document access, errors
  v
Supabase
  |-- Postgres: users, documents, document_shares, document_imports
  `-- Storage: imports bucket for original .txt/.md files
```

## Authentication and authorization

`POST /auth/login` looks up an email in the seeded `users` table and returns a backend-signed, 24-hour JWT. There are no passwords or external identity providers in this version; this is a deliberate mocked-login boundary.

The `requireAuth` middleware validates the bearer token and attaches the user to the request. Document routes then use `requireDocAccess` to load the document and allow either its owner or a user with a row in `document_shares`. Delete, share, list-shares, and revoke-share operations additionally require ownership.

## Data model

- `users`: seeded demo identities used by the mocked login flow.
- `documents`: owner, title, timestamps, and editor content in Tiptap/ProseMirror `jsonb` format.
- `document_shares`: unique document-to-user access grants.
- `document_imports`: audit record connecting an imported source file to its created document.

Keeping editor content as JSON preserves the structure produced by Tiptap without a lossy text conversion. The raw source file is stored separately in the Supabase `imports` bucket.

## Request flows

### Document editing

1. The frontend logs in and stores the returned JWT.
2. The API client sends the token with document requests.
3. The route validates request bodies with Zod.
4. A service reads or writes Supabase rows and returns `{ data: ... }`.
5. The central error handler maps validation, not-found, forbidden, and unexpected errors to `{ error: ... }`.

### File import

`POST /documents/import` accepts multipart field `file`. Multer allows `.txt` and `.md` files up to 2 MB. The import service parses the text into Tiptap JSON, creates a document titled from the filename, uploads the original file under the user's path in Storage, and records the import metadata.

## Current scope and tradeoffs

Included: document CRUD, owner-based sharing, `.txt`/`.md` import, and an integration test for the sharing flow.

Not included: real-time collaboration, version history, separate view/edit roles, password authentication, `.docx` parsing, or database-level RLS policies. Backend authorization is the current enforcement layer; Supabase RLS would be a useful defense-in-depth follow-up.

## Source map

- API bootstrap and route mounting: `backend/src/app.ts`, `backend/src/index.ts`
- Auth: `backend/src/routes/auth.routes.ts`, `backend/src/middleware/auth.ts`, `backend/src/services/auth.service.ts`
- Documents and sharing: `backend/src/routes/documents.routes.ts`, `backend/src/services/documents.service.ts`, `backend/src/services/shares.service.ts`
- Import: `backend/src/services/import.service.ts`
- Schema and seed data: `backend/supabase/migrations/0001_init.sql`, `backend/supabase/seed.sql`
