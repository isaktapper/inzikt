import { createBrowserClient } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce',
        // 24 hours session expiry
        detectSessionInUrl: true,
      },
      cookieOptions: {
        maxAge: 86400 // 24 hours in seconds
      },
      cookies: {
        get(name: string) {
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name: string, value: string, options: CookieOptions) {
          document.cookie = `${name}=${value}; path=/; max-age=${options.maxAge ?? 86400}`
        },
        remove(name: string, options: CookieOptions) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
        },
      },
    }
  )
} 