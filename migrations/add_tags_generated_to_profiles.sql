-- Add tags_generated column to profiles table
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS tags_generated BOOLEAN DEFAULT false;

-- Create the user_tags table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_tags'
    ) THEN
        CREATE TABLE public.user_tags (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            tag_name TEXT NOT NULL,
            is_default BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, tag_name)
        );
        
        -- Enable Row Level Security
        ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for users to manage their own tags
        CREATE POLICY "Users can view their own tags" 
        ON user_tags FOR SELECT 
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own tags" 
        ON user_tags FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own tags" 
        ON user_tags FOR UPDATE 
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own tags" 
        ON user_tags FOR DELETE 
        USING (auth.uid() = user_id);
        
        -- Create policy for service role to manage all tags
        CREATE POLICY "Service role can manage all tags"
        ON user_tags
        USING (true)
        WITH CHECK (true);
    END IF;
END
$$; 