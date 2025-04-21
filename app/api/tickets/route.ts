import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Create a service role client that bypasses RLS
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function GET() {
  try {
    // Initialize Supabase client with minimal cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookieStore = await cookies()
            return cookieStore.get(name)?.value ?? ''
          },
          set(name: string, value: string, options: any) {},
          remove(name: string, options: any) {},
        },
      }
    )

    // Get current user if in production
    let user = null
    if (process.env.NODE_ENV === 'production') {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error('Auth error:', userError.message)
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
      }

      if (!authUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }

      user = authUser
    }

    // Fetch tickets WITH analysis data
    let query = supabase
    .from('tickets')
    .select(`
      *,
      analysis (
        aiSummary,
        aiDescription,
        aiTags,
        aiNewTags
      )
    `)
    .order('created_at', { ascending: false })  

    if (user && process.env.NODE_ENV === 'production') {
      query = query.eq('user_id', user.id)
    }

    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      console.error('Database error:', ticketsError.message)
      return NextResponse.json({ error: 'Failed to fetch tickets', details: ticketsError.message }, { status: 500 })
    }

    // ✅ Flatten analysis data into top-level props
    const flattenedTickets = (tickets || []).map(ticket => ({
      ...ticket,
      aiSummary: ticket.analysis?.aiSummary || '',
      aiDescription: ticket.analysis?.aiDescription || '',
      aiTags: ticket.analysis?.aiTags || [],
      aiNewTags: ticket.analysis?.aiNewTags || false,
    }))

    return NextResponse.json({
      tickets: flattenedTickets,
      count: flattenedTickets.length
    })

  } catch (error: any) {
    console.error('Server error:', error.message)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
