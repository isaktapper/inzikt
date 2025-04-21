-- Create the tag_suggestions table for handling user review of AI-suggested tags
CREATE TABLE IF NOT EXISTS tag_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  suggested_tag TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add a unique constraint to prevent duplicates per user/ticket/tag combination
  UNIQUE(user_id, ticket_id, suggested_tag)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tag_suggestions_user_id ON tag_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_tag_suggestions_ticket_id ON tag_suggestions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tag_suggestions_status ON tag_suggestions(status);

-- Enable Row Level Security
ALTER TABLE tag_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own tag suggestions
CREATE POLICY "Users can view their own tag suggestions" 
  ON tag_suggestions 
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own tag suggestions
CREATE POLICY "Users can update their own tag suggestions" 
  ON tag_suggestions 
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to manage all tag suggestions
CREATE POLICY "Service role can manage all tag suggestions"
  ON tag_suggestions
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add helpful comment
COMMENT ON TABLE tag_suggestions IS 'Stores AI-suggested tags that require user review'; 