import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    // Use server-side Supabase client that bypasses RLS
    const supabase = await createServerSupabaseClient();
    
    // Get the auth user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Create a new test job
    const newJob = {
      user_id: user?.id || '00000000-0000-0000-0000-000000000000',
      provider: 'test-api',
      status: 'completed',
      progress: 100,
      total_pages: 1,
      current_page: 1,
      total_tickets: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };
    
    console.log('Creating test job with server-side client:', newJob);
    
    const { data, error } = await supabase
      .from('import_jobs')
      .insert(newJob)
      .select();
    
    if (error) {
      console.error('Server-side error creating test job:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }
    
    console.log('Test job created successfully:', data);
    
    return NextResponse.json({
      success: true,
      job: data[0]
    });
  } catch (error: any) {
    console.error('Unhandled error in create-test-job API:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 