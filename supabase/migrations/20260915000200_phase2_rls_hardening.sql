alter function public.is_editor_or_admin() set search_path = public, pg_temp;

create policy "countries are public" on public.countries for select using (true);
create policy "categories are public" on public.categories for select using (true);
create policy "users can read their profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "users can update their profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "users can read their role" on public.user_roles for select to authenticated using (user_id = auth.uid());

create policy "published clusters are public" on public.story_clusters for select using (
  exists (
    select 1 from public.story_cluster_items item
    join public.news_articles article on article.id = item.article_id
    where item.cluster_id = public.story_clusters.id and article.status = 'PUBLISHED'
  )
);
create policy "published cluster items are public" on public.story_cluster_items for select using (
  exists (select 1 from public.news_articles article where article.id = article_id and article.status = 'PUBLISHED')
);
create policy "published revisions are public" on public.article_revisions for select using (
  exists (select 1 from public.news_articles article where article.id = article_id and article.status = 'PUBLISHED')
);
create policy "editorial users can manage AI runs" on public.ai_processing_runs for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "editorial users can manage revisions" on public.article_revisions for all to authenticated using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());