create table if not exists public.feeds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null unique,
  category text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null,
  summary_bullets jsonb not null default '[]'::jsonb,
  full_analysis text not null,
  source_url text not null,
  source_url_hash text not null unique,
  source_name text not null,
  published_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_summary_bullets_array check (jsonb_typeof(summary_bullets) = 'array')
);

alter table public.feeds enable row level security;
alter table public.articles enable row level security;
