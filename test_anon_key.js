const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pishysekxhestbyhzbhi.supabase.co', 'sb_publishable_Vs3i1gfOJdpcsx_buL1JZQ_oRZUhNHn');

async function main() {
  const { data, error } = await supabase.from('calorie_logs').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success, data length:', data.length);
  }
}
main();
