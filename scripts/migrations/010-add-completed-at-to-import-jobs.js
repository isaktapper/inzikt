/**
 * Migration script to add the completed_at column to the import_jobs table
 * 
 * To execute this script, run the following SQL queries in your database:
 * 
 * 1. First check if the column already exists:
 * SELECT column_name FROM information_schema.columns 
 * WHERE table_name = 'import_jobs' AND column_name = 'completed_at';
 * 
 * 2. If no results, add the column:
 * ALTER TABLE import_jobs ADD COLUMN completed_at TIMESTAMPTZ;
 * 
 * You can run these queries using:
 * - The Supabase dashboard SQL editor
 * - Any PostgreSQL client connected to your database
 * - Or a direct API call using the SUPABASE_SERVICE_ROLE_KEY
 */

console.log('To add the completed_at column to the import_jobs table, run these SQL commands:');
console.log(`
-- First check if the column already exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'import_jobs' AND column_name = 'completed_at';

-- If no results, add the column
ALTER TABLE import_jobs ADD COLUMN completed_at TIMESTAMPTZ;
`);
console.log('Run these commands in your Supabase SQL editor or PostgreSQL client.'); 