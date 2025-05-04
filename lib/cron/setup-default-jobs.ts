import { scheduleJob } from './manager';

/**
 * Set up default system maintenance jobs
 */
export async function setupSystemJobs() {
  try {
    // Daily database maintenance (runs at 2 AM)
    await scheduleJob({
      job_type: 'database-maintenance',
      frequency: 'daily',
      parameters: {
        tables: ['job_executions', 'import_jobs'],
        cleanup_days: 30
      },
      enabled: true
    });
    
    // Weekly insights generation (runs once a week)
    await scheduleJob({
      job_type: 'generate-insights',
      frequency: 'weekly',
      parameters: {
        period: 'week',
        compare_with: 'previous_period'
      },
      enabled: true
    });
    
    console.log('System maintenance jobs set up successfully');
  } catch (error) {
    console.error('Error setting up system jobs:', error);
  }
}

/**
 * Set up automated jobs for a user
 */
export async function setupUserJobs(userId: string, providers: string[] = []) {
  try {
    // Set up automated ticket analysis (nightly at 1 AM)
    await scheduleJob({
      job_type: 'ticket-analysis',
      frequency: 'daily',
      user_id: userId,
      parameters: { user_id: userId },
      enabled: true
    });
    
    // Set up automated imports for each provider
    for (const provider of providers) {
      await scheduleJob({
        job_type: 'automated-import',
        frequency: 'daily',
        user_id: userId,
        parameters: {
          user_id: userId,
          provider,
          ticket_count: 100 // Import last 100 tickets in daily jobs
        },
        enabled: true
      });
    }
    
    console.log(`User jobs set up successfully for user ${userId}`);
  } catch (error) {
    console.error('Error setting up user jobs:', error);
  }
} 