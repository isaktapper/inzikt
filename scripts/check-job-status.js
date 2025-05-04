const { createClient } = require('@supabase/supabase-js');

async function checkJobStatus() {
  const jobId = 'd2102f06-1439-4c11-a847-b593b35d8797';
  
  // Using the project values from .env.local
  const SUPABASE_URL = 'https://pztdwevfmjdnocovtgve.supabase.co';
  const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dGR3ZXZmbWpkbm9jb3Z0Z3ZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDIyOTg5NiwiZXhwIjoyMDU5ODA1ODk2fQ.9KwoUHotESG5W2sICV4secEHa66FubLJWdjYDZGha8Q';
  
  console.log(`Checking status for job ID: ${jobId}`);
  
  try {
    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Query the database for the job status
    const { data, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error) {
      console.error('Error fetching job status:', error);
      return;
    }
    
    if (data) {
      console.log('Job details:');
      console.log('------------------------');
      console.log(`ID: ${data.id}`);
      console.log(`Status: ${data.status}`);
      console.log(`User ID: ${data.user_id}`);
      console.log(`Job Type: ${data.job_type}`);
      console.log(`Created: ${new Date(data.created_at).toLocaleString()}`);
      console.log(`Updated: ${new Date(data.updated_at).toLocaleString()}`);
      console.log('------------------------');
    } else {
      console.log('No job found with ID:', jobId);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Execute the function
checkJobStatus(); 