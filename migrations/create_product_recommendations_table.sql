-- Create the product_recommendations table for AI-generated product recommendations
CREATE TABLE IF NOT EXISTS product_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL, -- feature, improvement, fix, integration, etc.
    confidence_score FLOAT,
    related_tickets UUID[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    price TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on product_recommendations table
ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for product_recommendations table
CREATE POLICY "Users can view their own product recommendations" 
ON product_recommendations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own product recommendations" 
ON product_recommendations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product recommendations" 
ON product_recommendations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product recommendations" 
ON product_recommendations FOR DELETE 
USING (auth.uid() = user_id);

-- Create policy for service role to manage all product recommendations
CREATE POLICY "Service role can manage all product recommendations" 
ON product_recommendations
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON product_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_recommendations TO service_role;

-- Create indexes for better performance
CREATE INDEX idx_product_recommendations_user_id ON product_recommendations(user_id);
CREATE INDEX idx_product_recommendations_type ON product_recommendations(type);
CREATE INDEX idx_product_recommendations_status ON product_recommendations(status);

-- Add helpful comments
COMMENT ON TABLE product_recommendations IS 'Stores AI-generated product recommendations based on ticket analysis';
COMMENT ON COLUMN product_recommendations.type IS 'Type of recommendation: feature, improvement, fix, integration, etc.';
COMMENT ON COLUMN product_recommendations.confidence_score IS 'AI confidence score for this recommendation (0-1)';
COMMENT ON COLUMN product_recommendations.related_tickets IS 'Array of ticket IDs that led to this recommendation';
COMMENT ON COLUMN product_recommendations.status IS 'Status of recommendation: pending, accepted, or rejected'; 