-- Create import_settings table
CREATE TABLE IF NOT EXISTS import_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    auto_import BOOLEAN DEFAULT false,
    import_frequency TEXT DEFAULT 'manual' CHECK (import_frequency IN ('manual', 'daily', 'hourly')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create ai_settings table
CREATE TABLE IF NOT EXISTS ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    auto_analysis BOOLEAN DEFAULT false,
    last_analysis TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE import_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to manage their own settings
CREATE POLICY "Users can view their own import settings" 
ON import_settings
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own import settings" 
ON import_settings
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import settings" 
ON import_settings
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI settings" 
ON ai_settings
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI settings" 
ON ai_settings
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI settings" 
ON ai_settings
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE import_settings IS 'Stores user preferences for ticket import settings';
COMMENT ON TABLE ai_settings IS 'Stores user preferences for AI analysis settings'; 