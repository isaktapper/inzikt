-- Add service role policy to import_jobs table
CREATE POLICY "Service role can manage all import jobs"
ON import_jobs
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Grant necessary permissions
GRANT ALL ON import_jobs TO service_role; 