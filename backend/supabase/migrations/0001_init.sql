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
