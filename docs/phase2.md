# TWNS Phase 2 Foundation

Phase 2 adds the database and ingestion foundation for legitimate news sources. It does not publish fabricated stories and it does not bypass editorial review.

## What is implemented

- Additive Supabase migrations for sources, ingestion runs, source items, articles, clusters, revisions, AI runs, and editorial flags.
- RLS policies that make only `PUBLISHED` article data public.
- Editorial data access based on `user_roles` values `EDITOR`, `ADMIN`, and `SUPER_ADMIN`.
- URL canonicalization, title normalization, deterministic hashes, and item validation.
- A server-side RSS adapter with conditional request headers, timeout handling, malformed-item skipping, and attribution fields.
- Server-only Supabase service-role configuration boundary.

## Database setup

The migrations are in `supabase/migrations/`. They have been applied to the linked project. For a local Supabase stack, run:

```text
supabase start
supabase db reset
```

Do not put `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, or an AI provider key in browser code. Copy `.env.example` to the local environment and fill values through the deployment secret manager.

Scheduled ingestion requires `CRON_SECRET` in both local `.env.local` and the deployment environment. The scheduler sends it as `Authorization: Bearer <CRON_SECRET>`; without it, the endpoint correctly returns `401` and does not fetch sources.

## Source model

Create sources as `RSS`, `API`, `OFFICIAL`, or `PUBLISHER`. The source endpoint and provider configuration belong in `news_sources`; provider credentials belong in server-side environment or a secret manager, never in `config` sent to the browser.

The RSS adapter is `RssSourceAdapter` in `lib/ingestion/rss.ts`. New providers should implement `NewsSourceAdapter` from `lib/ingestion/types.ts` and use the shared helpers in `lib/ingestion/normalize.ts`.

## Current limitation

Phase 1 has no working authentication or role-management flow, API routes, scheduler, or editorial dashboard. The existing `/admin` route therefore remains a locked foundation page. The next implementation milestone is to add Supabase Auth session handling and protected server routes before exposing source management or ingestion actions.

## Verification

Run `npm run build` after changes. The linked Supabase project should also be checked with the security and performance advisors after each migration.