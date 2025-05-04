import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { generateInsights } from '@/lib/cron/jobs/generate-insights';
// Use dynamic import for Database type to avoid errors if it doesn't exist
// import { Database } from '@/types/supabase';

export async function POST(req: Request) {
  try {
    // Check for local development bypass for testing
    const headers = new Headers(req.headers);
    const bypassAuth = headers.get('x-bypass-auth') === 'true' && process.env.NODE_ENV === 'development';
    let userId: string;

    if (bypassAuth) {
      // For local development testing only, use a hardcoded user ID if auth is bypassed
      console.log("Bypassing auth for local development");
      userId = headers.get('x-user-id') || process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000000';
    } else {
      // Initialize Supabase client
      const supabase = createRouteHandlerClient({ cookies });

      try {
        // Get current user with more detailed error handling
        const { data, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Authentication error:', userError.message);
          return NextResponse.json(
            { error: 'Authentication required', details: userError.message },
            { status: 401 }
          );
        }
        
        if (!data || !data.user) {
          console.log("No user found in session. Using development fallback...");
          if (process.env.NODE_ENV === 'development') {
            // For development only, use a fallback user
            userId = process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000000';
            console.log("Using fallback development user ID:", userId);
          } else {
            return NextResponse.json(
              { error: 'Authentication required', details: 'No user found in session' },
              { status: 401 }
            );
          }
        } else {
          userId = data.user.id;
        }
      } catch (authError: any) {
        console.error('Unexpected auth error:', authError);
        return NextResponse.json(
          { error: 'Authentication failed', details: authError.message },
          { status: 401 }
        );
      }
    }

    // Parse request body for parameters
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      payload = {}; // Default if JSON parsing fails
    }
    
    // Support both single period and multiple periods
    const { 
      period = 'week', 
      periods = period ? [period] : ['week'], 
      compare_with = 'previous_period' 
    } = payload;
    
    // Validate all periods
    const validPeriods = ['day', 'week', 'month', 'quarter', 'half_year', 'year'];
    for (const p of periods) {
      if (!validPeriods.includes(p)) {
        return NextResponse.json(
          { error: `Invalid period: ${p}. Must be one of: ${validPeriods.join(', ')}` },
          { status: 400 }
        );
      }
    }

    if (!['previous_period', 'same_last_year'].includes(compare_with)) {
      return NextResponse.json(
        { error: 'Invalid comparison type. Must be "previous_period" or "same_last_year"' },
        { status: 400 }
      );
    }

    // Create a job record
    console.log("Creating job record with service role key");
    console.log("NEXT_PUBLIC_SUPABASE_URL defined:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("SUPABASE_SERVICE_ROLE_KEY defined:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Skip direct check against auth.users table since we already have a valid userId
    // from the authentication process or development fallback
    console.log("Using userId for insights generation:", userId);

    try {
      console.log("Attempting to insert job for user:", userId);
      const { data: jobData, error: jobError } = await adminSupabase
        .from('import_jobs')
        .insert({
          user_id: userId,
          job_type: 'analysis', // Use 'analysis' which we know is valid
          status: 'pending',
          progress: 0,
          provider: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (jobError) {
        console.error('Error creating insights job:', jobError);
        console.error('Error details:', JSON.stringify(jobError));
        return NextResponse.json(
          { error: 'Failed to create insights job', details: jobError },
          { status: 500 }
        );
      }

      if (!jobData) {
        console.error('No job data returned after insert');
        return NextResponse.json(
          { error: 'Failed to create insights job - no data returned' },
          { status: 500 }
        );
      }

      console.log("Job created successfully with ID:", jobData.id);
      
      // Generate insights (background process)
      const runInsightsProcess = async () => {
        try {
          // Update job to running
          await adminSupabase
            .from('import_jobs')
            .update({
              status: 'running',
              progress: 10,
              updated_at: new Date().toISOString()
            })
            .eq('id', jobData.id);

          // Generate insights
          const result = await generateInsights({
            user_id: userId,
            periods: periods as ('day' | 'week' | 'month' | 'quarter' | 'half_year' | 'year')[],
            compare_with: compare_with as 'previous_period' | 'same_last_year'
          });

          // Update job to completed
          await adminSupabase
            .from('import_jobs')
            .update({
              status: 'completed',
              progress: 100,
              is_completed: true,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', jobData.id);

          console.log(`Insights generation completed for user ${userId}`);
          return result;
        } catch (error) {
          console.error('Error in insights generation process:', error);
          
          // Update job to failed
          await adminSupabase
            .from('import_jobs')
            .update({
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
              updated_at: new Date().toISOString()
            })
            .eq('id', jobData.id);
        }
      };

      // Start the process without waiting for it to complete
      runInsightsProcess().catch(err => {
        console.error('Unhandled error in insights generation process:', err);
      });

      // Return immediate response
      return NextResponse.json({
        success: true,
        message: 'Insights generation started',
        jobId: jobData.id
      });
    } catch (insertError: any) {
      console.error('Exception during job creation:', insertError);
      return NextResponse.json(
        { error: 'Exception creating insights job', details: insertError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in insights generation endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch insights
export async function GET(req: Request) {
  try {
    // Check for local development bypass for testing
    const headers = new Headers(req.headers);
    const bypassAuth = headers.get('x-bypass-auth') === 'true' && process.env.NODE_ENV === 'development';
    let userId: string;

    if (bypassAuth) {
      // For local development testing only
      console.log("Bypassing auth for local development");
      userId = headers.get('x-user-id') || process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000000';
    } else {
      // Initialize Supabase client
      const supabase = createRouteHandlerClient({ cookies });

      try {
        // Get current user with more detailed error handling
        const { data, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Authentication error:', userError.message);
          return NextResponse.json(
            { error: 'Authentication required', details: userError.message },
            { status: 401 }
          );
        }
        
        if (!data || !data.user) {
          console.log("No user found in session. Using development fallback...");
          if (process.env.NODE_ENV === 'development') {
            // For development only, use a fallback user
            userId = process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000000';
            console.log("Using fallback development user ID:", userId);
          } else {
            return NextResponse.json(
              { error: 'Authentication required', details: 'No user found in session' },
              { status: 401 }
            );
          }
        } else {
          userId = data.user.id;
        }
      } catch (authError: any) {
        console.error('Unexpected auth error:', authError);
        return NextResponse.json(
          { error: 'Authentication failed', details: authError.message },
          { status: 401 }
        );
      }
    }

    // Continue with the existing logic using userId
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Parse periods parameter (comma-separated list)
    const periodsParam = url.searchParams.get('periods') || 'week';
    const periods = periodsParam.split(',').map(p => p.trim());
    
    console.log(`Fetching insights for periods: ${periods.join(', ')}`);

    // Initialize Supabase client (if not already done)
    const supabase = bypassAuth 
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      : createRouteHandlerClient({ cookies });

    // Fetch insights for the user with multiple periods support
    const { data: insights, error: insightsError } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', userId)
      .in('time_period', periods) // Use .in() instead of .eq() to support multiple periods
      .order('created_at', { ascending: false })
      .limit(limit * periods.length); // Increase limit proportionally to number of periods

    if (insightsError) {
      console.error('Error fetching insights:', insightsError);
      return NextResponse.json(
        { error: 'Failed to fetch insights' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      insights: insights || []
    });
  } catch (error: any) {
    console.error('Error in get insights endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 