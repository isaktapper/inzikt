-- Create import_jobs table to track job status
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  provider TEXT,
  error TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create scheduled_jobs table to track recurring jobs
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  parameters JSONB DEFAULT '{}',
  next_run TIMESTAMPTZ,
  last_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- Policies for import_jobs
CREATE POLICY "Users can view their own import jobs"
ON import_jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import jobs"
ON import_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import jobs"
ON import_jobs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all import jobs"
ON import_jobs
USING (auth.jwt()->>'role' = 'service_role');

-- Policies for scheduled_jobs
CREATE POLICY "Users can view their own scheduled jobs"
ON scheduled_jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled jobs"
ON scheduled_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled jobs"
ON scheduled_jobs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled jobs"
ON scheduled_jobs FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all scheduled jobs"
ON scheduled_jobs
USING (auth.jwt()->>'role' = 'service_role');

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON import_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduled_jobs TO authenticated;

-- Add indexes for performance
CREATE INDEX idx_import_jobs_user_id ON import_jobs(user_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_job_type ON import_jobs(job_type);
CREATE INDEX idx_scheduled_jobs_user_id ON scheduled_jobs(user_id);
CREATE INDEX idx_scheduled_jobs_job_type ON scheduled_jobs(job_type);
CREATE INDEX idx_scheduled_jobs_next_run ON scheduled_jobs(next_run);

-- Add table comments
COMMENT ON TABLE import_jobs IS 'Tracks status of one-time jobs like imports and exports';
COMMENT ON TABLE scheduled_jobs IS 'Configures recurring jobs like insights generation'; 