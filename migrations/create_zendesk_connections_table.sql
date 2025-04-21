-- Drop the existing table if it exists
DROP TABLE IF EXISTS zendesk_connections;

-- Create the zendesk_connections table with proper structure
CREATE TABLE zendesk_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subdomain TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    api_token TEXT NOT NULL,
    selected_groups TEXT[] DEFAULT '{}',
    selected_statuses TEXT[] DEFAULT '{}',
    max_tickets INTEGER DEFAULT 25,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE zendesk_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to manage their own connections
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

-- Add helpful comments
COMMENT ON TABLE zendesk_connections IS 'Stores Zendesk connection details for users';
COMMENT ON COLUMN zendesk_connections.user_id IS 'References the auth.users table';
COMMENT ON COLUMN zendesk_connections.subdomain IS 'Zendesk subdomain (e.g., company.zendesk.com)';
COMMENT ON COLUMN zendesk_connections.admin_email IS 'Admin email for Zendesk API access';
COMMENT ON COLUMN zendesk_connections.api_token IS 'API token for Zendesk authentication';
COMMENT ON COLUMN zendesk_connections.selected_groups IS 'Array of Zendesk group IDs selected for import';
COMMENT ON COLUMN zendesk_connections.selected_statuses IS 'Array of ticket status values selected for import';
COMMENT ON COLUMN zendesk_connections.max_tickets IS 'Maximum number of recent tickets to import'; 