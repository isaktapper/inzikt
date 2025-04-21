-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can insert their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can delete their own tickets" ON tickets;
DROP POLICY IF EXISTS "Allow server-side access" ON tickets;

-- Verify RLS is enabled
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create proper user-specific policies
CREATE POLICY "Users can view their own tickets" 
ON tickets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tickets" 
ON tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" 
ON tickets FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tickets" 
ON tickets FOR DELETE 
USING (auth.uid() = user_id);

-- Create a service role policy for server operations
CREATE POLICY "Service role can manage all tickets" 
ON tickets
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tickets TO authenticated;

-- Also check analysis table RLS
DROP POLICY IF EXISTS "Users can view their analysis" ON analysis;
DROP POLICY IF EXISTS "Users can update their analysis" ON analysis;
DROP POLICY IF EXISTS "Service role can manage all analysis" ON analysis;

-- Enable RLS for analysis table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analysis') THEN
    -- Ensure the analysis table has proper RLS
    ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;
    
    -- Create policies for the analysis table
    CREATE POLICY "Users can view their analysis" 
    ON analysis FOR SELECT 
    USING (
      ticket_id IN (SELECT id FROM tickets WHERE user_id = auth.uid())
    );
    
    CREATE POLICY "Users can update their analysis" 
    ON analysis FOR UPDATE 
    USING (
      ticket_id IN (SELECT id FROM tickets WHERE user_id = auth.uid())
    );
    
    CREATE POLICY "Service role can manage all analysis" 
    ON analysis
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
    
    GRANT SELECT, UPDATE ON analysis TO authenticated;
  END IF;
END $$; 