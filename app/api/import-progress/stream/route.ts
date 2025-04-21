import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const supabase = await createServerSupabaseClient();
    
    // Get user from auth session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // We need to create a stream response for SSE
    const encoder = new TextEncoder();
    
    // Create a TransformStream to handle the SSE formatting
    const stream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      },
    });
    
    const writer = stream.writable.getWriter();
    
    // Initial fetch of the job
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();
      
    if (jobError) {
      writer.write({ error: 'Job not found' });
      writer.close();
      
      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    // Send initial job data
    const progressData = {
      jobId: job.id,
      provider: job.provider || 'unknown',
      stage: job.stage || 'processing',
      totalTickets: job.total_tickets || 0,
      processedCount: job.processed_count || 0,
      percentage: job.percentage || 0,
      progress: job.progress || 0,
      isCompleted: job.is_completed || job.stage === 'completed',
      ...(job.current_ticket ? {
        currentTicket: {
          id: job.current_ticket.id || 'unknown',
          position: job.current_ticket.position || 0
        }
      } : {})
    };
    
    writer.write({ event: 'progress', data: progressData });
    
    // Set up Supabase realtime subscription
    const channel = supabase
      .channel(`import_job:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'import_jobs',
          filter: `id=eq.${jobId}`,
        },
        async (payload) => {
          // Transform the update into the format expected by the progress indicator
          const updatedData = {
            jobId: payload.new.id,
            provider: payload.new.provider || 'unknown',
            stage: payload.new.stage || 'processing',
            totalTickets: payload.new.total_tickets || 0,
            processedCount: payload.new.processed_count || 0,
            percentage: payload.new.percentage || 0,
            progress: payload.new.progress || 0,
            isCompleted: payload.new.is_completed || payload.new.stage === 'completed',
            ...(payload.new.current_ticket ? {
              currentTicket: {
                id: payload.new.current_ticket.id || 'unknown',
                position: payload.new.current_ticket.position || 0
              }
            } : {})
          };
          
          // Write the update to the stream
          writer.write({ event: 'progress', data: updatedData });
          
          // If job is complete, close the stream
          if (updatedData.isCompleted) {
            channel.unsubscribe();
            writer.close();
          }
        }
      )
      .subscribe();
    
    // Return the stream as a Server-Sent Events response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error: any) {
    console.error('Error in import-progress/stream route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 