/*
  Doctor Gemma Product Factory — initial schema (extends the bolt.new schema).
  projects → source material; source_briefs → normalised input; products → outputs;
  assets → uploads (audio/docs/exports); jobs → generation runs (model routing audit).
*/

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  title text not null,
  raw_input text,
  source_type text not null default 'typed', -- typed | doc | mp3 | live | drive
  status text not null default 'draft',      -- draft | generating | completed
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists source_briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  brief text not null,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  product_id text not null,           -- registry id (tip-sheet, ebook, mini-course, ...)
  audience text not null default 'parent',
  content jsonb,                      -- generated structured content
  file_url text,                      -- rendered export in Storage
  thumbnail_url text,
  status text not null default 'draft', -- draft | review | approved | exported
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  kind text not null,                 -- audio | doc | export-pdf | export-png | export-mp4 | csv
  storage_path text not null,
  public_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid,
  kind text not null,                 -- normalise | generate | render | transcribe | export
  product_id text,
  model text,
  input_tokens int,
  output_tokens int,
  status text not null,               -- ok | error
  error text,
  created_at timestamptz default now()
);

create table if not exists calendar_posts (
  id uuid primary key default gen_random_uuid(),
  product_ref uuid references products(id) on delete set null,
  post_date date not null,
  post_time text not null default '09:00',
  platforms text[] not null default '{instagram}',
  text_content text not null,
  media_url text,
  first_comment text,
  link text,
  uploaded boolean not null default false, -- true once pushed to Content360
  created_at timestamptz default now()
);

alter table projects enable row level security;
alter table source_briefs enable row level security;
alter table products enable row level security;
alter table assets enable row level security;
alter table jobs enable row level security;
alter table calendar_posts enable row level security;

-- Single-owner app: authenticated users manage their own rows; service role bypasses RLS.
create policy "own projects" on projects for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own briefs" on source_briefs for all to authenticated
  using (exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "own products" on products for all to authenticated
  using (exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "own assets" on assets for all to authenticated
  using (exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "read own jobs" on jobs for select to authenticated using (true);
create policy "own calendar" on calendar_posts for all to authenticated using (true) with check (true);
