/**
 * Cron job manager for handling scheduled tasks
 */

import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

// Initialize Supabase admin client for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Job status types
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

// Job type for scheduled tasks
export interface ScheduledJob {
  id: string;
  job_type: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  cron_expression?: string;
  last_run?: Date;
  next_run: Date;
  enabled: boolean;
  user_id?: string;
  organization_id?: string;
  parameters?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Job execution record
export interface JobExecution {
  id: string;
  job_id: string;
  status: JobStatus;
  started_at: Date;
  completed_at?: Date;
  duration_ms?: number;
  result?: any;
  error?: string;
}

/**
 * Schedule a new job
 */
export async function scheduleJob({
  job_type,
  frequency,
  cron_expression,
  user_id,
  organization_id,
  parameters,
  enabled = true
}: Partial<ScheduledJob> & { job_type: string, frequency: ScheduledJob['frequency'] }): Promise<string> {
  try {
    // Calculate next run time based on frequency
    const nextRun = calculateNextRun(frequency, cron_expression);
    
    // Insert the job into the database
    const { data, error } = await supabase
      .from('scheduled_jobs')
      .insert({
        job_type,
        frequency,
        cron_expression,
        next_run: nextRun.toISOString(),
        enabled,
        user_id,
        organization_id,
        parameters,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
      
    if (error) {
      console.error('Error scheduling job:', error);
      throw error;
    }
    
    console.log(`Scheduled ${job_type} job with ID ${data.id} to run ${frequency} (next: ${format(nextRun, 'PPpp')})`);
    return data.id;
  } catch (error) {
    console.error('Error in scheduleJob:', error);
    throw error;
  }
}

/**
 * Update a scheduled job
 */
export async function updateScheduledJob(
  jobId: string,
  updates: Partial<Omit<ScheduledJob, 'id' | 'created_at'>>
): Promise<void> {
  try {
    // If frequency is updated, recalculate next run time
    if (updates.frequency || updates.cron_expression) {
      const nextRun = calculateNextRun(
        updates.frequency || 'daily',
        updates.cron_expression
      );
      updates.next_run = nextRun;
    }
    
    // Add updated_at timestamp
    updates.updated_at = new Date();
    
    // Convert dates to ISO strings for Supabase
    const dbUpdates = {
      ...updates,
      next_run: updates.next_run ? new Date(updates.next_run).toISOString() : undefined,
      updated_at: updates.updated_at.toISOString()
    };
    
    // Update the job
    const { error } = await supabase
      .from('scheduled_jobs')
      .update(dbUpdates)
      .eq('id', jobId);
      
    if (error) {
      console.error(`Error updating job ${jobId}:`, error);
      throw error;
    }
    
    console.log(`Updated scheduled job ${jobId}`);
  } catch (error) {
    console.error('Error in updateScheduledJob:', error);
    throw error;
  }
}

/**
 * Delete a scheduled job
 */
export async function deleteScheduledJob(jobId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('scheduled_jobs')
      .delete()
      .eq('id', jobId);
      
    if (error) {
      console.error(`Error deleting job ${jobId}:`, error);
      throw error;
    }
    
    console.log(`Deleted scheduled job ${jobId}`);
  } catch (error) {
    console.error('Error in deleteScheduledJob:', error);
    throw error;
  }
}

/**
 * Calculate the next run time based on frequency
 */
function calculateNextRun(frequency: ScheduledJob['frequency'], cronExpression?: string): Date {
  const now = new Date();
  
  // If custom cron expression is provided, use a cron parser library (simplistic implementation for now)
  if (frequency === 'custom' && cronExpression) {
    // This is a placeholder - in production, use a proper cron parser
    // For now, just return tomorrow as a simple fallback
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }
  
  // Simple next run time calculation based on frequency
  switch (frequency) {
    case 'hourly':
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1);
      nextHour.setMinutes(0, 0, 0);
      return nextHour;
      
    case 'daily':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(3, 0, 0, 0); // 3 AM
      return tomorrow;
      
    case 'weekly':
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(3, 0, 0, 0); // 3 AM
      return nextWeek;
      
    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1); // 1st of next month
      nextMonth.setHours(3, 0, 0, 0); // 3 AM
      return nextMonth;
      
    default:
      // Default to daily at 3 AM
      const defaultNext = new Date(now);
      defaultNext.setDate(defaultNext.getDate() + 1);
      defaultNext.setHours(3, 0, 0, 0);
      return defaultNext;
  }
}

/**
 * Record job execution start
 */
export async function recordJobStart(jobId: string): Promise<string> {
  try {
    // Create execution record
    const { data, error } = await supabase
      .from('job_executions')
      .insert({
        job_id: jobId,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();
      
    if (error) {
      console.error(`Error recording start for job ${jobId}:`, error);
      throw error;
    }
    
    // Update the job's last_run time
    await supabase
      .from('scheduled_jobs')
      .update({
        last_run: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    console.log(`Started execution ${data.id} for job ${jobId}`);
    return data.id;
  } catch (error) {
    console.error('Error in recordJobStart:', error);
    throw error;
  }
}

/**
 * Record job execution completion
 */
export async function recordJobCompletion(
  executionId: string,
  status: 'completed' | 'failed',
  result?: any,
  error?: string
): Promise<void> {
  try {
    const now = new Date();
    
    // Get the execution record to calculate duration
    const { data: executionData, error: fetchError } = await supabase
      .from('job_executions')
      .select('job_id, started_at')
      .eq('id', executionId)
      .single();
      
    if (fetchError) {
      console.error(`Error fetching execution ${executionId}:`, fetchError);
      throw fetchError;
    }
    
    // Calculate duration in milliseconds
    const startedAt = new Date(executionData.started_at);
    const durationMs = now.getTime() - startedAt.getTime();
    
    // Update execution record
    const { error: updateError } = await supabase
      .from('job_executions')
      .update({
        status,
        completed_at: now.toISOString(),
        duration_ms: durationMs,
        result: result || null,
        error: error || null
      })
      .eq('id', executionId);
      
    if (updateError) {
      console.error(`Error updating execution ${executionId}:`, updateError);
      throw updateError;
    }
    
    // Recalculate next run time and update the job
    const { data: jobData, error: jobFetchError } = await supabase
      .from('scheduled_jobs')
      .select('frequency, cron_expression')
      .eq('id', executionData.job_id)
      .single();
      
    if (jobFetchError) {
      console.error(`Error fetching job data for execution ${executionId}:`, jobFetchError);
      throw jobFetchError;
    }
    
    const nextRun = calculateNextRun(
      jobData.frequency,
      jobData.cron_expression
    );
    
    await supabase
      .from('scheduled_jobs')
      .update({
        next_run: nextRun.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', executionData.job_id);
    
    console.log(`Completed execution ${executionId} with status ${status} (duration: ${durationMs}ms)`);
  } catch (error) {
    console.error('Error in recordJobCompletion:', error);
    throw error;
  }
} 