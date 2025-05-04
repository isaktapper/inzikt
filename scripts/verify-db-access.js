// Node.js script to verify Supabase service role access
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  console.log('Verifying Supabase service role access to import_jobs table');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('NEXT_PUBLIC_SUPABASE_URL defined:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY defined:', !!supabaseServiceRole);
  
  if (!supabaseUrl || !supabaseServiceRole) {
    console.error('Missing required environment variables');
    process.exit(1);
  }
  
  try {
    // Create Supabase client with service role
    console.log('Creating Supabase client with service role');
    const supabase = createClient(supabaseUrl, supabaseServiceRole);
    
    // Attempt to insert a test row
    console.log('Attempting to insert a test row into import_jobs');
    const { data, error } = await supabase
      .from('import_jobs')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy user ID
        job_type: 'test',
        status: 'pending',
        provider: 'verification_script',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error inserting test row:', error);
      process.exit(1);
    }
    
    console.log('Successfully inserted test row with ID:', data.id);
    
    // Try to delete the test row
    console.log('Attempting to delete the test row');
    const { error: deleteError } = await supabase
      .from('import_jobs')
      .delete()
      .eq('id', data.id);
    
    if (deleteError) {
      console.error('Error deleting test row:', deleteError);
    } else {
      console.log('Successfully deleted test row');
    }
    
    console.log('Verification completed successfully');
  } catch (error) {
    console.error('Exception during verification:', error);
    process.exit(1);
  }
}

main(); 