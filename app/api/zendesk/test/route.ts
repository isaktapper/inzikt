import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: Request) {
  try {
    // Get parameters from query string
    const url = new URL(req.url)
    const query = url.searchParams.get('query') || 'type:ticket'
    
    // Get authenticated user
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get Zendesk connection
    const { data: connection, error: connError } = await supabase
      .from('zendesk_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: 'No Zendesk connection found' }, { status: 404 })
    }

    console.log("Testing Zendesk API with query:", query)
    
    // Create auth token
    const token = Buffer.from(`${connection.admin_email}/token:${connection.api_token}`).toString('base64')
    
    // First, get available groups for reference
    const groupsResponse = await fetch(`https://${connection.subdomain}.zendesk.com/api/v2/groups.json`, {
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    let groups = []
    if (groupsResponse.ok) {
      const groupsData = await groupsResponse.json()
      groups = groupsData.groups.map((g: any) => ({ id: g.id, name: g.name }))
    }
    
    // Make test search request
    const searchUrl = `https://${connection.subdomain}.zendesk.com/api/v2/search.json?query=${encodeURIComponent(query)}&per_page=10`
    console.log("Making request to:", searchUrl)
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ 
        success: false, 
        error: `API error: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status })
    }

    const data = await response.json()
    
    // Process tickets to add group names
    const tickets = data.results || []
    const processedTickets = tickets.map((ticket: any) => {
      const group = groups.find((g: any) => g.id === ticket.group_id)
      return {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        group_id: ticket.group_id,
        group_name: group ? group.name : null,
        created_at: ticket.created_at
      }
    })

    return NextResponse.json({ 
      success: true,
      query: query,
      count: data.count,
      tickets_returned: processedTickets.length,
      tickets: processedTickets,
      connection_info: {
        subdomain: connection.subdomain,
        selected_groups: connection.selected_groups,
        selected_statuses: connection.selected_statuses
      },
      available_groups: groups
    })
  } catch (error: any) {
    console.error('Error in test endpoint:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
} 