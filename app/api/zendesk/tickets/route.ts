import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { ZendeskService } from '@/lib/zendesk/service'

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
    const url = new URL(req.url)
    // Remove the limit parameter as we'll get all tickets from last 30 days
    // const limitParam = url.searchParams.get('limit')
    // const limit = limitParam ? parseInt(limitParam) : undefined
    
    console.log("Starting ticket import from the last 30 days")
    
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
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error('Cookie set error:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Cookie remove error:', error)
            }
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error("No authenticated user found")
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get Zendesk connection
    const { data: connection, error: connError } = await supabase
      .from('zendesk_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (connError || !connection) {
      console.error("Error fetching Zendesk connection:", connError)
      return NextResponse.json({ error: 'No Zendesk connection found' }, { status: 404 })
    }

    // Initialize Zendesk service
    const zendeskService = new ZendeskService({
      subdomain: connection.subdomain,
      email: connection.admin_email,
      api_token: connection.api_token,
      selected_groups: connection.selected_groups || [],
      selected_statuses: connection.selected_statuses || [],
    })

    // Fetch tickets from Zendesk
    console.log("Fetching tickets from Zendesk...")
    console.log("DEBUG - Connection settings:", {
      subdomain: connection.subdomain,
      admin_email: connection.admin_email ? '(redacted for privacy)' : 'missing',
      selected_groups: connection.selected_groups,
      selected_statuses: connection.selected_statuses,
    })
    
    // Get available groups from Zendesk for verification
    try {
      const groupsResponse = await fetch(`https://${connection.subdomain}.zendesk.com/api/v2/groups.json`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${connection.admin_email}/token:${connection.api_token}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        console.log("DEBUG - Available Zendesk groups:", 
          groupsData.groups.map((g: any) => ({ id: g.id, name: g.name }))
        );
        
        // Check if selected groups exist in available groups
        const availableGroupIds = groupsData.groups.map((g: any) => String(g.id));
        const validGroups = connection.selected_groups.filter((id: string) => availableGroupIds.includes(id));
        const invalidGroups = connection.selected_groups.filter((id: string) => !availableGroupIds.includes(id));
        
        console.log("DEBUG - Valid selected groups:", validGroups);
        if (invalidGroups.length > 0) {
          console.log("DEBUG - WARNING: Invalid selected groups:", invalidGroups);
        }
      } else {
        console.error("DEBUG - Failed to fetch Zendesk groups:", await groupsResponse.text());
      }
    } catch (error) {
      console.error("DEBUG - Error fetching Zendesk groups:", error);
    }
    
    // Fetch tickets
    const rawTickets = await zendeskService.fetchTickets()
    console.log(`Fetched ${rawTickets.length} tickets from Zendesk`)
    
    // Debug: Log the first ticket to see its structure
    if (rawTickets.length > 0) {
      console.log("First raw ticket structure:", JSON.stringify(rawTickets[0], null, 2))
    } else {
      console.log("DEBUG - CRITICAL ISSUE: No tickets returned from Zendesk API")
      
      // Try a simple test query to verify API connection
      try {
        console.log("DEBUG - Testing simple Zendesk query to verify API connection...")
        const testService = new ZendeskService({
          subdomain: connection.subdomain,
          email: connection.admin_email,
          api_token: connection.api_token,
          selected_groups: [], // Empty to bypass group filtering
          selected_statuses: [],
          max_tickets: 1,
        });
        
        // Override the fetchTickets method to use a simple query
        const originalFetchTickets = testService.fetchTickets.bind(testService);
        testService.fetchTickets = async () => {
          const baseUrl = `https://${connection.subdomain}.zendesk.com/api/v2`;
          const query = 'type:ticket';
          console.log("DEBUG - Testing with simple query:", query);
          
          try {
            const response = await fetch(`${baseUrl}/search.json?query=${encodeURIComponent(query)}&per_page=1`, {
              headers: {
                'Authorization': `Basic ${Buffer.from(`${connection.admin_email}/token:${connection.api_token}`).toString('base64')}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log("DEBUG - Test query response:", {
                count: data.count,
                results_count: data.results?.length || 0
              });
            } else {
              console.error("DEBUG - Test query failed:", await response.text());
            }
          } catch (error) {
            console.error("DEBUG - Test query error:", error);
          }
          
          return await originalFetchTickets();
        };
        
        // Run the test query
        await testService.fetchTickets();
      } catch (error) {
        console.error("DEBUG - Test query exception:", error);
      }
      
      return NextResponse.json({ 
        success: false, 
        message: "No tickets found in Zendesk - check your group and status filters",
        tickets: [],
        debug: {
          selected_groups: connection.selected_groups,
          selected_statuses: connection.selected_statuses
        }
      })
    }
    
    // Use service client to bypass RLS
    const serviceClient = createServiceClient()
    
    // Map tickets to database format - make sure we use the correct structure
    // Each ticket should already have the correct structure from ZendeskService
    const ticketsToUpsert = [];
    const skippedTickets = [];
    
    for (const ticket of rawTickets) {
      // Validate required fields
      if (!ticket.zendesk_id) {
        console.warn(`Skipping ticket with missing zendesk_id:`, JSON.stringify(ticket, null, 2));
        skippedTickets.push({ ...ticket, reason: 'Missing zendesk_id' });
        continue;
      }
      
      if (!ticket.status) {
        console.warn(`Skipping ticket with ID ${ticket.zendesk_id} - missing status`);
        skippedTickets.push({ ...ticket, reason: 'Missing status' });
        continue;
      }
      
      if (!ticket.subject) {
        console.warn(`Skipping ticket with ID ${ticket.zendesk_id} - missing subject`);
        skippedTickets.push({ ...ticket, reason: 'Missing subject' });
        continue;
      }
      
      // Create mapped ticket with all required fields
      const mappedTicket = {
        ...ticket,
        user_id: user.id,
        // Ensure all required fields have values
        zendesk_id: String(ticket.zendesk_id || '0'),
        subject: ticket.subject || 'No subject',
        status: ticket.status || 'unknown',
        priority: ticket.priority || 'normal',
        // Include conversation data for analysis
        conversation: ticket.conversation || []
      };
      
      // Log each ticket we're about to upsert
      console.log(`Preparing ticket for upsert - ID: ${mappedTicket.zendesk_id}, Subject: ${mappedTicket.subject.substring(0, 30)}..., Conversation entries: ${mappedTicket.conversation.length}`);
      
      ticketsToUpsert.push(mappedTicket);
    }
    
    // Log summary of validation
    console.log(`Validation complete: ${ticketsToUpsert.length} valid tickets, ${skippedTickets.length} skipped`);
    
    if (skippedTickets.length > 0) {
      console.log(`Skipped tickets summary:`, skippedTickets.map(t => ({ 
        id: t.zendesk_id || 'unknown', 
        reason: t.reason 
      })));
    }
    
    if (ticketsToUpsert.length === 0) {
      console.error("No valid tickets to upsert after validation");
      return NextResponse.json({ 
        success: false, 
        message: "No valid tickets to import - all tickets were missing required fields",
        tickets_fetched: rawTickets.length,
        tickets_valid: 0,
        skipped: skippedTickets.length,
        skipped_reasons: skippedTickets.map(t => t.reason)
      });
    }
    
    console.log(`Mapped ${ticketsToUpsert.length} tickets for upsert`);
    console.log("First mapped ticket:", JSON.stringify(ticketsToUpsert[0], null, 2));
    
    // Insert tickets in batches to avoid timeouts and improve reliability
    console.log("Upserting tickets to database in batches...")
    
    const BATCH_SIZE = 50; // Process 50 tickets at a time
    let successCount = 0;
    let errorCount = 0;
    let lastError = null;
    
    // Process tickets in batches
    for (let i = 0; i < ticketsToUpsert.length; i += BATCH_SIZE) {
      const batch = ticketsToUpsert.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(ticketsToUpsert.length/BATCH_SIZE)} (${batch.length} tickets)`);
      
      const { error } = await serviceClient
        .from('tickets')
        .upsert(batch, {
          onConflict: 'zendesk_id,user_id'
        });
      
      if (error) {
        console.error(`Error upserting batch ${Math.floor(i/BATCH_SIZE) + 1}:`, error);
        errorCount += batch.length;
        lastError = error;
      } else {
        console.log(`Successfully upserted batch of ${batch.length} tickets`);
        successCount += batch.length;
      }
    }
    
    console.log(`Upserted ${successCount} tickets with ${errorCount} errors`);
    console.log(`Skipped ${skippedTickets.length} tickets`);
    
    // Get count of tickets in database for this user
    const { count, error: countError } = await serviceClient
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (countError) {
      console.error('Error getting ticket count:', countError);
    }
    
    // Return tickets for display 
    return NextResponse.json({ 
      success: true, 
      tickets: ticketsToUpsert,
      count: ticketsToUpsert.length,
      db_count: count || 0,
      tickets_fetched: rawTickets.length,
      tickets_inserted: successCount,
      tickets_failed: errorCount,
      tickets_skipped: skippedTickets.length,
      skipped_reasons: skippedTickets.length > 0 
        ? Object.entries(
            skippedTickets.reduce((acc, t) => {
              acc[t.reason] = (acc[t.reason] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([reason, count]) => `${reason}: ${count}`)
        : []
    })

  } catch (error: any) {
    console.error('Error in ticket import:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Unknown error",
      tickets: []
    }, { status: 500 })
  }
} 