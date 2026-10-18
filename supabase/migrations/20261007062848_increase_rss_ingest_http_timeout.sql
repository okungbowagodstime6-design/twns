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
			body := '{}'::jsonb,
			timeout_milliseconds := 120000
		);
	$job$
);
