import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🟡 Running migration 008: Creating scheduled jobs tables...');

  try {
    // Create the scheduled_jobs table
    const { error: createScheduledJobsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'scheduled_jobs',
      table_definition: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_type text NOT NULL,
        frequency text NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly', 'custom')),
        cron_expression text,
        last_run timestamp with time zone,
        next_run timestamp with time zone NOT NULL,
        enabled boolean NOT NULL DEFAULT true,
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        organization_id uuid,
        parameters jsonb DEFAULT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      `
    });

    if (createScheduledJobsError) {
      throw createScheduledJobsError;
    }

    // Create the job_executions table
    const { error: createJobExecutionsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'job_executions',
      table_definition: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_id uuid NOT NULL REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
        status text NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
        started_at timestamp with time zone NOT NULL,
        completed_at timestamp with time zone,
        duration_ms integer,
        result jsonb DEFAULT NULL,
        error text,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      `
    });

    if (createJobExecutionsError) {
      throw createJobExecutionsError;
    }

    // Create indexes for efficiency
    await supabase.query(`
      CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_next_run ON scheduled_jobs(next_run) WHERE enabled = true;
      CREATE INDEX IF NOT EXISTS idx_job_executions_job_id ON job_executions(job_id);
    `);

    console.log('✅ Migration 008 completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 