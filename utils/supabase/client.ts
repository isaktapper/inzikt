import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

/**
 * Creates a Supabase client for browser usage with authentication support
 */
export function createClientSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Only show warning in development if environment variables are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing!");
  }

  const client = createBrowserClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
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

  return client;
} 