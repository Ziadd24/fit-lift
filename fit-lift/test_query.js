require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function main() {
  const { data, error } = await supabase
    .from('photos')
    .select('*, members(name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('ERROR:', error);
  } else {
    console.log('DATA LENGTH:', data?.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
