const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://pishysekxhestbyhzbhi.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpc2h5c2VreGhlc3RieWh6YmhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM1ODIyMCwiZXhwIjoyMDg4OTM0MjIwfQ.BuLIyhM1ozj-WOYEaBefYScvKuNxkVOi3IUWWRbMJ3g';
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await supabase.from('calorie_logs').select('*');
  if (error) {
    console.error('QUERY ERROR:', error);
  } else {
    console.log('SUCCESS, fetched ' + data.length + ' rows');
  }
}
main();
