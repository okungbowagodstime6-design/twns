import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

const parser = new Parser();

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch live RSS Feed (e.g. BBC News)
    const feed = await parser.parseURL('http://feeds.bbci.co.uk/news/rss.xml');

    // 2. Select the latest 3 articles
    const itemsToSave = feed.items.slice(0, 3).map((item) => ({
      title: item.title,
      description: item.contentSnippet || item.summary || '',
      original_url: item.link,
      category: 'general'
    }));

    // 3. Save to Supabase (ignores duplicates automatically via original_url)
    const { data, error } = await supabase
      .from('articles')
      .upsert(itemsToSave, { onConflict: 'original_url' })
      .select();

    if (error) throw error;

    return NextResponse.json({ status: 'success', inserted: data });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}