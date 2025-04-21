import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🟡 Running migration 005: Creating import configuration tables...');

  try {
    // Create the integration_import_configs table
    const { error: createConfigError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'integration_import_configs',
      table_definition: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider text NOT NULL CHECK (provider IN ('zendesk', 'intercom', 'freshdesk')),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        selected_groups text[] DEFAULT '{}',
        selected_statuses text[] DEFAULT '{}',
        days_back integer DEFAULT 30,
        import_frequency text DEFAULT 'manual' CHECK (import_frequency IN ('manual', 'daily', 'weekly', 'hourly')),
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        UNIQUE(user_id, provider)
      `
    });

    if (createConfigError) {
      throw createConfigError;
    }

    // Create the integration_import_logs table
    const { error: createLogError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'integration_import_logs',
      table_definition: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        provider text NOT NULL CHECK (provider IN ('zendesk', 'intercom', 'freshdesk')),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        details jsonb DEFAULT '{}'::jsonb,
        ticket_count integer DEFAULT 0,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      `
    });

    if (createLogError) {
      throw createLogError;
    }

    // Create RLS policies for the integration_import_configs table
    const { error: configPolicyError } = await supabase.rpc('create_rls_policy', {
      table_name: 'integration_import_configs',
      policy_name: 'Users can only access their own import configs',
      policy_definition: `
        CREATE POLICY "Users can only access their own import configs"
        ON integration_import_configs
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
      `
    });

    if (configPolicyError) {
      throw configPolicyError;
    }

    // Create RLS policies for the integration_import_logs table
    const { error: logPolicyError } = await supabase.rpc('create_rls_policy', {
      table_name: 'integration_import_logs',
      policy_name: 'Users can only access their own import logs',
      policy_definition: `
        CREATE POLICY "Users can only access their own import logs"
        ON integration_import_logs
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
      `
    });

    if (logPolicyError) {
      throw logPolicyError;
    }

    console.log('✅ Migration 005 completed successfully!');
  } catch (error) {
    console.error('🔴 Migration 005 failed:', error);
    process.exit(1);
  }
}

runMigration(); 