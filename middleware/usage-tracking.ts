import { NextResponse } from 'next/server';
import { recordUsage } from '@/lib/usage/tracker';
import { createClientSupabaseClient } from '@/utils/supabase/client';
import { NextApiResponse } from 'next';

interface ExtendedRequest extends Request {
  session?: {
    user?: {
      id: string;
    };
  };
}

type ExtendedHandler = (req: ExtendedRequest) => Promise<Response>;

/**
 * Middleware for tracking API usage
 */
export async function usageTrackingMiddleware(
  req: ExtendedRequest, 
  handler: ExtendedHandler, 
  metricType = 'api_call'
) {
  try {
    // Skip tracking for non-authenticated users
    const session = req.session;
    if (!session?.user?.id) {
      return handler(req);
    }
    
    const supabase = createClientSupabaseClient();
    
    // Get the API endpoint from the URL
    const url = new URL(req.url || '');
    const endpoint = url.pathname.split('/').slice(2).join('/');
    
    // Track the API call
    await recordUsage(supabase, session.user.id, metricType, 1, { 
      endpoint,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    // Continue with the request
    return handler(req);
  } catch (error) {
    // Log error but don't block the request
    console.error('Error tracking usage:', error);
    return handler(req);
  }
}

/**
 * Track OpenAI API usage specifically
 */
export async function trackOpenAIUsage(userId: string, model: string, tokens: number) {
  try {
    const supabase = createClientSupabaseClient();
    await recordUsage(supabase, userId, 'openai_tokens', tokens, {
      model,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error tracking OpenAI usage:', error);
    return false;
  }
} 