# Backend Architecture — Collaborative Document Editor

Stack: **Node.js + TypeScript + Express + Supabase (Postgres + Storage)**

## 1. Scope covered here
- Document CRUD + rich-text content persistence
- File upload → document import
- Sharing (owner grants access to another seeded user)
- Persistence + auth/authorization model

Out of scope (stated cuts, not oversights): real-time collab, version history, view-vs-edit permission tiers, `.docx` parsing, RLS-based authorization (backend enforces access instead — faster to build and test correctly in the time box; RLS as defense-in-depth is a good "next 2-4 hours" item).

---

## 2. Data Model (Postgres via Supabase)

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  title text not null default 'Untitled document',
  content jsonb not null default '{"type":"doc","content":[]}', -- Tiptap/ProseMirror JSON
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  shared_with_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (document_id, shared_with_user_id)
);

create table document_imports (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  uploaded_by uuid not null references users(id),
  original_file_name text not null,
  storage_path text not null,   -- path inside Supabase Storage bucket
  mime_type text not null,
  size_bytes int not null,
  created_at timestamptz not null default now()
);

create index idx_documents_owner on documents(owner_id);
create index idx_shares_doc on document_shares(document_id);
create index idx_shares_user on document_shares(shared_with_user_id);
```

**Why jsonb for content:** Tiptap/ProseMirror emits a JSON doc tree natively. Storing it as-is means no serialization loss and the frontend can `editor.commands.setContent(doc.content)` directly. A denormalized `content_text` column is deliberately skipped — not needed unless search is in scope.

**Why `document_imports` is separate from a generic `attachments` table:** the assignment's file-upload requirement only needs "upload → becomes a document." Keeping a dedicated audit table (source file, who uploaded, resulting doc) is cheap and gives you a real row to point to in the demo/video without inventing a general attachment system you don't otherwise need.

---

## 3. Auth Model (mocked, explicitly)

Seeded `users` table, no passwords. Login flow:

```
POST /auth/login
  body: { email }
  → 404 if email not seeded
  → 200 { token, user } where token is a backend-issued HS256 JWT: { sub: user.id, email }
```

`requireAuth` middleware verifies the JWT signature + expiry, attaches `req.user`. This is documented in the README as **intentionally mocked** — no real password/identity verification — which is explicitly allowed by the assignment brief.

*(Alternative considered: Supabase Auth with real seeded accounts + magic link. Rejected for MVP — more setup surface for zero product-judgment payoff in a 4-6hr box. Worth mentioning in the AI-workflow/architecture note as a considered tradeoff.)*

---

## 4. Authorization

Single middleware, used per-route:

```ts
async function requireDocAccess(req, res, next) {
  const doc = await getDocument(req.params.id);
  if (!doc) return next(new NotFoundError());
  const isOwner = doc.owner_id === req.user.id;
  const isShared = await hasShare(doc.id, req.user.id);
  if (!isOwner && !isShared) return next(new ForbiddenError());
  req.doc = doc;
  req.isOwner = isOwner;
  next();
}
```

Sharing itself (`POST /documents/:id/share`) additionally requires `req.isOwner === true` — only the owner can grant access.

---

## 5. API Surface

| Method | Route | Auth | Body / Params | Notes |
|---|---|---|---|---|
| POST | `/auth/login` | none | `{ email }` | returns JWT for seeded user |
| POST | `/documents` | required | `{ title? }` | creates empty doc, owner = caller |
| GET | `/documents` | required | — | returns `{ owned: Doc[], shared: Doc[] }` |
| GET | `/documents/:id` | required + access | — | 403 if no access |
| PATCH | `/documents/:id` | required + access | `{ title?, content? }` | partial update, bumps `updated_at` |
| DELETE | `/documents/:id` | required + owner | — | owner-only |
| POST | `/documents/:id/share` | required + owner | `{ email }` | looks up seeded user by email, creates share |
| GET | `/documents/:id/shares` | required + owner | — | list of users doc is shared with |
| DELETE | `/documents/:id/share/:userId` | required + owner | — | revoke access |
| POST | `/documents/import` | required | multipart `file` | `.txt`/`.md` only → creates new document |

Response shape is consistent: `{ data }` on success, `{ error: { message, code } }` on failure, mapped by a central error-handling middleware (`ZodError`→400, `NotFoundError`→404, `ForbiddenError`→403, everything else→500).

---

## 6. File Import Flow

```
POST /documents/import  (multipart/form-data, field: "file")

1. Validate mimetype/extension ∈ {text/plain, text/markdown, .txt, .md}
   → 400 with clear message otherwise (surfaced in UI + README as a stated limit)
2. Validate size (e.g. ≤ 2MB) → 400 if exceeded
3. Upload raw file to Supabase Storage bucket `imports/{userId}/{uuid}-{filename}`
4. Read file contents (text)
5. Parse into Tiptap JSON:
   - .txt  → each blank-line-separated block becomes a paragraph node
   - .md   → run through a small markdown→ProseMirror mapper (headings, bold/italic,
             bulleted/numbered lists); a markdown-it + prosemirror-markdown pairing,
             or Tiptap's own generateJSON with the markdown extension, covers this
             without hand-rolling a parser
6. Insert into `documents` (title = filename minus extension, content = parsed JSON)
7. Insert into `document_imports` (audit row, storage_path from step 3)
8. Return created document
```

Failure modes handled explicitly: unsupported type, oversized file, empty file, malformed content (falls back to plain-paragraph import rather than failing the whole request).

---

## 7. Folder Structure

```
server/
  src/
    index.ts              # app bootstrap
    config/
      supabase.ts          # supabase-js client (service role, server-only)
      env.ts               # env validation (zod)
    middleware/
      auth.ts               # requireAuth
      docAccess.ts          # requireDocAccess
      errorHandler.ts
    routes/
      auth.routes.ts
      documents.routes.ts
      import.routes.ts
    services/
      documents.service.ts  # DB access for documents
      shares.service.ts
      import.service.ts     # file parsing + storage upload
    schemas/                 # zod request-body schemas
    types/
    tests/
      sharing.test.ts        # the "at least one meaningful test"
      documents.test.ts
  package.json
  tsconfig.json
```

---

## 8. Testing Strategy (minimal but real)

One integration test suite is enough to satisfy the requirement credibly — pick behavior with actual logic, not a CRUD happy path:

- `sharing.test.ts`:
  1. User A creates a doc → User B `GET /documents/:id` → expect 403
  2. User A shares with B → User B `GET /documents/:id` → expect 200
  3. User B cannot `POST /documents/:id/share` (not owner) → expect 403

Run against a real (test) Supabase project or a local Postgres via `supertest` + a seed script — avoid mocking the DB layer, since the whole point is proving the access-control logic actually works.

---

## 9. Open decisions for you to confirm before I scaffold code
1. **Auth**: backend-issued mock JWT (above) vs. real Supabase Auth with seeded accounts — I'd default to mock JWT for speed.
2. **Framework**: Express vs. Fastify vs. Next.js API routes (the last one collapses frontend+backend deploy into one Vercel project, which simplifies your "live URL" deliverable).
3. **Markdown parsing** for import: pull in `markdown-it` + a ProseMirror bridge, or keep import `.txt`-only for v1 and add `.md` if time allows.

Let me know your calls on those and I'll start scaffolding the actual Express/TS project structure.