-- Drop existing policies and table if they exist (for clean re-runs)
DROP POLICY IF EXISTS "Enable read access for own integration connections" ON integration_connections;
DROP POLICY IF EXISTS "Enable insert for own integration connections" ON integration_connections;
DROP POLICY IF EXISTS "Enable update for own integration connections" ON integration_connections;
DROP POLICY IF EXISTS "Enable delete for own integration connections" ON integration_connections;
DROP TABLE IF EXISTS public.integration_connections;

-- Create the integration_connections table
CREATE TABLE IF NOT EXISTS public.integration_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  provider TEXT NOT NULL,
  credentials JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, provider)
);

-- Enable Row Level Security
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to read their own integration connections
CREATE POLICY "Enable read access for own integration connections"
ON integration_connections FOR SELECT
USING (auth.uid() = user_id);

-- Create a policy to allow authenticated users to insert their own integration connections
CREATE POLICY "Enable insert for own integration connections"
ON integration_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create a policy to allow authenticated users to update their own integration connections
CREATE POLICY "Enable update for own integration connections"
ON integration_connections FOR UPDATE
USING (auth.uid() = user_id);

-- Create a policy to allow authenticated users to delete their own integration connections
CREATE POLICY "Enable delete for own integration connections"
ON integration_connections FOR DELETE
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON integration_connections TO authenticated;
GRANT ALL ON integration_connections TO service_role;

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_integration_connections_updated_at
BEFORE UPDATE ON integration_connections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 