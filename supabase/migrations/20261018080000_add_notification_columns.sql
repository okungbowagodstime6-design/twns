alter table public.profiles
  add column if not exists breaking_alerts_enabled boolean not null default true,
  add column if not exists daily_digest_enabled boolean not null default true;