import { NextRequest, NextResponse } from 'next/server';
import { cancelAnalysisJob } from '../../scripts/cancel-user-job.js';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    // Get user ID from path parameter
    const userId = params.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Check for service key as query parameter
    const serviceKey = new URL(req.url).searchParams.get('key');
    if (serviceKey) {
      const actualServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      const expectedKey = actualServiceKey.slice(-8); // Last 8 chars 
      
      if (serviceKey !== expectedKey) {
        return NextResponse.json(
          { error: 'Invalid service key' },
          { status: 403 }
        );
      }
    } else {
      // If no service key provided, reject the request
      return NextResponse.json(
        { error: 'Service key required' },
        { status: 401 }
      );
    }
    
    // Cancel the analysis job for this user
    const result = await cancelAnalysisJob(userId);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Error in cancel-user-job API:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to cancel job' },
      { status: 500 }
    );
  }
} 