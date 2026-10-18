alter table public.profiles
  add column if not exists preferred_categories text[] not null default '{}';

alter table public.profiles enable row level security;

drop policy if exists "Allow public read access to profiles" on public.profiles;
drop policy if exists "Allow individual insert access" on public.profiles;
drop policy if exists "users can insert their profile" on public.profiles;
create policy "users can insert their profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_country text := upper(coalesce(new.raw_user_meta_data ->> 'country_code', ''));
  requested_language text := lower(coalesce(new.raw_user_meta_data ->> 'language_code', ''));
  requested_categories text[] := '{}';
begin
  if jsonb_typeof(new.raw_user_meta_data -> 'preferred_categories') = 'array' then
    select coalesce(array_agg(value), '{}'::text[])
      into requested_categories
      from jsonb_array_elements_text(new.raw_user_meta_data -> 'preferred_categories') as item(value);
  end if;

  insert into public.profiles (id, display_name, country_code, language_code, preferred_categories)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name')), ''),
    case when requested_country in ('NG', 'US', 'GB', 'FR', 'ES') then requested_country else 'NG' end,
    case when requested_language in ('en', 'fr', 'es') then requested_language else 'en' end,
    requested_categories
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();