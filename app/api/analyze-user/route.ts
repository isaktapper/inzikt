import { NextRequest, NextResponse } from 'next/server';
import { analyzeTicketsForUser } from '../scripts/analyze-user-tickets.js';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Get user ID from request body
    const userId = body.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Validate service key for security
    const providedServiceKey = body.serviceKey;
    if (providedServiceKey) {
      const actualServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      const expectedKey = actualServiceKey.slice(-8); // Last 8 chars 
      
      if (providedServiceKey !== expectedKey) {
        return NextResponse.json(
          { error: 'Invalid service key' },
          { status: 403 }
        );
      }
    } else {
      // If no service key provided, check if the request is coming from an authenticated session
      // This is a simplified check - in production, you'd want to verify the session properly
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