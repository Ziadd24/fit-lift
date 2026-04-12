require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "gym-photos";

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function main() {
  const { data, error } = await supabase.storage.from(bucketName).list('', {
    limit: 10,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' }
  });

  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
