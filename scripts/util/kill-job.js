// Direct database access to cancel job
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Load environment variables from .env file

async function killJob() {
  const jobId = 'd2102f06-1439-4c11-a847-b593b35d8797';
  
  try {
    console.log(`FORCE KILLING job: ${jobId}`);
    
    // Using environment variables to connect to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
      return;
    }
    
    // Initialize Supabase client with service role key for admin rights
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First, check if job exists
    const { data: job, error: fetchError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching job:', fetchError);
      return;
    }
    
    if (!job) {
      console.error('Job not found');
      return;
    }
    
    console.log('Current job status:', job.status);
    console.log('User ID:', job.user_id);
    
    // Force update job status to canceled
    const { error: updateError } = await supabase
      .from('import_jobs')
      .update({ 
        status: 'canceled',
        progress: job.progress || 0,
        is_completed: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
      
    if (updateError) {
      console.error('Error updating job:', updateError);
      return;
    }
    
    console.log('Job successfully marked as canceled in database');
    
    // Check job status after update
    const { data: updatedJob, error: updatedError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
      
    if (updatedError) {
      console.error('Error fetching updated job:', updatedError);
      return;
    }
    
    console.log('New job status:', updatedJob.status);
    
  } catch (error) {
    console.error('Error killing job:', error);
  }
}

// Run the function
killJob(); 