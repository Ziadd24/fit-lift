const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pishysekxhestbyhzbhi.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpc2h5c2VreGhlc3RieWh6YmhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM1ODIyMCwiZXhwIjoyMDg4OTM0MjIwfQ.BuLIyhM1ozj-WOYEaBefYScvKuNxkVOi3IUWWRbMJ3g';
const supabase = createClient(supabaseUrl, serviceKey);

async function test() {
  console.log('Checking if table "calorie_logs" exists...');
  const { data, error } = await supabase
    .from('calorie_logs')
    .select('*')
    .limit(1);

  if (error) {
    if (error.code === '42P01') {
      console.log('ERROR: Table "calorie_logs" does NOT exist yet.');
    } else {
      console.log('Error checking table:', error);
    }
  } else {
    console.log('SUCCESS: Table "calorie_logs" exists.');
  }
}

test();
