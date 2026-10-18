export type BreakingNewsArticle = {
  title: string;
  excerpt: string;
  slug: string;
  category: string;
  featured_image_url?: string | null;
  country_code?: string | null;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character] ?? character);
}

function safeImageUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function createBreakingNewsEmail(article: BreakingNewsArticle, recipientName?: string | null) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com").replace(/\/+$/, "");
  const articleUrl = `${siteUrl}/article/${encodeURIComponent(article.slug)}?utm_source=email&utm_medium=breaking_alert&utm_campaign=audience_retention`;
  const title = escapeHtml(article.title);
  const excerpt = escapeHtml(article.excerpt);
  const category = escapeHtml(article.category);
  const country = article.country_code ? escapeHtml(article.country_code.toUpperCase()) : "GLOBAL";
  const greeting = recipientName ? `Hello, ${escapeHtml(recipientName)}.` : "Hello.";
  const imageUrl = safeImageUrl(article.featured_image_url);
  const image = imageUrl
    ? `<tr><td style="padding:0 0 24px"><img src="${escapeHtml(imageUrl)}" alt="" width="552" style="display:block;width:100%;max-width:552px;height:auto;border:0"></td></tr>`
    : "";

  return {
    subject: `Breaking: ${article.title}`,
    html: `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"></head>
  <body style="margin:0;padding:0;background:#090d16;color:#ffffff;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#090d16;width:100%">
      <tr><td align="center" style="padding:32px 16px">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#111827;border:1px solid #293244">
          <tr><td style="padding:26px 24px 18px;border-bottom:1px solid #293244">
            <span style="display:inline-block;background:#dc2626;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1px;padding:7px 10px">BREAKING NEWS</span>
            <span style="color:#9ca3af;font-size:12px;margin-left:10px">TWNS · ${country}</span>
          </td></tr>
          <tr><td style="padding:26px 24px 30px">
            <p style="margin:0 0 10px;color:#f87171;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">${category}</p>
            <p style="margin:0 0 16px;color:#d1d5db;font-size:14px">${greeting}</p>
            <h1 style="margin:0 0 16px;color:#ffffff;font-size:30px;line-height:1.2">${title}</h1>
            <p style="margin:0 0 24px;color:#cbd5e1;font-size:16px;line-height:1.65">${excerpt}</p>
            ${image}
            <a href="${escapeHtml(articleUrl)}" style="display:inline-block;background:#dc2626;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:14px 20px">Read the full story</a>
          </td></tr>
          <tr><td style="padding:18px 24px;border-top:1px solid #293244;color:#9ca3af;font-size:11px;line-height:1.5">You are receiving this alert because breaking news notifications are enabled on your TWNS profile.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  };
}