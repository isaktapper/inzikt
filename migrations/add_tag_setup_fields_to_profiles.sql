-- Add tag setup related fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS tag_setup_completed BOOLEAN DEFAULT FALSE;

-- Create user_tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'custom', -- 'custom', 'domain', 'ai', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add a unique constraint to prevent duplicates per user
  UNIQUE(user_id, tag_name)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON user_tags(user_id);

-- Add RLS policies
ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own tags
CREATE POLICY user_tags_select_policy ON user_tags 
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own tags
CREATE POLICY user_tags_insert_policy ON user_tags 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own tags
CREATE POLICY user_tags_update_policy ON user_tags 
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own tags
CREATE POLICY user_tags_delete_policy ON user_tags 
  FOR DELETE USING (auth.uid() = user_id); 