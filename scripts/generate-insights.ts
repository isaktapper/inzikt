import { generateInsights } from '../lib/cron/jobs/generate-insights';

async function main() {
  try {
    // Replace with your user ID
    const userId = process.env.USER_ID;
    if (!userId) {
      console.error('Please set USER_ID environment variable');
      process.exit(1);
    }

    console.log('Starting insights generation...');
    
    const result = await generateInsights({
      user_id: userId,
      period: 'week',
      compare_with: 'previous_period'
    });

    console.log('Insights generation completed:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error generating insights:', error);
    process.exit(1);
  }
}

main(); 