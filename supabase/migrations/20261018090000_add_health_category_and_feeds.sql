alter table public.news_feeds
  drop constraint if exists news_feeds_category_check;

alter table public.news_feeds
  add constraint news_feeds_category_check
  check (category = any (array[
    'general',
    'politics',
    'business',
    'entertainment',
    'sports',
    'tech',
    'health',
    'breaking',
    'country'
  ]::text[]));

insert into public.categories (name, slug)
values ('Health', 'health')
on conflict (slug) do update set name = excluded.name;

insert into public.news_feeds (feed_name, feed_url, category, country_code, sub_category)
values
  ('World Health Organization News', 'https://www.who.int/rss-feeds/news-english.xml', 'health', 'GLOBAL', 'general'),
  ('Medical Xpress Health News', 'https://medicalxpress.com/rss-feed/health-news/', 'health', 'GLOBAL', 'general'),
  ('ScienceDaily Health & Medicine', 'https://www.sciencedaily.com/rss/health_medicine.xml', 'health', 'GLOBAL', 'general')
on conflict (feed_url) do nothing;
