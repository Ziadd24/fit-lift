const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pishysekxhestbyhzbhi.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpc2h5c2VreGhlc3RieWh6YmhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM1ODIyMCwiZXhwIjoyMDg4OTM0MjIwfQ.BuLIyhM1ozj-WOYEaBefYScvKuNxkVOi3IUWWRbMJ3g';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
  global: { fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }) }
});

async function main() {
  console.log('Cleaning up test photos...');
  
  // 1. Delete DB rows with caption "PERSIST_TEST", "API Test Upload", "Test Upload", etc.
  // And the bad "Error 2105" photo (ID 2 or caption matching)
  const { data: toDelete, error: listErr } = await supabase
    .from('photos')
    .select('id, url, caption');
    
  if (listErr) {
    console.error('List error:', listErr);
    return;
  }
  
  const idsToDelete = [];
  const filesToDelete = [];
  
  for (const p of toDelete) {
    if (p.id === 2 || 
        p.caption === 'PERSIST_TEST' || 
        p.caption === 'API Test Upload' || 
        p.caption === 'Test Upload' || 
        p.caption === 'Direct DB Test' ||
        !p.caption) {
      idsToDelete.push(p.id);
      
      // Extract filename from URL to delete from storage
      if (p.url) {
        const urlParts = p.url.split('/');
        const filename = urlParts[urlParts.length - 1];
        if (filename) filesToDelete.push(filename);
      }
    }
  }

  console.log('Deleting IDs:', idsToDelete);
  
  if (idsToDelete.length > 0) {
    const { error: delErr } = await supabase
      .from('photos')
      .delete()
      .in('id', idsToDelete);
      
    if (delErr) {
      console.error('Delete DB error:', delErr);
    } else {
      console.log('Deleted DB rows successfully.');
    }
  }
  
  console.log('Deleting Files from bucket:', filesToDelete);
  if (filesToDelete.length > 0) {
    const { error: storageErr } = await supabase
      .storage
      .from('gym-photos')
      .remove(filesToDelete);
      
    if (storageErr) {
      console.error('Delete Storage error:', storageErr);
    } else {
      console.log('Deleted storage files successfully.');
    }
  }
  
  console.log('Cleanup complete.');
}

main().catch(console.error);
