import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordJobStart, recordJobCompletion } from '@/lib/cron/manager';

// Import job handlers
import { runAutomatedImport } from '@/lib/cron/jobs/automated-import';
import { runDatabaseMaintenance } from '@/lib/cron/jobs/database-maintenance';
import { generateInsights } from '@/lib/cron/jobs/generate-insights';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map of job types to their handler functions
const jobHandlers: Record<string, (parameters: any) => Promise<any>> = {
  'automated-import': runAutomatedImport,
  'database-maintenance': runDatabaseMaintenance,
  'generate-insights': generateInsights,
};

export async function POST(request: Request) {
  try {
    // Get job ID from URL
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }
    
    // Fetch the job
    const { data: job, error: jobError } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
      
    if (jobError) {
      console.error('Error fetching job:', jobError);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Record job start
    const executionId = await recordJobStart(job.id);
    
    try {
      // Find the appropriate handler
      const handler = jobHandlers[job.job_type];
      if (!handler) {
        await recordJobCompletion(executionId, 'failed', null, `No handler found for job type: ${job.job_type}`);
        return NextResponse.json({ 
          error: `No handler found for job type: ${job.job_type}` 
        }, { status: 400 });
      }
      
      // Execute the job
      console.log(`Manually running job ${job.id} (${job.job_type})`);
      const result = await handler(job.parameters || {});
      
      // Record successful completion
      await recordJobCompletion(executionId, 'completed', result);
      
      return NextResponse.json({
        success: true,
        executionId,
        result
      });
    } catch (error) {
      console.error(`Error running job ${job.id}:`, error);
      
      // Record job failure
      await recordJobCompletion(
        executionId,
        'failed',
        null,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      return NextResponse.json({
        error: 'Job execution failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in run-job route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 