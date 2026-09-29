alter table public.news_sources alter column next_run_at set default now();

update public.news_sources
set next_run_at = now()
where is_active = true and next_run_at is null;