import { createServerSupabaseClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get job ID from request
    const { jobId } = await request.json();
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }
    
    // Initialize server Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('User authenticated:', user.id);
    
    // First, fetch the job to ensure it exists
    const { data: job, error: fetchError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching job:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
    }
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Verify that the job belongs to the current user
    if (job.user_id !== user.id) {
      console.error('Job belongs to', job.user_id, 'but request is from', user.id);
      return NextResponse.json({ error: 'Unauthorized to cancel this job' }, { status: 403 });
    }
    
    // Only allow cancellation of jobs that are not already completed or failed
    if (job.status === 'completed' || job.status === 'failed') {
      return NextResponse.json({ 
        error: `Cannot cancel job with status: ${job.status}` 
      }, { status: 400 });
    }
    
    console.log('Canceling job:', jobId);
    
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
      return NextResponse.json({ error: 'Failed to cancel job' }, { status: 500 });
    }
    
    console.log('Job successfully canceled');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Job canceled successfully' 
    });
    
  } catch (error) {
    console.error('Error canceling job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 