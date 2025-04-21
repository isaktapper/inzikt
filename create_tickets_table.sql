CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zendesk_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT,
  priority TEXT,
  requester TEXT,
  requester_email TEXT,
  assignee TEXT,
  group_name TEXT,
  tags TEXT[],
  conversation JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  zendesk_created_at TEXT,
  zendesk_updated_at TEXT,
  UNIQUE(zendesk_id, user_id)
);

-- Add RLS policies
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view only their own tickets
CREATE POLICY "Users can view their own tickets" 
  ON tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own tickets
CREATE POLICY "Users can insert their own tickets" 
  ON tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own tickets
CREATE POLICY "Users can update their own tickets" 
  ON tickets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own tickets
CREATE POLICY "Users can delete their own tickets" 
  ON tickets
  FOR DELETE
  USING (auth.uid() = user_id); 