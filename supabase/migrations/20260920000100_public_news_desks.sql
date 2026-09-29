insert into public.countries (code, name, region) values
  ('NG', 'Nigeria', 'Africa'),
  ('GH', 'Ghana', 'Africa'),
  ('KE', 'Kenya', 'Africa'),
  ('ZA', 'South Africa', 'Africa'),
  ('US', 'United States', 'Americas'),
  ('GB', 'United Kingdom', 'Europe'),
  ('FR', 'France', 'Europe'),
  ('DE', 'Germany', 'Europe'),
  ('IN', 'India', 'Asia-Pacific'),
  ('CN', 'China', 'Asia-Pacific'),
  ('JP', 'Japan', 'Asia-Pacific'),
  ('AU', 'Australia', 'Asia-Pacific'),
  ('AE', 'United Arab Emirates', 'Middle East'),
  ('BR', 'Brazil', 'Americas'),
  ('CA', 'Canada', 'Americas')
on conflict (code) do nothing;

insert into public.categories (name, slug) values
  ('World', 'world'),
  ('Business', 'business'),
  ('Technology', 'technology'),
  ('Sports', 'sports'),
  ('Entertainment', 'entertainment')
on conflict (slug) do nothing;

alter table public.countries enable row level security;
alter table public.categories enable row level security;

drop policy if exists "countries are public" on public.countries;
create policy "countries are public" on public.countries for select using (true);

drop policy if exists "categories are public" on public.categories;
create policy "categories are public" on public.categories for select using (true);

update public.news_articles a
set category_id = s.category_id
from public.article_sources ar
join public.news_sources s on s.id = ar.source_id
where a.category_id is null
  and s.category_id is not null;

update public.news_articles
set category_id = (select id from public.categories where slug = 'business' limit 1)
where category_id is null
  and (title ilike '%market%' or title ilike '%bank%' or title ilike '%economy%' or title ilike '%business%' or title ilike '%inflation%');

update public.news_articles
set category_id = (select id from public.categories where slug = 'technology' limit 1)
where category_id is null
  and (title ilike '%tech%' or title ilike '%software%' or title ilike '%artificial intelligence%' or title ilike '% digital %');

update public.news_articles
set category_id = (select id from public.categories where slug = 'sports' limit 1)
where category_id is null
  and (title ilike '%sport%' or title ilike '%football%' or title ilike '%soccer%' or title ilike '%cricket%' or title ilike '%nba%');

update public.news_articles
set category_id = (select id from public.categories where slug = 'entertainment' limit 1)
where category_id is null
  and (title ilike '%film%' or title ilike '%movie%' or title ilike '%music%' or title ilike '%hollywood%' or title ilike '%celebrity%');

update public.news_articles
set category_id = (select id from public.categories where slug = 'world' limit 1)
where category_id is null;

update public.news_articles
set article_type = 'BREAKING'
where article_type = 'STANDARD'
  and (title ilike '%breaking%' or title ilike '%urgent%');

update public.news_articles
set article_type = 'DEVELOPING'
where article_type = 'STANDARD'
  and (title ilike '%developing%' or title ilike '%live update%');
