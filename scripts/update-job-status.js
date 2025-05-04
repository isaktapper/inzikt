const { createClient } = require('@supabase/supabase-js');

async function forceUpdateJobStatus() {
  const jobId = 'd2102f06-1439-4c11-a847-b593b35d8797';
  
  // Using the project values from .env.local
  const SUPABASE_URL = 'https://pztdwevfmjdnocovtgve.supabase.co';
  const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dGR3ZXZmbWpkbm9jb3Z0Z3ZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDIyOTg5NiwiZXhwIjoyMDU5ODA1ODk2fQ.9KwoUHotESG5W2sICV4secEHa66FubLJWdjYDZGha8Q';
  
  console.log('Directly updating job status in the database...');
  
  try {
    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Force update the job status to canceled
    const { data, error } = await supabase
      .from('import_jobs')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select();
    
    if (error) {
      console.error('Error updating job status:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Job status updated successfully:', data);
    } else {
      console.log('No job found with ID:', jobId);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Execute the function
forceUpdateJobStatus(); 