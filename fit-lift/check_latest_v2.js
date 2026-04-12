require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function main() {
  const { data, error, count } = await supabase
    .from('photos')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('Total photos:', count);
    console.log('Latest photo:', JSON.stringify(data[0], null, 2));
  }
}

main().catch(console.error);
