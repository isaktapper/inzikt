import { NextResponse } from 'next/server'
import { generateInsights } from '@/lib/cron/jobs/generate-insights'
import { createServerSupabaseClient } from '@/utils/supabase/server'

type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'half_year' | 'year';

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get requested periods from query parameters
    const { searchParams } = new URL(request.url)
    const periodsParam = searchParams.get('periods') || 'week'
    const periods = periodsParam.split(',').map(p => p.trim()) as PeriodType[]
    
    // Generate insights for each requested period
    const results = await generateInsights({
      user_id: user.id,
      periods,
      compare_with: 'previous_period'
    })
    
    // Extract all insights from the results
    let allInsights: any[] = []
    if (results.results) {
      // New multi-period format
      results.results.forEach((result: any) => {
        if (result.insights && Array.isArray(result.insights)) {
          allInsights = [...allInsights, ...result.insights]
        }
      })
    } else if (results.insights && Array.isArray(results.insights)) {
      // Legacy single period format
      allInsights = results.insights
    }
    
    return NextResponse.json({ 
      insights: allInsights,
      message: "Insights generated successfully" 
    })
  } catch (error: any) {
    console.error('Error in insights endpoint:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse request body
    const body = await request.json()
    const { periods = ['week'], compare_with = 'previous_period' } = body
    
    // Create a job for generating insights
    const { data: job, error } = await supabase
      .from('import_jobs')
      .insert({
        user_id: user.id,
        job_type: 'generate-insights',
        status: 'pending',
        progress: 0,
        parameters: {
          periods,
          compare_with
        },
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()
    
    if (error) {
      throw new Error(`Failed to create job: ${error.message}`)
    }
    
    // Start the job
    generateInsights({
      user_id: user.id,
      periods: periods as PeriodType[],
      compare_with
    }).then(async (results) => {
      // Update job status
      await supabase
        .from('import_jobs')
        .update({
          status: 'completed',
          progress: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)
      
      console.log('Insights generation completed successfully')
    }).catch(async (error) => {
      // Update job status on error
      await supabase
        .from('import_jobs')
        .update({
          status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)
      
      console.error('Insights generation failed:', error)
    })
    
    return NextResponse.json({ 
      message: 'Insights generation job started',
      jobId: job.id
    })
  } catch (error: any) {
    console.error('Error in insights endpoint:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 