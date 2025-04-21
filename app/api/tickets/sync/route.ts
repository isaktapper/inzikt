import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ZendeskService } from '@/lib/zendesk/service'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error("❌ Not authenticated:", userError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get Zendesk connection
    const { data: connection, error: connError } = await supabase
      .from('zendesk_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (connError || !connection) {
      console.error("❌ No Zendesk connection:", connError)
      return NextResponse.json({ error: 'No Zendesk connection found' }, { status: 404 })
    }

    // Initialize Zendesk service
    const zendeskService = new ZendeskService({
      subdomain: connection.subdomain,
      email: connection.admin_email,
      api_token: connection.api_token,
      selected_groups: connection.selected_groups || [],
      selected_statuses: connection.selected_statuses || [],
      max_tickets: connection.max_tickets || 25,
    })

    console.log("🔄 Fetching tickets from Zendesk...")
    const tickets = await zendeskService.fetchTickets()

    if (!tickets.length) {
      console.warn("⚠️ No tickets returned from Zendesk")
      return NextResponse.json({
        success: true,
        message: 'No tickets found in Zendesk',
        tickets: []
      })
    }

    const ticketsWithUserId = tickets.map(ticket => ({
      ...ticket,
      user_id: user.id
    }))

    // Use service client to upsert into Supabase
    const serviceClient = createServiceClient()
    const { data: inserted, error: upsertError } = await serviceClient
      .from('tickets')
      .upsert(ticketsWithUserId, {
        onConflict: 'zendesk_id,user_id',
        ignoreDuplicates: false
      })
      .select()

    if (upsertError) {
      console.error('❌ Error upserting tickets:', upsertError)
      return NextResponse.json({
        success: false,
        message: 'Tickets fetched but not saved',
        error: upsertError.message,
        tickets: ticketsWithUserId
      })
    }

    console.log(`✅ Upserted ${inserted?.length || 0} tickets to Supabase`)

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${inserted?.length || 0} tickets`,
      tickets: inserted
    })

  } catch (error: any) {
    console.error('❌ Unexpected error syncing tickets:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}
