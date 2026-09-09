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
