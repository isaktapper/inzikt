import { createServerSupabaseClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Import the progress store to remove the in-memory progress
import { progressStore } from '../route';

export async function POST(request: NextRequest) {
  try {
    // Get job ID from request or use user ID to find active analysis jobs
    const body = await request.json();
    const { jobId, userId } = body;
    
    if (!jobId && !userId) {
      return NextResponse.json({ error: 'Either jobId or userId is required' }, { status: 400 });
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
    
    let targetJobId = jobId;
    
    // If no specific job ID provided, find the active analysis job for this user
    if (!targetJobId && userId) {
      // Verify that userId matches the authenticated user
      if (userId !== user.id) {
        return NextResponse.json({ 
          error: 'Unauthorized to cancel jobs for other users' 
        }, { status: 403 });
      }
      
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
        return NextResponse.json({ error: 'Failed to find active jobs' }, { status: 500 });
      }
      
      if (!activeJobs || activeJobs.length === 0) {
        return NextResponse.json({ error: 'No active analysis jobs found' }, { status: 404 });
      }
      
      targetJobId = activeJobs[0].id;
    }
    
    // Fetch the job to ensure it exists and belongs to the user
    const { data: job, error: fetchError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', targetJobId)
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
    
    // Verify that this is an analysis job
    if (job.job_type !== 'analysis') {
      return NextResponse.json({ 
        error: `Cannot cancel non-analysis job of type: ${job.job_type}` 
      }, { status: 400 });
    }
    
    // Only allow cancellation of jobs that are not already completed or failed
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'canceled') {
      return NextResponse.json({ 
        error: `Cannot cancel job with status: ${job.status}` 
      }, { status: 400 });
    }
    
    console.log('Canceling analysis job:', targetJobId);
    
    // Clear from in-memory progress store
    if (progressStore[job.user_id]) {
      console.log('Removing job from progress store:', job.user_id);
      delete progressStore[job.user_id];
    }
    
    // Update job status to 'canceled'
    const { error: updateError } = await supabase
      .from('import_jobs')
      .update({ 
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetJobId);
      
    if (updateError) {
      console.error('Error updating job:', updateError);
      return NextResponse.json({ error: 'Failed to cancel job' }, { status: 500 });
    }
    
    console.log('Analysis job successfully canceled');
    
    // Try to broadcast job cancellation via WebSocket if possible
    try {
      // Dynamic import to avoid circular dependencies
      import('../../ws/route').then(wsModule => {
        if (wsModule.broadcastAnalysisProgress) {
          wsModule.broadcastAnalysisProgress(job.user_id, {
            userId: job.user_id,
            stage: 'canceled',
            percentage: job.progress || 0,
            progress: job.progress || 0,
            ticketsAnalyzed: 0,
            totalTickets: 0,
            isCompleted: false,
            jobId: targetJobId
          });
        }
      }).catch(err => {
        console.error('Failed to import WebSocket module:', err);
      });
    } catch (error) {
      console.error('Error broadcasting job cancellation:', error);
      // Continue anyway
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Analysis job canceled successfully' 
    });
    
  } catch (error) {
    console.error('Error canceling analysis job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 