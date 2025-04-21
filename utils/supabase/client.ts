import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

export const createClientSupabaseClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce',
        detectSessionInUrl: true,
      },
      cookieOptions: {
        maxAge: 86400 // 24 hours in seconds
      },
    }
  );
}; 