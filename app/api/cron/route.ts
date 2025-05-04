import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordJobStart, recordJobCompletion } from '@/lib/cron/manager';

// Import job handlers
import { runAutomatedImport } from '@/lib/cron/jobs/automated-import';
import { runTicketAnalysis } from '@/lib/cron/jobs/ticket-analysis';
import { runDatabaseMaintenance } from '@/lib/cron/jobs/database-maintenance';
import { runUsageReport } from '@/lib/cron/jobs/usage-report';
import { generateInsights } from '@/lib/cron/jobs/generate-insights';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map of job types to their handler functions
const jobHandlers: Record<string, (parameters: any) => Promise<any>> = {
  'automated-import': runAutomatedImport,
  'ticket-analysis': runTicketAnalysis,
  'database-maintenance': runDatabaseMaintenance,
  'usage-report': runUsageReport,
  'generate-insights': generateInsights,
};

export async function GET(request: Request) {
  try {
    // Extract authorization token
    const authHeader = request.headers.get('authorization');
    const cronToken = process.env.CRON_SECRET_TOKEN;

    // Verify cron secret if configured
    if (cronToken && authHeader !== `Bearer ${cronToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find due jobs
    const now = new Date();
    const { data: dueJobs, error: jobsError } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('enabled', true)
      .lte('next_run', now.toISOString())
      .order('next_run');

    if (jobsError) {
      console.error('Error fetching due jobs:', jobsError);
      return NextResponse.json({ error: 'Error fetching jobs' }, { status: 500 });
    }

    console.log(`Found ${dueJobs?.length || 0} jobs to run`);

    // Process each job
    const results = [];
    for (const job of dueJobs || []) {
      try {
        // Record job start
        const executionId = await recordJobStart(job.id);
        
        // Find the appropriate handler
        const handler = jobHandlers[job.job_type];
        if (!handler) {
          console.error(`No handler found for job type: ${job.job_type}`);
          await recordJobCompletion(executionId, 'failed', null, `No handler for job type: ${job.job_type}`);
          results.push({
            jobId: job.id,
            executionId,
            status: 'failed',
            error: `No handler for job type: ${job.job_type}`
          });
          continue;
        }
        
        // Execute the job
        console.log(`Running job ${job.id} (${job.job_type})`);
        const result = await handler(job.parameters || {});
        
        // Record successful completion
        await recordJobCompletion(executionId, 'completed', result);
        
        results.push({
          jobId: job.id,
          executionId,
          status: 'completed',
          result
        });
      } catch (error) {
        console.error(`Error running job ${job.id}:`, error);
        // If we've already started the job, record its failure
        const startedJob = results.find(r => r.jobId === job.id);
        if (startedJob) {
          await recordJobCompletion(
            startedJob.executionId,
            'failed',
            null,
            error instanceof Error ? error.message : 'Unknown error'
          );
          
          // Update the result
          const resultIndex = results.findIndex(r => r.jobId === job.id);
          if (resultIndex !== -1) {
            results[resultIndex].status = 'failed';
            results[resultIndex].error = error instanceof Error ? error.message : 'Unknown error';
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      jobsRun: results.length,
      results
    });
  } catch (error) {
    console.error('Error in cron route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 