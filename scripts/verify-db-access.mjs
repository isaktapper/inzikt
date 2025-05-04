// ES Module script to verify Supabase service role access
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function main() {
  console.log('Verifying Supabase service role access to import_jobs table');
  
  // Read .env.local file manually
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const envVars = {};
  
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
    }
  });
  
  // Extract environment variables
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRole = envVars.SUPABASE_SERVICE_ROLE_KEY;
  
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

    // Try with different job_type values
    const jobTypes = ['insights', 'zendesk', 'import', 'export', 'analysis'];

    for (const jobType of jobTypes) {
      console.log(`Trying job_type: ${jobType}`);
      const { data, error } = await supabase
        .from('import_jobs')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Dummy user ID
          job_type: jobType,
          status: 'pending',
          progress: 0,
          provider: 'verification_script',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) {
        console.error(`Error with job_type '${jobType}':`, error.message);
      } else {
        console.log(`Successfully inserted test row with job_type '${jobType}' and ID:`, data.id);
        
        // Try to delete the test row
        console.log('Deleting the test row');
        const { error: deleteError } = await supabase
          .from('import_jobs')
          .delete()
          .eq('id', data.id);
        
        if (deleteError) {
          console.error('Error deleting test row:', deleteError);
        } else {
          console.log('Successfully deleted test row');
        }
      }
    }
    
    console.log('Verification completed successfully');
  } catch (error) {
    console.error('Exception during verification:', error);
    process.exit(1);
  }
}

main(); 