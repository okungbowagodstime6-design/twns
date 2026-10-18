alter table public.profiles
  add column if not exists preferred_categories text[] not null default '{}';

drop policy if exists "users can insert their profile" on public.profiles;
create policy "users can insert their profile"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());
