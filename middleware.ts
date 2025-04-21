import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        cookieOptions: {
          maxAge: 86400 // 24 hours in seconds
        },
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Always refresh the session to make sure it's valid
    // This is crucial for API endpoints to authenticate correctly
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error("Auth session error:", error.message)
    }

    // API routes don't need to be redirected, just let them through
    // They have their own auth checks
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return response;
    }

    // Only redirect for protected pages
    const authPath = request.nextUrl.pathname.startsWith('/onboarding') || 
                     request.nextUrl.pathname.startsWith('/dashboard')
    
    const authPage = request.nextUrl.pathname === '/login' || 
                    request.nextUrl.pathname === '/register'
    
    // If accessing a protected page without a session, redirect to login
    if (authPath && !session) {
      console.log(`Redirecting from ${request.nextUrl.pathname} to /login (no session)`)
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // If accessing login/register with a session, redirect to dashboard
    if (authPage && session) {
      console.log(`Redirecting from ${request.nextUrl.pathname} to /dashboard (has session)`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (e) {
    console.error('Middleware error:', e)
    // If there's an error in the middleware, we should still allow the request through
    // rather than breaking the application
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

// Configure middleware to run for the API routes (except Next.js internal routes)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * 
     * Include API routes as they need authentication too
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 