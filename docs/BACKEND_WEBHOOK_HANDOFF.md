# Breaking News Webhook Handoff

Send a `POST` request when a breaking story is published. Use the deployed site's origin for `<your-domain>`.

```http
POST https://<your-domain>/api/notifications/breaking
Content-Type: application/json
x-twns-webhook-secret: <copy TWNS_WEBHOOK_SECRET from the root .env.local>
```

```json
{
  "is_breaking": true,
  "status": "PUBLISHED",
  "title": "Example breaking story",
  "slug": "example-breaking-story",
  "excerpt": "A concise summary of the story.",
  "category": "WORLD",
  "featured_image_url": "https://example.com/story-image.jpg",
  "country_code": "NG"
}
```

Set `country_code` to `null` for a global story. The endpoint also accepts Supabase Database Webhook payloads whose `record` contains the article fields and uses `article_type: "BREAKING"` instead of `is_breaking: true`.

Keep the secret in `.env.local` or transfer it through an approved secret manager. Do not replace the placeholder with the literal secret in this tracked document.