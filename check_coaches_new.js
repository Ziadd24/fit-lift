const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCoaches() {
  const { data: coaches, error } = await supabase
    .from('coaches')
    .select('*');

  if (error) {
    console.error('Error fetching coaches:', error);
    return;
  }

  console.log('Coaches in DB:', JSON.stringify(coaches, null, 2));
}

checkCoaches();
