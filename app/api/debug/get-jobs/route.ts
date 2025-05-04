import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    // Use server-side Supabase client that bypasses RLS
    const supabase = await createServerSupabaseClient();
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const userId = searchParams.get('userId');
    const showCompletedOnly = searchParams.get('completed') === 'true';
    const progressFilter = searchParams.get('progress');
    
    // Build the query
    let query = supabase
      .from('import_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // Apply filters if specified
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (showCompletedOnly) {
      query = query.eq('status', 'completed');
    }
    
    if (progressFilter) {
      query = query.eq('progress', parseInt(progressFilter));
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Server-side error fetching jobs:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log(`Server-side fetched ${data.length} jobs`);
    
    return NextResponse.json({
      jobs: data
    });
  } catch (error: any) {
    console.error('Unhandled error in get-jobs API:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 