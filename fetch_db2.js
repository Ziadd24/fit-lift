const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pishysekxhestbyhzbhi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpc2h5c2VreGhlc3RieWh6YmhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM1ODIyMCwiZXhwIjoyMDg4OTM0MjIwfQ.BuLIyhM1ozj-WOYEaBefYScvKuNxkVOi3IUWWRbMJ3g');
const fs = require('fs');

async function main() {
  const {data: members, error: mErr} = await supabase.from('members').select('*');
  const {data: coaches, error: cErr} = await supabase.from('coaches').select('*');
  
  fs.writeFileSync('db_out2.json', JSON.stringify({ members, coaches, mErr, cErr }, null, 2));
}

main().catch(console.error);
