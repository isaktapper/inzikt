import { NextRequest, NextResponse } from 'next/server';
import { analyzeTicketsForUser } from '../../scripts/analyze-user-tickets.js';

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
      // If no service key provided, check if the request is coming from an authenticated session
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    // Start analyzing tickets for the user
    const result = await analyzeTicketsForUser(userId);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Error in analyze-user API:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to analyze tickets' },
      { status: 500 }
    );
  }
} 