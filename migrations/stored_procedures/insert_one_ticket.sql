-- Function to insert one ticket
-- This is useful for bypassing RLS for server-side operations
CREATE OR REPLACE FUNCTION insert_one_ticket(
  p_zendesk_id TEXT,
  p_user_id UUID,
  p_summary TEXT,
  p_description TEXT DEFAULT '',
  p_status TEXT DEFAULT '',
  p_tags TEXT[] DEFAULT '{}',
  p_date TEXT DEFAULT '',
  p_requester_name TEXT DEFAULT '',
  p_assignee_name TEXT DEFAULT '',
  p_group_name TEXT DEFAULT ''
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_ticket_id UUID;
BEGIN
  -- Insert the ticket
  INSERT INTO tickets (
    zendesk_id,
    user_id,
    summary,
    description,
    status,
    tags,
    date,
    requester_name,
    assignee_name,
    group_name
  ) VALUES (
    p_zendesk_id,
    p_user_id,
    p_summary,
    p_description,
    p_status,
    p_tags,
    p_date,
    p_requester_name,
    p_assignee_name,
    p_group_name
  )
  RETURNING id INTO v_ticket_id;
  
  -- Build result
  v_result := jsonb_build_object(
    'success', TRUE,
    'ticket_id', v_ticket_id,
    'message', 'Ticket inserted successfully'
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 