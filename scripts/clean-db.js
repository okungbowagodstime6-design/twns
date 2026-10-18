import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeScrapedData() {
  console.log('Clearing verbatim scraped articles...');
  
  // Delete all entries from the articles table
  const { data, error } = await supabase
    .from('articles')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all rows safely

  if (error) {
    console.error('Error clearing table:', error);
  } else {
    console.log('Database successfully cleaned!');
  }
}

purgeScrapedData();