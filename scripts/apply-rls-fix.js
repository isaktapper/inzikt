import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyRlsFix() {
  try {
    console.log('Starting RLS policy fix application...');
    
    // Read the SQL migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'fix_conflicting_tickets_rls.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL directly using rpc
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      throw new Error(`Error executing SQL: ${error.message}`);
    }
    
    console.log('✅ Successfully applied RLS policy fixes');
    
    // Verify the policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .in('tablename', ['tickets', 'analysis']);
      
    if (policiesError) {
      console.warn(`Warning: Could not verify policies: ${policiesError.message}`);
    } else {
      console.log('Current policies:');
      policies.forEach(policy => {
        console.log(`- ${policy.policyname} on ${policy.tablename}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to apply RLS policy fixes:', error);
    process.exit(1);
  }
}

// Run the function
applyRlsFix(); 