import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

// Map job status to our progress stages
function mapJobStatusToStage(status: string, progress: number): 'scanning' | 'processing' | 'importing' | 'completed' | 'failed' {
  if (status === 'failed') return 'failed';
  if (status === 'completed') return 'completed';
  
  // For running jobs, determine stage based on progress
  if (progress < 25) return 'scanning';
  if (progress < 75) return 'processing';
  return 'importing';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      );
    }

    // Initialize Supabase client using the utility function
    const supabase = await createServerSupabaseClient();
    
    // Get user from auth session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get import job from Supabase
    const { data: job, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (error || !job) {
      console.error('Error fetching import job:', error);
      return NextResponse.json(
        { error: 'Import job not found', details: error?.message },
        { status: 404 }
      );
    }

    // Transform the job data into the format expected by the progress indicator
    const progressData = {
      jobId: job.id,
      provider: job.provider || 'unknown',
      stage: job.stage || 'processing',
      totalTickets: job.total_tickets || 0,
      processedCount: job.processed_count || 0,
      percentage: job.percentage || 0,
      progress: job.progress || 0, // 0-100 value
      isCompleted: job.is_completed || job.stage === 'completed',
      
      // If there's current ticket information
      ...(job.current_ticket ? {
        currentTicket: {
          id: job.current_ticket.id || 'unknown',
          position: job.current_ticket.position || 0
        }
      } : {})
    };

    return NextResponse.json(progressData);
    
  } catch (error: any) {
    console.error('Error in import-progress API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 