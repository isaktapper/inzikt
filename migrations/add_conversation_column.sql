-- Add conversation column to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS conversation JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN tickets.conversation IS 'Array of ticket comments from Zendesk, including body, author_id, and created_at'; 