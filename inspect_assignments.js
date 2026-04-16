const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pishysekxhestbyhzbhi.supabase.co', 'sb_secret_atIDKzB1wcLPAA9pwI4wtQ_549EkFPQ');

async function main() {
  const { data, error } = await supabase.from('members').select('id, name, coach_id');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Members:', JSON.stringify(data, null, 2));
  }
  
  const { data: coaches, error: cErr } = await supabase.from('coaches').select('id, name');
  if (cErr) {
    console.error('Coach Error:', cErr);
  } else {
    console.log('Coaches:', JSON.stringify(coaches, null, 2));
  }
}
main();
