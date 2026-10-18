# TWNS Phase 2 Foundation

Phase 2 adds the database and ingestion foundation for legitimate news sources. It does not publish fabricated stories and it does not bypass editorial review.

## What is implemented

- Additive Supabase migrations for sources, ingestion runs, source items, articles, clusters, revisions, AI runs, and editorial flags.
- RLS policies that make only `PUBLISHED` article data public.
- Editorial data access based on `user_roles` values `EDITOR`, `ADMIN`, and `SUPER_ADMIN`.
- URL canonicalization, title normalization, deterministic hashes, and item validation.
- A server-side RSS adapter with conditional request headers, timeout handling, malformed-item skipping, and attribution fields.
- Server-only Supabase service-role configuration boundary.
- Supabase Auth sign-up/sign-in with account profiles and persisted country, language, and preferred-category selections.

## Database setup

The migrations are in `supabase/migrations/`. They have been applied to the linked project. For a local Supabase stack, run:

```text
supabase start
supabase db reset
```

Do not put `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, or an AI provider key in browser code. Copy `.env.example` to the local environment and fill values through the deployment secret manager.

Vercel Hobby permits only one scheduled cron run per day, so this project does not configure a Vercel cron. The `/api/admin/ingestion/run-due` route requires `CRON_SECRET`. To run it more frequently, configure an external scheduler to send a `POST` request to the production route on the desired schedule, with `CRON_SECRET` as a bearer token in the `Authorization` header. Store the same secret in Vercel's server environment and the scheduler's secret store; never put it in client code or a public workflow file.

Separately, the Supabase `rss-ingest` cron job runs every 15 minutes, keeps Edge Function JWT verification enabled, and reads its gateway JWT and private function token from Supabase Vault. Its handler only creates `REVIEW` articles; editorial approval is required before publication.

## Reader accounts

Readers can create accounts at `/signup`, sign in at `/signin`, and manage their profile at `/profile`. `/onboarding` and `/personalize` save country, language, and category preferences to the signed-in user's `profiles` row. The auth-user trigger creates that row during sign-up; profile row policies restrict reads and writes to the owner.

## Source model

Create sources as `RSS`, `API`, `OFFICIAL`, or `PUBLISHER`. The source endpoint and provider configuration belong in `news_sources`; provider credentials belong in server-side environment or a secret manager, never in `config` sent to the browser.

The RSS adapter is `RssSourceAdapter` in `lib/ingestion/rss.ts`. New providers should implement `NewsSourceAdapter` from `lib/ingestion/types.ts` and use the shared helpers in `lib/ingestion/normalize.ts`.

## Verification

Run `npm run build` after changes. The linked Supabase project should also be checked with the security and performance advisors after each migration.
