import { setupUserJobs } from '@/lib/cron/setup-default-jobs';

/**
 * Set up default automation for a new user
 */
export async function setupUserAutomation(userId: string, providers: string[] = []) {
  try {
    console.log(`Setting up default automation for user ${userId}`);
    
    // Set up automated jobs
    await setupUserJobs(userId, providers);
    
    return {
      success: true,
      message: 'Default automation set up successfully'
    };
  } catch (error) {
    console.error('Error setting up user automation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 