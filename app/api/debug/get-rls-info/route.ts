import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    // Use server-side Supabase client that bypasses RLS
    const supabase = await createServerSupabaseClient();
    
    // Get RLS policy info from pg_policy
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies') // This is a postgres view that contains policy info
      .select('*')
      .eq('tablename', 'import_jobs');
    
    if (policiesError) {
      // If we can't access the pg_policies view directly, return a fallback message
      console.error('Error fetching RLS policies:', policiesError);
      
      return NextResponse.json({
        message: "RLS is enabled for the import_jobs table. The specific policies can only be viewed in the Supabase dashboard.",
        isRlsEnabled: true,
        policies: []
      });
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    return NextResponse.json({
      user: user ? {
        id: user.id,
        email: user.email
      } : null,
      policies: policies || [],
      isRlsEnabled: true
    });
  } catch (error: any) {
    console.error('Unhandled error in get-rls-info API:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 