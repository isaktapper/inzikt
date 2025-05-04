import { NextResponse } from 'next/server';
import { progressStore } from '../analyze-tickets/route';
import { createClient } from '@supabase/supabase-js';

// Helper to clean up old completed analyses
const cleanupOldCompletedAnalyses = () => {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  
  Object.keys(progressStore).forEach(userId => {
    const progress = progressStore[userId];
    if (progress.isCompleted && now - progress.lastUpdateTime > ONE_HOUR) {
      delete progressStore[userId];
    }
  });
};

// GET: Fetch current progress
export async function GET(request: Request) {
  try {
    // Clean up old entries
    cleanupOldCompletedAnalyses();
    
    // Get user ID from the URL
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    // Create Supabase admin client to check the actual job status in database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Check if there's an active job in the database
    const { data: activeJob, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('job_type', 'analysis')
      .or('status.eq.processing,status.eq.pending')
      .order('created_at', { ascending: false })
      .limit(1);
      
    // If there's no active job in the database but we have one in memory, 
    // update our in-memory state to match database
    const inMemoryProgress = progressStore[userId];
    if (inMemoryProgress && !inMemoryProgress.isCompleted && 
        (!activeJob || activeJob.length === 0)) {
      // Job is completed in the database but not in memory, update memory
      inMemoryProgress.isCompleted = true;
      inMemoryProgress.lastUpdateTime = Date.now();
    }
    
    // Return progress data for this user if it exists
    const progress = progressStore[userId] || {
      userId,
      totalTickets: 0,
      processedCount: 0,
      isCompleted: true, // No active analysis
      lastUpdateTime: 0
    };
    
    return NextResponse.json(progress);
  } catch (error: any) {
    console.error('Error fetching analysis progress:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// We don't need the POST method anymore since we're updating directly in memory 