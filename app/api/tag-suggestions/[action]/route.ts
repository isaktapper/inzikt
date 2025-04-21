import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request, { params }: { params: { action: string } }) {
  try {
    const { action } = params;
    
    if (!['accept', 'reject', 'get'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { suggestionId, ticketId } = body;
    
    if (action !== 'get' && !suggestionId) {
      return NextResponse.json(
        { error: 'Suggestion ID is required' },
        { status: 400 }
      );
    }
    
    // Get user from auth token
    const token = req.headers.get('authorization')?.split(' ')[1] || '';
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Handle different actions
    if (action === 'get') {
      // Get tag suggestions for the user (and optionally filtered by ticket)
      let query = supabase
        .from('tag_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');
        
      if (ticketId) {
        query = query.eq('ticket_id', ticketId);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch tag suggestions' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ suggestions: data });
      
    } else if (action === 'accept') {
      // Accept a suggestion
      
      // First get the suggestion details
      const { data: suggestion, error: getError } = await supabase
        .from('tag_suggestions')
        .select('*')
        .eq('id', suggestionId)
        .eq('user_id', user.id)
        .single();
      
      if (getError || !suggestion) {
        return NextResponse.json(
          { error: 'Suggestion not found or not authorized' },
          { status: 404 }
        );
      }
      
      // Update suggestion status
      const { error: updateError } = await supabase
        .from('tag_suggestions')
        .update({ status: 'accepted' })
        .eq('id', suggestionId);
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update suggestion status' },
          { status: 500 }
        );
      }
      
      // Add the tag to user_tags
      const { error: insertError } = await supabase
        .from('user_tags')
        .upsert({
          user_id: user.id,
          tag_name: suggestion.suggested_tag,
          is_default: false
        }, {
          onConflict: 'user_id,tag_name',
          ignoreDuplicates: true
        });
      
      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to add tag to user tags' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Tag accepted and added to your tags'
      });
      
    } else if (action === 'reject') {
      // Reject a suggestion
      
      // Update suggestion status
      const { error: updateError } = await supabase
        .from('tag_suggestions')
        .update({ status: 'rejected' })
        .eq('id', suggestionId)
        .eq('user_id', user.id);
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update suggestion status' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Tag suggestion rejected'
      });
    }
    
    // Default response (should never reach here)
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error: any) {
    console.error('Error in tag-suggestions API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 