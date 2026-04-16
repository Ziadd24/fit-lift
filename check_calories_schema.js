const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pishysekxhestbyhzbhi.supabase.co', 'sb_secret_atIDKzB1wcLPAA9pwI4wtQ_549EkFPQ');

async function main() {
  const { data, error } = await supabase.from('calorie_logs').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Schema:', Object.keys(data[0] || {}));
    console.log('Sample row:', data[0]);
  }
}
main();
