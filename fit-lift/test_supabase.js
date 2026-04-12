// Direct Supabase test - bypassing the API
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pishysekxhestbyhzbhi.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpc2h5c2VreGhlc3RieWh6YmhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM1ODIyMCwiZXhwIjoyMDg4OTM0MjIwfQ.BuLIyhM1ozj-WOYEaBefYScvKuNxkVOi3IUWWRbMJ3g';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log('=== Direct Supabase Test ===\n');
  
  // 1. List all photos
  console.log('--- Step 1: List all photos in DB ---');
  const { data: allPhotos, error: listErr } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (listErr) {
    console.error('List error:', listErr);
  } else {
    console.log(`Found ${allPhotos.length} photos:`);
    allPhotos.forEach(p => console.log(`  ID: ${p.id}, Caption: ${p.caption}, URL: ${p.url?.substring(0, 60)}...`));
  }

  // 2. Try to insert a test photo
  console.log('\n--- Step 2: Insert test photo ---');
  const testUrl = 'https://pishysekxhestbyhzbhi.supabase.co/storage/v1/object/public/gym-photos/test-direct.png';
  const { data: insertData, error: insertErr } = await supabase
    .from('photos')
    .insert({ url: testUrl, caption: 'Direct DB Test', member_id: null })
    .select('*')
    .single();
  
  if (insertErr) {
    console.error('INSERT ERROR:', insertErr);
  } else {
    console.log('Insert success! ID:', insertData.id);
    console.log('Full row:', JSON.stringify(insertData));
  }

  // 3. List again to verify
  console.log('\n--- Step 3: Verify after insert ---');
  const { data: afterPhotos, error: afterErr } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (afterErr) {
    console.error('After-list error:', afterErr);
  } else {
    console.log(`Found ${afterPhotos.length} photos after insert:`);
    afterPhotos.forEach(p => console.log(`  ID: ${p.id}, Caption: ${p.caption}`));
  }

  // 4. Check for RLS
  console.log('\n--- Step 4: Check storage bucket ---');
  const { data: buckets, error: bucketErr } = await supabase
    .storage
    .listBuckets();
  
  if (bucketErr) console.error('Bucket error:', bucketErr);
  else console.log('Buckets:', buckets.map(b => `${b.name} (public: ${b.public})`).join(', '));

  // 5. List files in gym-photos bucket
  const { data: files, error: filesErr } = await supabase
    .storage
    .from('gym-photos')
    .list('', { limit: 20, sortBy: { column: 'created_at', order: 'desc' } });
  
  if (filesErr) console.error('Files error:', filesErr);
  else {
    console.log(`\nFiles in gym-photos bucket (${files.length}):`);
    files.forEach(f => console.log(`  ${f.name} (${f.metadata?.size || '?'} bytes)`));
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
