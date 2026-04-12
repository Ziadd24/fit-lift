const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabaseUrl = 'https://pishysekxhestbyhzbhi.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpc2h5c2VreGhlc3RieWh6YmhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM1ODIyMCwiZXhwIjoyMDg4OTM0MjIwfQ.BuLIyhM1ozj-WOYEaBefYScvKuNxkVOi3IUWWRbMJ3g';
const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const { data: members, error: mErr } = await supabase.from('members').select('*');
  const { data: coaches, error: cErr } = await supabase.from('coaches').select('*');
  
  fs.writeFileSync('db_out_members.json', JSON.stringify({members, coaches}, null, 2), 'utf8');
  console.log('done', mErr || '', cErr || '');
}
main();
