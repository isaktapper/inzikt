-- Create a tickets table to store imported Zendesk tickets
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zendesk_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    description TEXT,
    status TEXT,
    tags TEXT[],
    date TEXT,
    requester_name TEXT,
    assignee_name TEXT,
    group_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, zendesk_id)
);

-- Create an insights table for future AI analysis
CREATE TABLE IF NOT EXISTS ticket_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[],
    sentiment FLOAT,
    confidence FLOAT,
    ai_model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets table
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

-- Create policies for ticket_insights table
CREATE POLICY "Users can view their own insights" 
ON ticket_insights FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights" 
ON ticket_insights FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights" 
ON ticket_insights FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights" 
ON ticket_insights FOR DELETE 
USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE tickets IS 'Stores imported Zendesk ticket data';
COMMENT ON TABLE ticket_insights IS 'Stores AI-generated insights from ticket analysis for future use'; 