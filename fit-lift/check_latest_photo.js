require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function main() {
  const { data, error } = await supabase
    .from('photos')
    .select('*, members(name)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
