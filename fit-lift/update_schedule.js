require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function main() {
  const scheduleUrl = "https://pishysekxhestbyhzbhi.supabase.co/storage/v1/object/public/gym-photos/1775943666195-1hwok6njjqy.jpeg";
  
  const { data, error } = await supabase
    .from('settings')
    .upsert({ key: 'schedule_image_url', value: scheduleUrl, updated_at: new Date().toISOString() });

  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('Successfully updated schedule_image_url to:', scheduleUrl);
  }
}

main().catch(console.error);
