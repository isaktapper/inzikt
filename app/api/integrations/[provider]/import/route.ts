import { NextResponse } from 'next/server';
import { adminSupabase } from '@/utils/supabase/server';

// Utility function to add delay between API requests
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface ImportConfig {
  selectedGroups: string[];
  selectedStatuses: string[];
  daysBack: number;
  importFrequency: 'manual' | 'daily' | 'weekly' | 'hourly';
}

interface FreshdeskTicket {
  id: number;
  subject: string;
  description_text?: string;
  status: number;
  priority: number;
  requester_id?: number;
  responder_id?: number;
  group_id?: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  [key: string]: any; // Allow other properties
}

interface ConversationComment {
  id: string | number;
  author_id?: string | number;
  author_name?: string;
  body?: string;
  html_body?: string;
  plain_body?: string;
  created_at?: string;
  attachments?: any[];
  [key: string]: any; // Allow other properties
}

// This API route will trigger the import from the integration provider
export async function POST(
  request: Request,
  { params }: { params: { provider: string } }
) {
  try {
    // Check if the user is authenticated
    const headersList = request.headers;
    const authorization = headersList.get('authorization');
    let userId = null;
    
    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.split(' ')[1];
      const { data: tokenData, error: tokenError } = await adminSupabase.auth.getUser(token);
      
      if (tokenData?.user) {
        userId = tokenData.user.id;
        console.log('Found user from token:', userId);
      } else {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Safely get the provider parameter
    const provider = params?.provider;
    
    if (!provider || !['zendesk', 'intercom', 'freshdesk'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }
    
    // Get the request body with import configuration
    const { config } = await request.json() as { config: ImportConfig };
    
    if (!config) {
      return NextResponse.json(
        { error: 'Import configuration is required' },
        { status: 400 }
      );
    }
    
    // Get the connection for this provider
    let connection;
    
    if (provider === 'zendesk') {
      // For Zendesk, first check the zendesk_connections table
      const { data: zendeskConnection, error: zendeskError } = await adminSupabase
        .from('zendesk_connections')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (zendeskConnection) {
        connection = {
          provider: 'zendesk',
          credentials: {
            subdomain: zendeskConnection.subdomain,
            email: zendeskConnection.admin_email,
            api_token: zendeskConnection.api_token
          }
        };
      } else {
        // Fallback to the general connections table
        const { data: generalConnection } = await adminSupabase
          .from('integration_connections')
          .select('*')
          .eq('user_id', userId)
          .eq('provider', provider)
          .single();
          
        connection = generalConnection;
      }
    } else {
      // For other providers, use the general connections table
      const { data: generalConnection } = await adminSupabase
        .from('integration_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();
        
      connection = generalConnection;
    }
    
    if (!connection) {
      return NextResponse.json(
        { error: `No ${provider} connection found. Please connect first.` },
        { status: 404 }
      );
    }
    
    // No need to save the configuration here as it should already exist
    // Check if the configuration exists to avoid duplicate key errors
    const { data: existingConfig, error: configError } = await adminSupabase
      .from('integration_import_configs')
      .select('*')  // Get all fields, not just ID
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();
      
    // Use saved configuration from the database if available
    let importConfig: ImportConfig;
    if (existingConfig) {
      console.log(`Found existing import config in database for ${provider}:`, existingConfig);
      importConfig = {
        selectedGroups: existingConfig.selected_groups || [],
        selectedStatuses: existingConfig.selected_statuses || [],
        daysBack: existingConfig.days_back || 30,
        importFrequency: existingConfig.import_frequency || 'manual'
      };
    } else {
      // Fall back to the config from the request if no saved config exists
      console.log(`No existing import config found in database for ${provider}, using request config:`, config);
      importConfig = config;
    }
    
    // Actually import tickets based on the provider
    if (provider === 'zendesk') {
      // Create a job record in the database
      const { data: jobData, error: jobError } = await adminSupabase
        .from('import_jobs')
        .insert({
          user_id: userId,
          provider,
          status: 'pending',
          progress: 0,
          total_pages: 0,
          current_page: 0,
          total_tickets: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (jobError) {
        console.error('Error creating import job:', jobError);
        return NextResponse.json(
          { error: 'Failed to create import job' },
          { status: 500 }
        );
      }
      
      const jobId = jobData.id;
      
      // Return success response with job ID immediately
      const response = NextResponse.json({
        success: true,
        jobId: jobId,
        message: `Import from ${provider} started in background. This may take a few minutes.`,
        importDetails: {
          provider,
          daysBack: importConfig.daysBack,
          selectedGroups: importConfig.selectedGroups.length,
          selectedStatuses: importConfig.selectedStatuses.length
        }
      });
      
      // Start the background process after the response has been sent
      // This is a proper way to handle background processing in Next.js API routes
      const runBackgroundProcess = async () => {
        console.log("✅ Background process started for job:", jobId);
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Small initial delay to ensure response is sent
          
          // Update job status to running
          await adminSupabase
            .from('import_jobs')
            .update({
              status: 'running',
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId);
          
          // Calculate date for filtering tickets
          const daysAgo = new Date();
          daysAgo.setDate(daysAgo.getDate() - importConfig.daysBack);
          
          // Convert to UNIX timestamp in seconds for the Zendesk API
          const startTime = Math.floor(daysAgo.getTime() / 1000);
          
          // Base64 encode the auth credentials for Zendesk
          const auth = Buffer.from(`${connection.credentials.email}/token:${connection.credentials.api_token}`).toString('base64');
          
          // Initialize an array to collect all tickets
          let allTickets: any[] = [];
          
          // Prepare headers for Zendesk API calls
          const headers = {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          };
          
          console.log(`Starting Zendesk incremental ticket import from timestamp: ${startTime}`);
          
          // Start with the initial URL
          let nextUrl = `https://${connection.credentials.subdomain}.zendesk.com/api/v2/incremental/tickets.json?start_time=${startTime}`;
          
          // Track progress
          let pageCount = 0;
          let totalPages = 0; // Will estimate this after first page
          let totalTicketsFound = 0;
          let previousStartTime = null; // Track previous start_time to detect loops
          
          // Loop through all pages
          while (nextUrl) {
            pageCount++;
            console.log(`Fetching Zendesk tickets from: ${nextUrl} (Page ${pageCount})`);
            
            // Check for repeating start_time to avoid infinite loops
            const urlObj = new URL(nextUrl);
            const currentStartTime = urlObj.searchParams.get('start_time');
            if (previousStartTime && currentStartTime === previousStartTime) {
              console.log('Detected repeating start_time in next_page – breaking to avoid infinite loop.');
              break; // Break the loop immediately
            }
            previousStartTime = currentStartTime;
            
            try {
              // Fetch tickets from Zendesk with retry logic for rate limits
              let ticketsResponse;
              let ticketsData;
              let retryCount = 0;
              const maxRetries = 5;
              let retryDelay = 10000; // Start with 10 seconds delay
              
              while (retryCount <= maxRetries) {
                ticketsResponse = await fetch(nextUrl, { headers });
                
                if (ticketsResponse.ok) {
                  // Success, parse the data and break out of retry loop
                  ticketsData = await ticketsResponse.json();
                  break;
                } else if (ticketsResponse.status === 429) {
                  // Rate limited - need to back off and retry
                  const errorData = await ticketsResponse.json();
                  
                  // Get Retry-After header if available
                  const retryAfter = ticketsResponse.headers.get('Retry-After');
                  let waitTime = retryDelay;
                  
                  if (retryAfter) {
                    // Retry-After header value is in seconds, convert to milliseconds
                    waitTime = parseInt(retryAfter, 10) * 1000;
                    console.log(`Zendesk provided Retry-After header: ${retryAfter}s (${waitTime}ms)`);
                  }
                  
                  // Update job with rate limit info
                  await adminSupabase
                    .from('import_jobs')
                    .update({
                      status: 'running',
                      progress: totalPages > 0 ? Math.min(Math.floor((pageCount / totalPages) * 100), 99) : Math.min(pageCount * 5, 99),
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', jobId);
                  
                  retryCount++;
                  
                  console.log(`Rate limited by Zendesk (429). Retry ${retryCount}/${maxRetries} after ${waitTime}ms delay`);
                  
                  if (retryCount <= maxRetries) {
                    // Wait and then retry with specified delay or exponential backoff
                    await delay(waitTime);
                    retryDelay *= 2; // Exponential backoff for next retry if needed
                  } else {
                    console.error(`Max retries (${maxRetries}) exceeded for page ${pageCount}`);
                    throw new Error(`Zendesk rate limit exceeded after ${maxRetries} retries`);
                  }
                } else {
                  // Other error - throw normally
                  const errorData = await ticketsResponse.json();
                  console.error('Error fetching tickets from Zendesk:', errorData);
                  throw new Error(`Failed to fetch tickets from Zendesk: ${errorData.error || ticketsResponse.statusText}`);
                }
              }
              
              // At this point we have successfully fetched the data
              const tickets = ticketsData.tickets || [];
              totalTicketsFound += tickets.length;
              
              // If this is the first page, estimate total pages based on count and end_time
              if (pageCount === 1 && ticketsData.end_time && ticketsData.count > 0) {
                // Rough estimate of total pages based on tickets per page and time span
                const ticketsPerPage = tickets.length;
                if (ticketsPerPage > 0) {
                  totalPages = Math.ceil(ticketsData.count / ticketsPerPage);
                  
                  // Update job with estimated total pages
                  await adminSupabase
                    .from('import_jobs')
                    .update({
                      total_pages: totalPages,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', jobId);
                }
              }
              
              // Get the next page URL or null if we're done
              nextUrl = ticketsData.next_page;
              
              console.log(`Retrieved ${tickets.length} tickets from Zendesk, next page: ${nextUrl || 'none'}`);
              
              // Apply filters if needed
              let filteredTickets = tickets;
              
              // Filter by status if selected
              if (importConfig.selectedStatuses.length > 0) {
                filteredTickets = filteredTickets.filter((ticket: any) => 
                  importConfig.selectedStatuses.includes(ticket.status)
                );
              }
              
              // Filter by group if selected
              if (importConfig.selectedGroups.length > 0) {
                const groupIds = importConfig.selectedGroups.map(g => parseInt(g));
                filteredTickets = filteredTickets.filter((ticket: any) => 
                  ticket.group_id && groupIds.includes(ticket.group_id)
                );
              }
              
              console.log(`After filtering: ${filteredTickets.length} tickets remain`);
              
              // Add filtered tickets to our collection
              allTickets = [...allTickets, ...filteredTickets];
              
              // Update job progress every 10 pages or when we have a better total_pages estimate
              if (pageCount % 10 === 0 || !nextUrl) {
                // Use only 0-50% range for the pagination phase 
                const progress = totalPages > 0 
                  ? Math.min(Math.floor((pageCount / totalPages) * 50), 50) 
                  : Math.min(pageCount * 2, 50);
                
                await adminSupabase
                  .from('import_jobs')
                  .update({
                    status: 'running',
                    progress: progress,
                    current_page: pageCount,
                    total_tickets: allTickets.length,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', jobId);
                
                console.log(`Job ${jobId} progress updated: ${progress}%, Page ${pageCount}/${totalPages || '?'}, Tickets: ${allTickets.length}`);
              }
              
              // If we have no next page, break out of the loop
              if (!nextUrl) {
                break;
              }
              
              // Add a delay between requests to avoid rate limiting
              console.log(`Waiting 8000ms before next page (to avoid rate limits)`);
              await delay(8000); // Use 8 seconds between each paginated request to stay under Zendesk's 10 requests/minute limit
            } catch (pageError) {
              console.error(`Error on page ${pageCount}:`, pageError);
              
              // Update job with error but continue processing
              await adminSupabase
                .from('import_jobs')
                .update({
                  updated_at: new Date().toISOString(),
                  // Don't set to failed yet, just log the error
                })
                .eq('id', jobId);
              
              // Break out of the loop if we've had a critical error
              if (!nextUrl) {
                break;
              }
              
              // Wait a bit longer before trying the next URL to ensure we don't keep hitting rate limits
              await delay(10000);
            }
          }
          
          console.log(`Total tickets retrieved from Zendesk after pagination: ${allTickets.length}`);
          
          // Update job before processing tickets
          await adminSupabase
            .from('import_jobs')
            .update({
              progress: 50, // 50% - processing tickets starts
              current_page: pageCount,
              total_pages: totalPages || pageCount,
              total_tickets: allTickets.length,
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId);
            
          console.log("🐞 All tickets before processing:", allTickets.length);
          console.log("First ticket sample:", allTickets.length > 0 ? JSON.stringify(allTickets[0], null, 2).substring(0, 500) + '...' : 'No tickets');
          
          // Process each ticket and add conversation data
          const processedTickets = [];
          
          try {
            for (let i = 0; i < allTickets.length; i++) {
              const ticket = allTickets[i];
              try {
                console.log(`Starting to process ticket ${ticket.id} (${i+1}/${allTickets.length})`);
                
                // Update progress every 10 tickets or when at specific percentage marks
                if (i % 10 === 0 || i === allTickets.length - 1) {
                  // Calculate progress from 50% to 99% based on ticket processing
                  const processingProgress = Math.floor(50 + ((i / allTickets.length) * 49));
                  
                  await adminSupabase
                    .from('import_jobs')
                    .update({
                      progress: processingProgress,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', jobId);
                }
                
                // Fetch conversation/comments for this ticket
                const commentsUrl = `https://${connection.credentials.subdomain}.zendesk.com/api/v2/tickets/${ticket.id}/comments.json`;
                const commentsResponse = await fetch(commentsUrl, {
                  headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                let conversation: ConversationComment[] = [];
                
                if (commentsResponse.ok) {
                  const commentsData = await commentsResponse.json();
                  if (commentsData.comments && Array.isArray(commentsData.comments)) {
                    conversation = commentsData.comments.map((comment: any) => ({
                      id: comment.id,
                      author_id: comment.author_id,
                      author_name: comment.author_name || 'Unknown',
                      body: comment.body || comment.html_body || '',
                      html_body: comment.html_body || '',
                      plain_body: comment.plain_body || '',
                      created_at: comment.created_at,
                      attachments: comment.attachments || []
                    }));
                  }
                } else {
                  console.error(`Failed to fetch comments for ticket ${ticket.id} - Status: ${commentsResponse.status}`);
                  if (commentsResponse.status === 429) {
                    // Handle rate limit for comments
                    console.log("Rate limited when fetching comments. Waiting 30 seconds...");
                    await delay(30000);
                  }
                }
                
                await delay(150); // Throttle after fetching comments
                
                // Extract ticket group name if it exists
                let groupName = null;
                if (ticket.group_id) {
                  const groupResponse = await fetch(`https://${connection.credentials.subdomain}.zendesk.com/api/v2/groups/${ticket.group_id}.json`, {
                    headers: {
                      'Authorization': `Basic ${auth}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (groupResponse.ok) {
                    const groupData = await groupResponse.json();
                    groupName = groupData.group.name;
                  } else if (groupResponse.status === 429) {
                    // Handle rate limit for groups
                    console.log("Rate limited when fetching group. Waiting 30 seconds...");
                    await delay(30000);
                  }
                }
                
                await delay(150); // Throttle after fetching group details
                
                // Fetch requester details if we only have the ID
                let requesterName = '';
                let requesterEmail = '';
                if (ticket.requester_id && (!ticket.requester || !ticket.requester.name)) {
                  try {
                    const requesterResponse = await fetch(`https://${connection.credentials.subdomain}.zendesk.com/api/v2/users/${ticket.requester_id}.json`, {
                      headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json'
                      }
                    });
                    
                    if (requesterResponse.ok) {
                      const requesterData = await requesterResponse.json();
                      requesterName = requesterData.user.name || '';
                      requesterEmail = requesterData.user.email || '';
                    } else if (requesterResponse.status === 429) {
                      // Handle rate limit for requester
                      console.log("Rate limited when fetching requester. Waiting 30 seconds...");
                      await delay(30000);
                    }
                  } catch (userError) {
                    console.error(`Error fetching requester details for ticket ${ticket.id}:`, userError);
                  }
                } else if (ticket.requester) {
                  requesterName = ticket.requester.name || '';
                  requesterEmail = ticket.requester.email || '';
                }
                
                await delay(150); // Throttle after fetching requester details
                
                // Fetch assignee details if we only have the ID
                let assigneeName = null;
                if (ticket.assignee_id && (!ticket.assignee || !ticket.assignee.name)) {
                  try {
                    const assigneeResponse = await fetch(`https://${connection.credentials.subdomain}.zendesk.com/api/v2/users/${ticket.assignee_id}.json`, {
                      headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json'
                      }
                    });
                    
                    if (assigneeResponse.ok) {
                      const assigneeData = await assigneeResponse.json();
                      assigneeName = assigneeData.user.name || null;
                    } else if (assigneeResponse.status === 429) {
                      // Handle rate limit for assignee
                      console.log("Rate limited when fetching assignee. Waiting 30 seconds...");
                      await delay(30000);
                    }
                  } catch (userError) {
                    console.error(`Error fetching assignee details for ticket ${ticket.id}:`, userError);
                  }
                } else if (ticket.assignee) {
                  assigneeName = ticket.assignee.name || null;
                }
                
                // Create a processed ticket object with conversation data
                const processedTicket = {
                  zendesk_id: ticket.id.toString(),
                  user_id: userId,
                  subject: ticket.subject || '',
                  description: ticket.description || '',
                  status: ticket.status || '',
                  priority: ticket.priority || '',
                  requester: requesterName,
                  requester_email: requesterEmail,
                  assignee: assigneeName,
                  group_name: groupName,
                  tags: ticket.tags || [],
                  conversation: conversation,
                  source: 'zendesk',
                  source_url: `https://${connection.credentials.subdomain}.zendesk.com/agent/tickets/${ticket.id}`,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  zendesk_created_at: ticket.created_at,
                  zendesk_updated_at: ticket.updated_at
                };
                
                // Log the ticket data to debug
                console.log(`Processed ticket data for ticket ID ${ticket.id}:`, {
                  subject: processedTicket.subject,
                  requester: processedTicket.requester,
                  requester_email: processedTicket.requester_email,
                  assignee: processedTicket.assignee,
                });
                
                processedTickets.push(processedTicket);
              } catch (ticketError) {
                console.error(`Error processing ticket ${ticket?.id}:`, ticketError);
                // Continue with the next ticket
              }
            }
          } catch (ticketsLoopError) {
            console.error('🛑 Error in tickets processing loop:', ticketsLoopError);
          }
          
          console.log(`Finished processing ${processedTickets.length} tickets, now storing in database...`);
          
          // Store the processed tickets in the database
          if (processedTickets.length > 0) {
            // First check if a tickets table exists
            const { error: schemaError } = await adminSupabase
              .from('tickets')
              .select('count')
              .limit(1);
              
            if (schemaError && schemaError.code === '42P01') {
              // Table doesn't exist, create it
              console.error('Tickets table does not exist. You need to create it first.');
              
              // Update job status to failed
              await adminSupabase
                .from('import_jobs')
                .update({
                  status: 'failed',
                  updated_at: new Date().toISOString()
                })
                .eq('id', jobId);
                
              return; // Exit the background process
            }
            
            // Store tickets in batches to avoid exceeding request size limits
            const batchSize = 20;
            for (let i = 0; i < processedTickets.length; i += batchSize) {
              const batch = processedTickets.slice(i, i + batchSize);
              
              // Check if tickets already exist and update them
              for (const ticket of batch) {
                try {
                  // For Freshdesk tickets, we need to check with the prefix
                  const freshdeskId = `freshdesk_${ticket.zendesk_id}`;
                  const { data: existingTicket } = await adminSupabase
                    .from('tickets')
                    .select('id')
                    .eq('zendesk_id', ticket.zendesk_id)
                    .eq('user_id', userId)
                    .single();
                  
                  if (existingTicket) {
                    // Update existing ticket
                    const { error: updateError } = await adminSupabase
                      .from('tickets')
                      .update({
                        ...ticket,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', existingTicket.id);
                    
                    if (updateError) {
                      console.error(`Error updating ticket ${ticket.zendesk_id}:`, updateError);
                    }
                  } else {
                    // Insert new ticket
                    const { error: insertError } = await adminSupabase
                      .from('tickets')
                      .insert(ticket);
                    
                    if (insertError) {
                      console.error(`Error inserting ticket ${ticket.zendesk_id}:`, insertError);
                    }
                  }
                } catch (ticketError) {
                  console.error(`Error processing ticket ${ticket.zendesk_id} for database:`, ticketError);
                }
              }
            }
          }
          
          // Save a record of the import
          const { error: importLogError } = await adminSupabase
            .from('integration_import_logs')
            .insert({
              user_id: userId,
              provider,
              status: 'completed',
              details: {
                daysBack: importConfig.daysBack,
                selectedGroups: importConfig.selectedGroups,
                selectedStatuses: importConfig.selectedStatuses,
                ticketsImported: processedTickets.length
              }
            });
          
          if (importLogError) {
            // Log the error but don't fail the request
            console.error('Error logging import:', importLogError);
          }
          
          // Update job status to completed
          await adminSupabase
            .from('import_jobs')
            .update({
              status: 'completed',
              progress: 100,
              current_page: pageCount,
              total_pages: totalPages || pageCount,
              total_tickets: processedTickets.length,
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId);
          
          console.log(`Zendesk import job ${jobId} completed successfully with ${processedTickets.length} tickets`);
          
        } catch (importError) {
          console.error('Error during background import:', importError);
          
          // Update job status to failed
          await adminSupabase
            .from('import_jobs')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId);
        }
      };
      
      // Fire and forget - we don't await this
      runBackgroundProcess().catch(err => {
        console.error('Unhandled error in background process:', err);
      });
      
      // Return the response we prepared earlier
      return response;
    } else if (provider === 'freshdesk') {
      // Calculate date for filtering tickets
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - importConfig.daysBack);
      const startDate = daysAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      // Prepare the Freshdesk API URL with appropriate filters
      const { subdomain, api_key } = connection.credentials;
      
      // Base64 encode the auth credentials for Freshdesk
      const auth = Buffer.from(`${api_key}:X`).toString('base64');
      
      console.log(`Fetching tickets from Freshdesk subdomain: ${subdomain}`);
      
      // API endpoints to get tickets
      const ticketsUrl = `https://${subdomain}.freshdesk.com/api/v2/tickets?updated_since=${startDate}`;
      
      // Add filter for selected groups if any
      let filteredTickets = [];
      
      // Fetch tickets from Freshdesk
      const ticketsResponse = await fetch(ticketsUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!ticketsResponse.ok) {
        let errorMessage = ticketsResponse.statusText;
        try {
          const errorData = await ticketsResponse.json();
          console.error('Error fetching tickets from Freshdesk:', errorData);
          errorMessage = JSON.stringify(errorData);
        } catch (e) {
          // If we can't parse JSON, just use the status text
        }
        throw new Error(`Failed to fetch tickets from Freshdesk: ${errorMessage}`);
      }
      
      const tickets = await ticketsResponse.json();
      
      console.log(`Retrieved ${tickets.length} tickets from Freshdesk`);
      
      // Filter tickets by group if needed
      if (importConfig.selectedGroups.length > 0) {
        const groupIds = importConfig.selectedGroups.map(g => parseInt(g));
        filteredTickets = tickets.filter((ticket: FreshdeskTicket) => 
          ticket.group_id && groupIds.includes(ticket.group_id)
        );
        console.log(`Filtered to ${filteredTickets.length} tickets in selected groups`);
      } else {
        filteredTickets = tickets;
      }
      
      // Filter tickets by status if needed
      if (importConfig.selectedStatuses.length > 0) {
        const statusIds = importConfig.selectedStatuses.map(s => parseInt(s));
        filteredTickets = filteredTickets.filter((ticket: FreshdeskTicket) => 
          ticket.status && statusIds.includes(ticket.status)
        );
        console.log(`Filtered to ${filteredTickets.length} tickets with selected statuses`);
      }
      
      // Process each ticket and add conversation data
      const processedTickets = [];
      
      for (const ticket of filteredTickets as FreshdeskTicket[]) {
        try {
          // First, get detailed ticket data to ensure we have the full description
          const ticketDetailUrl = `https://${subdomain}.freshdesk.com/api/v2/tickets/${ticket.id}`;
          const ticketDetailResponse = await fetch(ticketDetailUrl, {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            }
          });
          
          let ticketDetail = ticket;
          let initialDescription = '';
          
          if (ticketDetailResponse.ok) {
            ticketDetail = await ticketDetailResponse.json();
            initialDescription = ticketDetail.description_text || ticketDetail.description || '';
          } else {
            console.error(`Failed to fetch ticket details for ticket ${ticket.id}`);
          }
          
          // Fetch conversation/comments for this ticket
          const commentsUrl = `https://${subdomain}.freshdesk.com/api/v2/tickets/${ticket.id}/conversations`;
          const commentsResponse = await fetch(commentsUrl, {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Initialize conversation array with the initial ticket description as the first message
          let conversation = [];
          
          // Add initial description as first message in conversation
          if (initialDescription) {
            conversation.push({
              id: `initial_${ticket.id}`,
              body_text: initialDescription,
              body: initialDescription,
              user_id: ticket.requester_id,
              incoming: true, // From customer
              private: false,
              created_at: ticket.created_at,
              is_initial_description: true
            });
          }
          
          // Add all replies/conversations
          if (commentsResponse.ok) {
            const rawConversation = await commentsResponse.json();
            
            if (Array.isArray(rawConversation)) {
              // Skip private notes and format the conversation correctly
              const replies = rawConversation
                .filter(reply => !reply.private)
                .map(reply => ({
                  id: reply.id,
                  body_text: reply.body_text || reply.body || '',
                  body: reply.body || reply.body_text || '',
                  user_id: reply.user_id,
                  // In Freshdesk, messages from agents include "support_email", while customer messages don't
                  incoming: !reply.support_email, 
                  private: false,
                  created_at: reply.created_at,
                  is_initial_description: false
                }));
              
              // Add replies to conversation array
              conversation = [...conversation, ...replies];
              
              // Sort conversation by created_at
              conversation.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            }
          } else {
            console.error(`Failed to fetch comments for ticket ${ticket.id}`);
          }
          
          // Fetch requester details
          let requesterName = '';
          let requesterEmail = '';
          
          if (ticket.requester_id) {
            const requesterUrl = `https://${subdomain}.freshdesk.com/api/v2/contacts/${ticket.requester_id}`;
            const requesterResponse = await fetch(requesterUrl, {
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (requesterResponse.ok) {
              const requesterData = await requesterResponse.json();
              requesterName = requesterData.name || '';
              requesterEmail = requesterData.email || '';
            } else {
              console.error(`Failed to fetch requester details for ticket ${ticket.id}`);
            }
          }
          
          // Get group name if available
          let groupName = null;
          if (ticket.group_id) {
            // Fetch group details
            const groupUrl = `https://${subdomain}.freshdesk.com/api/v2/groups/${ticket.group_id}`;
            const groupResponse = await fetch(groupUrl, {
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (groupResponse.ok) {
              const groupData = await groupResponse.json();
              groupName = groupData.name || null;
            }
          }
          
          // Fetch assignee details if assigned
          let assigneeName = null;
          if (ticket.responder_id) {
            const assigneeUrl = `https://${subdomain}.freshdesk.com/api/v2/agents/${ticket.responder_id}`;
            const assigneeResponse = await fetch(assigneeUrl, {
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (assigneeResponse.ok) {
              const assigneeData = await assigneeResponse.json();
              assigneeName = assigneeData.contact ? assigneeData.contact.name : null;
            }
          }
          
          // Map priority from numbers to text (Freshdesk uses 1-4)
          let priorityText = 'normal';
          switch (ticket.priority) {
            case 1: priorityText = 'low'; break;
            case 2: priorityText = 'normal'; break;
            case 3: priorityText = 'high'; break;
            case 4: priorityText = 'urgent'; break;
          }
          
          // Map status from numbers to text (Freshdesk uses 2-5)
          let statusText = 'open';
          switch (ticket.status) {
            case 2: statusText = 'open'; break;
            case 3: statusText = 'pending'; break;
            case 4: statusText = 'resolved'; break;
            case 5: statusText = 'closed'; break;
          }
          
          // Create a processed ticket object with conversation data
          const processedTicket = {
            zendesk_id: `freshdesk_${ticket.id}`, // Prefix to distinguish from Zendesk tickets
            user_id: userId,
            subject: ticket.subject || '',
            description: ticketDetail.description_text || ticketDetail.description || '',
            status: statusText,
            priority: priorityText,
            requester: requesterName,
            requester_email: requesterEmail,
            requester_id: ticket.requester_id?.toString(),
            assignee: assigneeName,
            assignee_id: ticket.responder_id?.toString(),
            group_name: groupName,
            group_id: ticket.group_id?.toString(),
            tags: ticket.tags || [],
            conversation: conversation,
            source: 'freshdesk',
            source_url: `https://${subdomain}.freshdesk.com/a/${subdomain}/tickets/${ticket.id}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            zendesk_created_at: ticket.created_at,
            zendesk_updated_at: ticket.updated_at
          };
          
          // Log the ticket data to debug
          console.log(`Processed Freshdesk ticket ${ticket.id}: "${ticket.subject}" with ${conversation.length} messages`);
          
          processedTickets.push(processedTicket);
        } catch (ticketError) {
          console.error(`Error processing Freshdesk ticket ${ticket.id}:`, ticketError);
          // Continue with the next ticket
        }
      }
      
      // Store the processed tickets in the database
      if (processedTickets.length > 0) {
        // Log the first ticket for debugging
        console.log('First Freshdesk ticket structure:', JSON.stringify(processedTickets[0], null, 2));
        
        // First check if a tickets table exists
        const { data: tableInfo, error: schemaError } = await adminSupabase
          .from('tickets')
          .select('count')
          .limit(1);
          
        if (schemaError) {
          console.error('Error checking tickets table:', schemaError);
          
          if (schemaError.code === '42P01') {
            // Table doesn't exist, create it
            console.error('Tickets table does not exist. You need to create it first.');
            return NextResponse.json(
              { error: 'Tickets table does not exist. Please create it first.' },
              { status: 500 }
            );
          }
        } else {
          console.log('Tickets table info:', tableInfo);
        }
        
        // Store tickets in batches to avoid exceeding request size limits
        const batchSize = 20;
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < processedTickets.length; i += batchSize) {
          const batch = processedTickets.slice(i, i + batchSize);
          console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(processedTickets.length/batchSize)} (${batch.length} tickets)`);
          
          // Check if tickets already exist and update them
          for (const ticket of batch) {
            try {
              // For Freshdesk tickets, the ID is prefixed with "freshdesk_"
              const { data: existingTicket } = await adminSupabase
                .from('tickets')
                .select('id')
                .eq('zendesk_id', ticket.zendesk_id) // This is already prefixed with "freshdesk_" in the processedTicket
                .eq('user_id', userId)
                .maybeSingle(); // Use maybeSingle instead of single to avoid error when no match
                
              console.log(`Checking for existing ticket: ${ticket.zendesk_id}, found:`, existingTicket);
                
              if (existingTicket) {
                // Update existing ticket
                console.log(`Updating existing ticket ${ticket.zendesk_id} with ID ${existingTicket.id}`);
                const { error: updateError } = await adminSupabase
                  .from('tickets')
                  .update({
                    ...ticket,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingTicket.id);
                  
                if (updateError) {
                  console.error(`Error updating ticket ${ticket.zendesk_id}:`, updateError);
                  console.error('Update error details:', updateError.details, updateError.message, updateError.hint);
                  errorCount++;
                } else {
                  console.log(`Successfully updated ticket: ${ticket.subject}`);
                  successCount++;
                }
              } else {
                // Insert new ticket
                console.log(`Inserting new ticket: ${ticket.subject} with ID ${ticket.zendesk_id}`);
                const { data: insertData, error: insertError } = await adminSupabase
                  .from('tickets')
                  .insert(ticket)
                  .select('id');
                  
                if (insertError) {
                  console.error(`Error inserting ticket ${ticket.zendesk_id}:`, insertError);
                  console.error('Insert error details:', insertError.details, insertError.message, insertError.hint);
                  errorCount++;
                } else {
                  console.log(`Successfully inserted ticket: ${ticket.subject} with ID ${insertData?.[0]?.id || 'unknown'}`);
                  successCount++;
                }
              }
            } catch (ticketError) {
              console.error(`Error processing ticket ${ticket.zendesk_id} for database:`, ticketError);
              errorCount++;
            }
          }
        }
        
        console.log(`Freshdesk import summary: ${successCount} tickets successfully processed, ${errorCount} failures`);
      }
      
      // Save a record of the import
      const { error: importLogError } = await adminSupabase
        .from('integration_import_logs')
        .insert({
          user_id: userId,
          provider,
          status: 'completed',
          details: {
            daysBack: importConfig.daysBack,
            selectedGroups: importConfig.selectedGroups,
            selectedStatuses: importConfig.selectedStatuses,
            ticketsImported: processedTickets.length,
            successCount: processedTickets.length
          },
          ticket_count: processedTickets.length
        });
      
      if (importLogError) {
        // Log the error but don't fail the request
        console.error('Error logging import:', importLogError);
      }
      
      // Return success
      return NextResponse.json({
        success: true,
        message: `Import from ${provider} completed successfully`,
        importDetails: {
          provider,
          daysBack: importConfig.daysBack,
          ticketsImported: processedTickets.length,
          selectedGroups: importConfig.selectedGroups.length,
          selectedStatuses: importConfig.selectedStatuses.length,
          successCount: processedTickets.length
        }
      });
    } else {
      // Handle other providers (placeholder for now)
      return NextResponse.json({
        success: true,
        message: `Import from ${provider} started successfully (simulated)`,
        importDetails: {
          provider,
          daysBack: importConfig.daysBack,
          selectedGroups: importConfig.selectedGroups.length,
          selectedStatuses: importConfig.selectedStatuses.length
        }
      });
    }
    
  } catch (error: any) {
    console.error('Error starting import:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start import' },
      { status: 500 }
    );
  }
} 