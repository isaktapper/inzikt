-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can insert their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can delete their own tickets" ON tickets;

-- Verify RLS is enabled
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create a more permissive policy for server access
CREATE POLICY "Allow server-side access" ON tickets
FOR ALL
USING (true)
WITH CHECK (true);

-- Give anon role access to tickets table
GRANT SELECT, INSERT, UPDATE, DELETE ON tickets TO anon;
GRANT USAGE ON SEQUENCE tickets_id_seq TO anon; 