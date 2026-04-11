const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pishysekxhestbyhzbhi.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpc2h5c2VreGhlc3RieWh6YmhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM1ODIyMCwiZXhwIjoyMDg4OTM0MjIwfQ.BuLIyhM1ozj-WOYEaBefYScvKuNxkVOi3IUWWRbMJ3g';
const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const pwd = 'password123';
  const hash = crypto.createHash('sha256').update(pwd + 'fitgym-salt-v1').digest('hex');
  
  const { data, error } = await supabase.from('coaches').update({ password_hash: hash }).eq('name', 'Ahmad');
  console.log('Update password for Ahmad to "password123":', error ? error : 'Success');
}

main();
