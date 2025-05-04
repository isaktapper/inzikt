import { NextRequest, NextResponse } from 'next/server';
import { progressStore } from '../../analyze-tickets/route';

// This is a debugging endpoint to forcefully terminate jobs
// WARNING: For development/emergency use only
export async function POST(request: NextRequest) {
  try {
    // Get the job details from the request
    const { userId, jobId, command } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    console.log(`[DEBUG] Received command ${command} for user ${userId}, job ${jobId}`);
    
    // Check if force termination was requested
    if (command === 'FORCE_TERMINATE') {
      // Remove the job from the in-memory progress store if it exists
      if (progressStore[userId]) {
        console.log(`[DEBUG] Force terminating job in progressStore for user ${userId}`);
        console.log(`[DEBUG] Current state before termination:`, progressStore[userId]);
        
        // Delete from progress store - this should stop the analysis process
        delete progressStore[userId];
        
        console.log(`[DEBUG] Job removed from progressStore`);
        return NextResponse.json({ 
          success: true, 
          message: 'Job forcefully terminated from in-memory store' 
        });
      } else {
        console.log(`[DEBUG] No job found in progressStore for user ${userId}`);
        return NextResponse.json({ 
          warning: 'No job found in progress store for this user',
          progressStore: Object.keys(progressStore)
        });
      }
    }
    
    // If not a recognized command
    return NextResponse.json({ 
      error: 'Unrecognized command',
      availableCommands: ['FORCE_TERMINATE'] 
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error in debug terminate-job endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 