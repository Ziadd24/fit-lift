const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://pishysekxhestbyhzbhi.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpc2h5c2VreGhlc3RieWh6YmhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM1ODIyMCwiZXhwIjoyMDg4OTM0MjIwfQ.BuLIyhM1ozj-WOYEaBefYScvKuNxkVOi3IUWWRbMJ3g';
const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  // 1. Create Ziad
  const { data: ziadList, error: ziadListErr } = await supabase.from('members').select('id').eq('membership_code', 'FL-ZIAD');
  let ziadId;
  
  if (ziadList && ziadList.length > 0) {
    ziadId = ziadList[0].id;
    console.log('Ziad already exists:', ziadId);
  } else {
    const { data: newZiad, error: ziadErr } = await supabase.from('members').insert({
      name: 'Ziad',
      email: 'ziad@example.com',
      phone: '0000000000',
      membership_code: 'FL-ZIAD',
      membership_type: 'VIP',
      sub_expiry_date: '2026-12-31'
    }).select('id').single();
    
    if (ziadErr) throw new Error('Create Ziad Error: ' + JSON.stringify(ziadErr));
    ziadId = newZiad.id;
    console.log('Created Ziad:', ziadId);
  }

  // 2. Create Ahmad
  const { data: ahmadList, error: ahmadListErr } = await supabase.from('coaches').select('id').eq('email', 'ahmad@example.com');
  let ahmadId;
  
  if (ahmadList && ahmadList.length > 0) {
    ahmadId = ahmadList[0].id;
    console.log('Ahmad already exists:', ahmadId);
  } else {
    // Reusing the hash from db_out2.json '7fe60e779b9bfc5be8aa0edb6ea687f68fba776d93bf0fefbff110757bbc82a3'
    const { data: newAhmad, error: ahmadErr } = await supabase.from('coaches').insert({
      name: 'Ahmad',
      email: 'ahmad@example.com',
      password_hash: '7fe60e779b9bfc5be8aa0edb6ea687f68fba776d93bf0fefbff110757bbc82a3'
    }).select('id').single();
    
    if (ahmadErr) throw new Error('Create Ahmad Error: ' + JSON.stringify(ahmadErr));
    ahmadId = newAhmad.id;
    console.log('Created Ahmad:', ahmadId);
  }

  // 3. Link them by adding a message
  const { data: msg, error: msgErr } = await supabase.from('messages').insert({
    coach_id: ahmadId,
    member_id: ziadId,
    sender_type: 'coach',
    content: 'Welcome Ziad, I will be your private trainer!'
  });
  
  if (msgErr) console.error('Message link error:', msgErr);
  else console.log('Successfully created a message link between Ahmad and Ziad.');

  // 4. Create a session to link them
  const { data: sess, error: sessErr } = await supabase.from('sessions').insert({
    coach_id: ahmadId,
    member_id: ziadId,
    session_type: 'Personal Training',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    duration_minutes: 60,
    status: 'scheduled'
  });

  if (sessErr) console.error('Session link error:', sessErr);
  else console.log('Successfully created a session between Ahmad and Ziad.');
  
  console.log('\\nFake data setup complete! You can login as coach with email ahmad@example.com.');
}

main().catch(console.error);
