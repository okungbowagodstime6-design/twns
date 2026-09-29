create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country_code text,
  language_code text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'USER' check (role in ('USER', 'EDITOR', 'ADMIN', 'SUPER_ADMIN')),
  created_at timestamptz not null default now()
);

create table if not exists public.countries (
  code text primary key,
  name text not null unique,
  region text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null check (source_type in ('RSS', 'API', 'OFFICIAL', 'PUBLISHER')),
  endpoint text not null,
  is_active boolean not null default true,
  country_code text references public.countries(code),
  language_code text,
  category_id uuid references public.categories(id),
  config jsonb not null default '{}'::jsonb,
  polling_interval_minutes integer not null default 30 check (polling_interval_minutes > 0),
  last_success_at timestamptz,
  last_error_at timestamptz,
  consecutive_failures integer not null default 0,
  total_successes integer not null default 0,
  total_failures integer not null default 0,
  etag text,
  last_modified text,
  next_run_at timestamptz,
  last_run_at timestamptz,
  health_status text not null default 'HEALTHY' check (health_status in ('HEALTHY', 'WARNING', 'FAILING', 'DISABLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  content text,
  original_url text,
  source_name text,
  author text,
  country_code text references public.countries(code),
  language_code text,
  category_id uuid references public.categories(id),
  status text not null default 'DISCOVERED' check (status in ('DISCOVERED', 'NORMALIZED', 'DUPLICATE', 'CLUSTERED', 'AI_PROCESSING', 'REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED')),
  article_type text not null default 'STANDARD' check (article_type in ('BREAKING', 'DEVELOPING', 'STANDARD', 'ANALYSIS', 'OPINION')),
  published_at timestamptz,
  source_published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.article_sources (
  article_id uuid not null references public.news_articles(id) on delete cascade,
  source_id uuid not null references public.news_sources(id) on delete cascade,
  original_url text not null,
  created_at timestamptz not null default now(),
  primary key (article_id, source_id)
);

create table if not exists public.article_topics (
  article_id uuid not null references public.news_articles(id) on delete cascade,
  topic text not null,
  created_at timestamptz not null default now(),
  primary key (article_id, topic)
);

create table if not exists public.source_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.news_sources(id) on delete cascade,
  external_id text,
  canonical_url text not null,
  title text not null,
  description text,
  author text,
  source_published_at timestamptz,
  language_code text,
  country_code text references public.countries(code),
  raw_payload jsonb,
  normalized_hash text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  article_id uuid references public.news_articles(id) on delete set null,
  processing_status text not null default 'DISCOVERED' check (processing_status in ('DISCOVERED', 'NORMALIZED', 'DUPLICATE', 'CLUSTERED', 'AI_PROCESSING', 'REVIEW', 'PROCESSED', 'REJECTED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists source_items_source_external_id_idx on public.source_items(source_id, external_id) where external_id is not null;
create unique index if not exists source_items_source_canonical_url_idx on public.source_items(source_id, canonical_url);
create index if not exists source_items_normalized_hash_idx on public.source_items(normalized_hash);
create index if not exists source_items_source_published_at_idx on public.source_items(source_published_at);

create table if not exists public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.news_sources(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'RUNNING' check (status in ('RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED')),
  items_fetched integer not null default 0,
  items_created integer not null default 0,
  items_updated integer not null default 0,
  items_skipped integer not null default 0,
  items_failed integer not null default 0,
  error_message text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists public.story_clusters (
  id uuid primary key default gen_random_uuid(),
  canonical_title text not null,
  slug text not null unique,
  country_code text references public.countries(code),
  region text,
  category_id uuid references public.categories(id),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'DEVELOPING', 'RESOLVED', 'ARCHIVED')),
  first_seen_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.story_cluster_items (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid not null references public.story_clusters(id) on delete cascade,
  source_item_id uuid not null references public.source_items(id) on delete cascade,
  article_id uuid references public.news_articles(id) on delete set null,
  similarity_score numeric(5, 4),
  match_method text not null check (match_method in ('EXACT_URL', 'EXTERNAL_ID', 'TITLE_HASH', 'KEYWORD_SIMILARITY', 'ENTITY_MATCH', 'SEMANTIC_SIMILARITY', 'MANUAL')),
  created_at timestamptz not null default now(),
  unique (cluster_id, source_item_id)
);

create table if not exists public.article_revisions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  version integer not null,
  title text not null,
  summary text,
  content text,
  editor_id uuid references auth.users(id),
  change_reason text,
  created_at timestamptz not null default now(),
  unique (article_id, version)
);

create table if not exists public.ai_processing_runs (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.news_articles(id) on delete cascade,
  source_item_id uuid references public.source_items(id) on delete cascade,
  cluster_id uuid references public.story_clusters(id) on delete cascade,
  task_type text not null,
  model text,
  prompt_version text,
  status text not null default 'QUEUED' check (status in ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'REJECTED')),
  output_json jsonb,
  flags jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.editorial_flags (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  flag_type text not null,
  severity text not null check (severity in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  reason text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id)
);

create index if not exists news_sources_due_idx on public.news_sources(is_active, next_run_at);
create index if not exists ingestion_runs_source_idx on public.ingestion_runs(source_id);
create index if not exists ingestion_runs_status_idx on public.ingestion_runs(status);
create index if not exists ingestion_runs_started_idx on public.ingestion_runs(started_at);
create index if not exists story_cluster_items_cluster_idx on public.story_cluster_items(cluster_id);
create index if not exists story_cluster_items_source_item_idx on public.story_cluster_items(source_item_id);
create index if not exists ai_processing_runs_status_idx on public.ai_processing_runs(status);
create index if not exists editorial_flags_article_idx on public.editorial_flags(article_id);
create index if not exists news_articles_status_published_idx on public.news_articles(status, published_at);

alter table public.news_sources enable row level security;
alter table public.news_articles enable row level security;
alter table public.article_sources enable row level security;
alter table public.article_topics enable row level security;
alter table public.source_items enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.story_clusters enable row level security;
alter table public.story_cluster_items enable row level security;
alter table public.article_revisions enable row level security;
alter table public.ai_processing_runs enable row level security;
alter table public.editorial_flags enable row level security;

create policy "published articles are public" on public.news_articles for select using (status = 'PUBLISHED');
create policy "published article sources are public" on public.article_sources for select using (exists (select 1 from public.news_articles a where a.id = article_id and a.status = 'PUBLISHED'));
create policy "published article topics are public" on public.article_topics for select using (exists (select 1 from public.news_articles a where a.id = article_id and a.status = 'PUBLISHED'));

create or replace function public.is_editor_or_admin()
returns boolean
language sql
stable
security invoker
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('EDITOR', 'ADMIN', 'SUPER_ADMIN')
  );
$$;

revoke execute on function public.is_editor_or_admin() from public, anon, authenticated;
grant execute on function public.is_editor_or_admin() to authenticated;

create policy "editorial users can read sources" on public.news_sources for select to authenticated using (public.is_editor_or_admin());
create policy "editorial users can manage sources" on public.news_sources for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "editorial users can manage ingestion" on public.ingestion_runs for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "editorial users can manage pipeline data" on public.source_items for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "editorial users can manage clusters" on public.story_clusters for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "editorial users can manage cluster items" on public.story_cluster_items for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "editorial users can manage editorial data" on public.editorial_flags for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());