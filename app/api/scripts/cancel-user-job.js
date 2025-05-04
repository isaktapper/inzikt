// This script can be imported and used to cancel an analysis job for a specific user

import { createClient } from '@supabase/supabase-js';

export async function cancelAnalysisJob(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    throw new Error('Invalid user ID format');
  }
  
  console.log(`Canceling analysis job for user: ${userId}`);
  
  // Use service role for unrestricted database access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Find active analysis jobs for this user
  const { data: activeJobs, error: jobsError } = await supabase
    .from('import_jobs')
    .select('id')
    .eq('user_id', userId)
    .eq('job_type', 'analysis')
    .or('status.eq.processing,status.eq.pending')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (jobsError) {
    console.error('Error finding active analysis jobs:', jobsError);
    throw new Error('Failed to find active jobs');
  }
  
  if (!activeJobs || activeJobs.length === 0) {
    console.log('No active analysis jobs found for user:', userId);
    return {
      success: false,
      message: 'No active analysis jobs found'
    };
  }
  
  const jobId = activeJobs[0].id;
  console.log(`Found active analysis job with ID: ${jobId}`);
  
  // Update job status to 'canceled'
  const { error: updateError } = await supabase
    .from('import_jobs')
    .update({ 
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);
    
  if (updateError) {
    console.error('Error updating job:', updateError);
    throw new Error('Failed to cancel job');
  }
  
  console.log('Analysis job successfully canceled');
  
  // Try to clean up the in-memory progress store if possible
  try {
    // Attempt to import the progress store
    const { progressStore } = await import('../../analyze-tickets/route');
    
    // Remove the job from the progress store
    if (progressStore && progressStore[userId]) {
      console.log('Removing job from progress store:', userId);
      delete progressStore[userId];
    }
  } catch (error) {
    console.error('Error accessing progress store:', error);
    // Continue anyway as the job is already marked as canceled in the database
  }
  
  return {
    success: true,
    message: 'Analysis job canceled successfully',
    jobId
  };
} 