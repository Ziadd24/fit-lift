const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pishysekxhestbyhzbhi.supabase.co', 'sb_secret_atIDKzB1wcLPAA9pwI4wtQ_549EkFPQ');

async function main() {
  const { data, error } = await supabase.from('calorie_logs').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total logs:', data.length);
  data.forEach((l, idx) => {
    if (!l.result || !l.result.totals) {
      console.log(`Log ID ${l.id} (index ${idx}) has malformed result:`, l.result);
    }
  });
}
main();
