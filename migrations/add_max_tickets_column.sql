-- Add max_tickets column to zendesk_connections table
ALTER TABLE zendesk_connections ADD COLUMN IF NOT EXISTS max_tickets INTEGER DEFAULT 25;

-- Add updated_at column if it doesn't exist
ALTER TABLE zendesk_connections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Set default value for updated_at column on existing rows
UPDATE zendesk_connections SET updated_at = NOW() WHERE updated_at IS NULL;

-- Add constraint to ensure updated_at is set for future rows
ALTER TABLE zendesk_connections ALTER COLUMN updated_at SET DEFAULT NOW();

-- Ensure selected_groups and selected_statuses are properly defined as arrays
-- First check if columns exist before altering them
DO $$
BEGIN
    -- Check if selected_groups column exists and is not an array
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zendesk_connections' 
        AND column_name = 'selected_groups'
        AND data_type <> 'ARRAY'
    ) THEN
        -- Change column type to array
        ALTER TABLE zendesk_connections ALTER COLUMN selected_groups TYPE text[] USING array[selected_groups];
    END IF;
    
    -- Add selected_groups if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zendesk_connections' 
        AND column_name = 'selected_groups'
    ) THEN
        ALTER TABLE zendesk_connections ADD COLUMN selected_groups text[] DEFAULT '{}';
    END IF;
    
    -- Check if selected_statuses column exists and is not an array
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zendesk_connections' 
        AND column_name = 'selected_statuses'
        AND data_type <> 'ARRAY'
    ) THEN
        -- Change column type to array
        ALTER TABLE zendesk_connections ALTER COLUMN selected_statuses TYPE text[] USING array[selected_statuses];
    END IF;
    
    -- Add selected_statuses if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zendesk_connections' 
        AND column_name = 'selected_statuses'
    ) THEN
        ALTER TABLE zendesk_connections ADD COLUMN selected_statuses text[] DEFAULT '{}';
    END IF;
END
$$;

-- Comment explaining the purpose of these columns
COMMENT ON COLUMN zendesk_connections.max_tickets IS 'Maximum number of recent tickets to import from Zendesk';
COMMENT ON COLUMN zendesk_connections.updated_at IS 'When the connection was last updated';
COMMENT ON COLUMN zendesk_connections.selected_groups IS 'Array of Zendesk group IDs selected for import';
COMMENT ON COLUMN zendesk_connections.selected_statuses IS 'Array of ticket status values selected for import';

-- Enable Row Level Security on the table
ALTER TABLE zendesk_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to manage their own connections
DROP POLICY IF EXISTS "Users can view their own connections" ON zendesk_connections;
CREATE POLICY "Users can view their own connections" 
ON zendesk_connections
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own connections" ON zendesk_connections;
CREATE POLICY "Users can insert their own connections" 
ON zendesk_connections
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own connections" ON zendesk_connections;
CREATE POLICY "Users can update their own connections" 
ON zendesk_connections
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own connections" ON zendesk_connections;
CREATE POLICY "Users can delete their own connections" 
ON zendesk_connections
FOR DELETE 
USING (auth.uid() = user_id);

-- Make sure the table exists - if not, create it with proper structure
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'zendesk_connections'
    ) THEN
        CREATE TABLE zendesk_connections (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            subdomain TEXT NOT NULL,
            email TEXT NOT NULL,
            api_token TEXT NOT NULL,
            selected_groups TEXT[] DEFAULT '{}',
            selected_statuses TEXT[] DEFAULT '{}',
            max_tickets INTEGER DEFAULT 25,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE zendesk_connections ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for the new table
        CREATE POLICY "Users can view their own connections" 
        ON zendesk_connections
        FOR SELECT 
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own connections" 
        ON zendesk_connections
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own connections" 
        ON zendesk_connections
        FOR UPDATE 
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own connections" 
        ON zendesk_connections
        FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END
$$; 