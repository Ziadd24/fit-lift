import { getSupabaseAdmin } from "./lib/supabase";

async function run() {
  const supabase = getSupabaseAdmin();
  console.log("Inserting coach...");
  const { data, error } = await supabase
    .from("coaches")
    .insert({
      name: "Test Coach",
      password_hash: "admin-only-display-coach"
    })
    .select();
  
  if (error) {
    console.error("Error inserting coach:", error);
  } else {
    console.log("Success:", data);
  }
}

run();
