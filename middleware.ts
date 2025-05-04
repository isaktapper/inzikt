import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // For local development, allow direct access for debugging
  const isLocalDevelopment = process.env.NODE_ENV === 'development'
  const bypassAuth = req.headers.get('x-bypass-auth') === 'true'
  
  if (isLocalDevelopment && bypassAuth) {
    console.log("Bypassing auth check in local development")
    return NextResponse.next()
  }

  // Create a Supabase client configured for the edge
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Get the current session
  const sessionResult = await supabase.auth.getSession()
  const session = sessionResult?.data?.session || null
  const hasSession = !!session

  console.log("Middleware - Path:", req.nextUrl.pathname)
  console.log("Middleware - Session exists:", hasSession)

  // Check if path requires authentication
  const requiresAuth = 
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/api/insights')

  // If path requires auth and there's no session, redirect to login
  if (requiresAuth && !hasSession) {
    console.log("Redirecting to login from path:", req.nextUrl.pathname)
    
    // Create a redirect URL with the original path to return after login
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

// Add a matcher for routes that should be protected
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/api/insights/:path*',
    '/api/zendesk/:path*',
    '/api/tickets/:path*',
  ],
} 