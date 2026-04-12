require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function main() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('key', 'schedule_image_url')
    .single();

  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
