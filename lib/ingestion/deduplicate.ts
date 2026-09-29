import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function checkDuplicate(article: Partial<{source_url: string; title: string}>): Promise<boolean> {
  if (!article.source_url && !article.title) return false;

  if (article.source_url) {
    const { data } = await supabase.from('articles').select('id').eq('original_url', article.source_url).limit(1);
    if (data && data.length > 0) return true;
  }

  if (article.title) {
    const { data } = await supabase.from('articles').select('title');
    for (const existing of data || []) {
      if (existing.title.toLowerCase() === article.title.toLowerCase()) {
        return true;
      }
    }
  }

  return false;
}
