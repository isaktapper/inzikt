-- Create a view that joins tickets with their analysis data
CREATE OR REPLACE VIEW tickets_with_analysis AS
SELECT 
  t.*,
  a.summary as ai_summary,
  a.detailed_description as ai_description,
  a.suggested_tags as ai_tags,
  a.sentiment,
  a.urgency_score,
  a.category,
  a.resolution_suggestion,
  a.confidence_score,
  a.processing_time,
  a.created_at as analysis_created_at,
  a.updated_at as analysis_updated_at
FROM tickets t
LEFT JOIN analysis a ON t.id = a.ticket_id;

-- Grant access to authenticated users
GRANT SELECT ON tickets_with_analysis TO authenticated; 