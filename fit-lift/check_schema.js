const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pishysekxhestbyhzbhi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpc2h5c2VreGhlc3RieWh6YmhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM1ODIyMCwiZXhwIjoyMDg4OTM0MjIwfQ.BuLIyhM1ozj-WOYEaBefYScvKuNxkVOi3IUWWRbMJ3g');
const fs = require('fs');

async function main() {
  const { data: membersInfo, error: mErr } = await supabase.rpc('get_schema_info', { table_name: 'members' });
  
  // also check if there is an existing member named Ziad
  const { data: ziad, error: zErr } = await supabase.from('members').select('*').ilike('name', '%Ziad%');
  
  fs.writeFileSync('db_schema.json', JSON.stringify({ membersInfo, mErr, ziad, zErr }, null, 2));
}

main().catch(console.error);
