import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🟡 Running migration 009: Creating usage tracking table...');

  try {
    // Create the user_usage table
    const { error: createUsageError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'user_usage',
      table_definition: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        metric text NOT NULL,
        value numeric NOT NULL DEFAULT 1,
        details jsonb DEFAULT NULL,
        recorded_at timestamp with time zone NOT NULL DEFAULT now()
      `
    });

    if (createUsageError) {
      throw createUsageError;
    }

    // Create indexes for efficient querying
    await supabase.query(`
      CREATE INDEX IF NOT EXISTS idx_user_usage_user_metric ON user_usage(user_id, metric);
      CREATE INDEX IF NOT EXISTS idx_user_usage_recorded_at ON user_usage(recorded_at);
    `);

    console.log('✅ Migration 009 completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 