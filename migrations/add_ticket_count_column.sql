-- Migration to add the ticket_count column to integration_import_configs table
-- This can be run in your Supabase SQL editor or via a direct database connection tool

-- First, check if the column already exists to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'integration_import_configs'
        AND column_name = 'ticket_count'
    ) THEN
        -- Add the new column
        ALTER TABLE integration_import_configs ADD COLUMN ticket_count integer;

        -- Copy values from days_back to ticket_count to maintain existing settings
        UPDATE integration_import_configs SET ticket_count = days_back
        WHERE days_back IS NOT NULL;

        -- Set default value for any records with NULL ticket_count
        UPDATE integration_import_configs SET ticket_count = 30
        WHERE ticket_count IS NULL;
    END IF;
END $$; 