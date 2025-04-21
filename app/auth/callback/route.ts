import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (code) {
    // Create a Supabase client configured to use cookies
    const supabase = await createServerSupabaseClient();
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/login?error=auth_callback_error', request.url));
    }
  }
  
  // Redirect to onboarding after successful authentication
  return NextResponse.redirect(new URL('/onboarding/connect-zendesk', request.url));
} 