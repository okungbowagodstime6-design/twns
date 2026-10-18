do $$
begin
	if not exists (
		select 1 from vault.secrets where name = 'rss_ingest_cron_token'
	) then
		perform vault.create_secret(
			encode(gen_random_bytes(32), 'hex'),
			'rss_ingest_cron_token',
			'Private authorization token for the scheduled RSS ingestion function'
		);
	end if;

	if not exists (
		select 1 from vault.secrets where name = 'rss_ingest_anon_jwt'
	) then
		raise exception 'Store the project anon JWT in Vault as rss_ingest_anon_jwt before applying this migration';
	end if;
end;
$$;

create or replace function public.is_valid_rss_ingest_cron_token(presented_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select exists (
		select 1
		from vault.decrypted_secrets
		where name = 'rss_ingest_cron_token'
			and decrypted_secret = presented_token
	);
$$;

revoke all on function public.is_valid_rss_ingest_cron_token(text) from public, anon, authenticated;
grant execute on function public.is_valid_rss_ingest_cron_token(text) to service_role;

select cron.alter_job(
	1,
	'*/15 * * * *',
	$job$
		select net.http_post(
			url := 'https://zqapguxqdjtkrinjxfoe.supabase.co/functions/v1/rss-ingest',
			headers := jsonb_build_object(
				'Content-Type', 'application/json',
				'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'rss_ingest_anon_jwt'),
				'x-cron-token', (select decrypted_secret from vault.decrypted_secrets where name = 'rss_ingest_cron_token')
			),
			body := '{}'::jsonb
		);
	$job$
);
