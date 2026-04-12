const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pishysekxhestbyhzbhi.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpc2h5c2VreGhlc3RieWh6YmhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM1ODIyMCwiZXhwIjoyMDg4OTM0MjIwfQ.BuLIyhM1ozj-WOYEaBefYScvKuNxkVOi3IUWWRbMJ3g';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function main() {
  // List all photos
  const { data, error } = await supabase
    .from('photos')
    .select('id, caption, member_id, created_at')
    .order('id', { ascending: true });
  
  if (error) {
    console.log('LIST ERROR: ' + JSON.stringify(error));
    return;
  }
  
  console.log('TOTAL PHOTOS: ' + data.length);
  data.forEach(p => {
    console.log('PHOTO id=' + p.id + ' caption=' + (p.caption || 'null') + ' member=' + (p.member_id || 'null') + ' at=' + p.created_at);
  });

  // Insert test
  console.log('---INSERTING---');
  const { data: ins, error: insErr } = await supabase
    .from('photos')
    .insert({ url: 'https://example.com/test.png', caption: 'PERSIST_TEST', member_id: null })
    .select('id, caption')
    .single();
  
  if (insErr) {
    console.log('INSERT ERROR: ' + JSON.stringify(insErr));
  } else {
    console.log('INSERTED id=' + ins.id + ' caption=' + ins.caption);
  }

  // Re-list
  console.log('---RE-LIST---');
  const { data: data2, error: err2 } = await supabase
    .from('photos')
    .select('id, caption')
    .order('id', { ascending: true });
  
  if (err2) {
    console.log('RE-LIST ERROR: ' + JSON.stringify(err2));
  } else {
    console.log('TOTAL PHOTOS AFTER: ' + data2.length);
    data2.forEach(p => console.log('PHOTO id=' + p.id + ' caption=' + (p.caption || 'null')));
  }
}

main().catch(e => console.log('FATAL: ' + e.message));
