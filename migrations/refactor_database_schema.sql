-- Drop old tables if they exist
DROP TABLE IF EXISTS ticket_analysis;
DROP TABLE IF EXISTS ticket_comments;
DROP TABLE IF EXISTS ticket_insights;
DROP TABLE IF EXISTS ticket_tags;
DROP TABLE IF EXISTS tickets;

-- Create the new tickets table to store raw Zendesk ticket data
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zendesk_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    priority TEXT,
    requester TEXT,
    requester_email TEXT,
    assignee TEXT,
    group_name TEXT,
    comments JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    zendesk_created_at TIMESTAMPTZ,
    zendesk_updated_at TIMESTAMPTZ,
    UNIQUE(user_id, zendesk_id)
);

-- Create the analysis table for GPT-generated data
CREATE TABLE analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    summary TEXT,
    detailed_description TEXT,
    sentiment FLOAT,
    urgency_score INTEGER,
    suggested_tags TEXT[],
    category TEXT,
    resolution_suggestion TEXT,
    ai_model TEXT,
    confidence_score FLOAT,
    processing_time FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ticket_id)
);

-- Create the insights table for trend analysis
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    insight_type TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    trend_percentage FLOAT,
    ticket_count INTEGER,
    related_ticket_ids UUID[] DEFAULT '{}',
    time_period TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

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

-- Create policies for analysis table
CREATE POLICY "Users can view their own analysis" 
ON analysis FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis" 
ON analysis FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis" 
ON analysis FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis" 
ON analysis FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for insights table
CREATE POLICY "Users can view their own insights" 
ON insights FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights" 
ON insights FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights" 
ON insights FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights" 
ON insights FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_zendesk_created_at ON tickets(zendesk_created_at);
CREATE INDEX idx_analysis_ticket_id ON analysis(ticket_id);
CREATE INDEX idx_analysis_user_id ON analysis(user_id);
CREATE INDEX idx_insights_user_id ON insights(user_id);
CREATE INDEX idx_insights_insight_type ON insights(insight_type);

-- Add helpful comments
COMMENT ON TABLE tickets IS 'Stores raw Zendesk ticket data';
COMMENT ON TABLE analysis IS 'Stores GPT-generated analysis for individual tickets';
COMMENT ON TABLE insights IS 'Stores trend analysis across multiple tickets'; 