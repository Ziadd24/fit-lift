const { createClient } = require("@supabase/supabase-js");

const url = "https://pishysekxhestbyhzbhi.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpc2h5c2VreGhlc3RieWh6YmhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM1ODIyMCwiZXhwIjoyMDg4OTM0MjIwfQ.BuLIyhM1ozj-WOYEaBefYScvKuNxkVOi3IUWWRbMJ3g";

const supabase = createClient(url, key);

async function checkTasks() {
    const { data: memberData, error: memberErr } = await supabase.from('members').select('*').limit(1);
    console.log("Members:", memberErr ? memberErr.message : "Exists");
    
    // Check if member_goals exists
    const { data: goalsData, error: goalsErr } = await supabase.from('member_goals').select('*').limit(1);
    console.log("Member Goals Table:", goalsErr ? goalsErr.message : "Exists");
}

checkTasks();
