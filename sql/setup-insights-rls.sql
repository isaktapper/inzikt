-- SQL to enable RLS and create appropriate policies for the insights table

-- First, enable Row Level Security (RLS) on the insights table
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own insights
CREATE POLICY insights_select_policy
ON insights
FOR SELECT
USING (user_id = auth.uid());

-- Create policy to allow users to insert their own insights
CREATE POLICY insights_insert_policy
ON insights
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create policy to allow users to update their own insights
CREATE POLICY insights_update_policy
ON insights
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create policy to allow users to delete their own insights
CREATE POLICY insights_delete_policy
ON insights
FOR DELETE
USING (user_id = auth.uid());

-- Grant permissions to the authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON insights TO authenticated;

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS insights_user_id_idx ON insights (user_id);
CREATE INDEX IF NOT EXISTS insights_created_at_idx ON insights (created_at DESC);
CREATE INDEX IF NOT EXISTS insights_time_period_idx ON insights (time_period);

-- Suggestions for improving the insights table if needed:
/*
-- In case you need to alter the table to add or modify columns:

-- Add a column for storing confidence score
ALTER TABLE insights ADD COLUMN confidence_score DOUBLE PRECISION;

-- Add a column for insights category (broader than insight_type)
ALTER TABLE insights ADD COLUMN category VARCHAR(50);

-- Add a column for priority (high, medium, low)
ALTER TABLE insights ADD COLUMN priority VARCHAR(20);
*/

-- Create a helper function to get insights for a specific period
CREATE OR REPLACE FUNCTION get_insights_for_period(
  user_id_param UUID,
  period_param TEXT DEFAULT 'week',
  limit_param INTEGER DEFAULT 10
)
RETURNS SETOF insights
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM insights
  WHERE user_id = user_id_param
    AND time_period = period_param
  ORDER BY created_at DESC
  LIMIT limit_param;
$$; 