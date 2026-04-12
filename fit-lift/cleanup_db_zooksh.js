const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://pishysekxhestbyhzbhi.supabase.co';
const serviceKey = 'sb_secret_atIDKzB1wcLPAA9pwI4wtQ_549EkFPQ';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const { data: members, error: mErr } = await supabase.from('members').select('*');
  const { data: coaches, error: cErr } = await supabase.from('coaches').select('*');
  
  if (mErr) {
    console.error("mErr", mErr);
    return;
  }
  
  console.log("Coaches found:", coaches.map(c => c.name));
  console.log("Members found:", members.map(m => m.name));
  
  const zooksh = members.find(m => m.name.toLowerCase().includes('zooksh'));
  if (!zooksh) {
    console.log("Could not find Zooksh!");
    return;
  }
  
  // We need to keep only Zooksh.
  const toDelete = members.filter(m => m.id !== zooksh.id).map(m => m.id);
  
  if (toDelete.length > 0) {
    console.log("Deleting members:", toDelete);
    const { error: delErr } = await supabase.from('members').delete().in('id', toDelete);
    if (delErr) {
      console.error("Failed to delete members", delErr);
    } else {
      console.log("Deleted other members successfully");
    }
  } else {
    console.log("No other members to delete.");
  }
  
  // Now assign Zooksh to the private coach. Let's see who the current coach is.
  // There is likely an active coach, for instance the first one in the database.
  // Wait, the client only wants the "current coach". The user is logged in as captain/coach.
  // We will assign zooksh's coach_id to the only coach and test it.
  if (coaches.length > 0) {
    const coachId = coaches[0].id;
    console.log(`Setting zooksh's coach_id to ${coachId}`);
    const { error: updErr } = await supabase.from('members').update({ coach_id: coachId }).eq('id', zooksh.id);
    if (updErr) console.error("Error updating...", updErr);
    else console.log("Zooksh updated successfully.");
  } else {
    console.log("No coaches found in the DB.");
  }
}

main();
