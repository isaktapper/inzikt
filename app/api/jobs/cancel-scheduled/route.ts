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
    
    console.log('User authenticated for scheduled job cancellation:', user.id);
    
    // First, fetch the job to ensure it exists
    const { data: job, error: fetchError } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching scheduled job:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch scheduled job' }, { status: 500 });
    }
    
    if (!job) {
      return NextResponse.json({ error: 'Scheduled job not found' }, { status: 404 });
    }
    
    // Verify that the job belongs to the current user
    if (job.user_id !== user.id) {
      console.error('Scheduled job belongs to', job.user_id, 'but request is from', user.id);
      return NextResponse.json({ error: 'Unauthorized to cancel this scheduled job' }, { status: 403 });
    }
    
    console.log('Canceling scheduled job:', jobId);
    
    // Update job status - either disable it or mark it as canceled
    const { error: updateError } = await supabase
      .from('scheduled_jobs')
      .update({ 
        enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
      
    if (updateError) {
      console.error('Error updating scheduled job:', updateError);
      return NextResponse.json({ error: 'Failed to cancel scheduled job' }, { status: 500 });
    }
    
    console.log('Scheduled job successfully canceled');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Scheduled job canceled successfully' 
    });
    
  } catch (error) {
    console.error('Error canceling scheduled job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 