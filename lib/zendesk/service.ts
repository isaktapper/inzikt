import { createClient } from '@supabase/supabase-js'

export interface ZendeskUser {
  id: number
  name: string
  email: string
}

interface ZendeskConnection {
  subdomain: string
  email: string
  api_token: string
  selected_groups?: string[]
  selected_statuses?: string[]
  max_tickets?: number
}

export class ZendeskService {
  private connection: ZendeskConnection
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  constructor(connection: ZendeskConnection) {
    this.connection = connection
  }

  private get baseUrl() {
    return `https://${this.connection.subdomain}.zendesk.com/api/v2`
  }

  private get authHeader(): string {
    const token = Buffer.from(`${this.connection.email}/token:${this.connection.api_token}`).toString('base64')
    return `Basic ${token}`
  }

  async testConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/users/me.json`, {
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
      })
      return res.ok
    } catch (err) {
      console.error('Connection test failed:', err)
      return false
    }
  }

  async fetchAgents(): Promise<ZendeskUser[]> {
    try {
      const res = await fetch(`${this.baseUrl}/users.json?role[]=agent&role[]=admin`, {
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) throw new Error(`Failed to fetch agents: ${res.statusText}`)
      const data = await res.json()
      return data.users as ZendeskUser[]
    } catch (err) {
      console.error('Error fetching agents:', err)
      return []
    }
  }

  async saveAgentsToSupabase(userId: string) {
    const agents = await this.fetchAgents()
    if (!agents.length) return

    const formatted = agents.map(agent => ({
      zendesk_user_id: agent.id,
      name: agent.name,
      email: agent.email,
      user_id: userId
    }))

    const { error } = await this.supabase
      .from('zendesk_agents')
      .upsert(formatted, {
        onConflict: 'zendesk_user_id,user_id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('❌ Failed to save agents:', error)
    } else {
      console.log(`✅ Saved ${formatted.length} agents to Supabase`)
    }
  }
  
  async fetchTickets() {
    try {
      // Build query URL based on connection settings
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString();
      
      // Prepare the Zendesk API URL with appropriate filters
      let queryUrl = `${this.baseUrl}/search.json?query=type:ticket created>=${startDate}`;
      
      // Add status filter if selected
      if (this.connection.selected_statuses && this.connection.selected_statuses.length > 0) {
        queryUrl += ` status:${this.connection.selected_statuses.join(' status:')}`;
      }
      
      // Add group filter if selected
      if (this.connection.selected_groups && this.connection.selected_groups.length > 0) {
        queryUrl += ` group:${this.connection.selected_groups.join(' group:')}`;
      }
      
      console.log(`Fetching tickets with query: ${queryUrl}`);
      
      const response = await fetch(queryUrl, {
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch tickets: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      const tickets = data.results || [];
      
      console.log(`Retrieved ${tickets.length} tickets from Zendesk API`);
      
      // Map tickets to our expected format
      const mappedTickets = await Promise.all(tickets.map(async (ticket: any) => {
        // Fetch conversation/comments for this ticket
        const commentsUrl = `${this.baseUrl}/tickets/${ticket.id}/comments.json`;
        const commentsResponse = await fetch(commentsUrl, {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json'
          }
        });
        
        let conversation = [];
        
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
        }
        
        return {
          zendesk_id: ticket.id,
          subject: ticket.subject,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          requester: ticket.requester ? ticket.requester.name : null,
          requester_email: ticket.requester ? ticket.requester.email : null,
          assignee: ticket.assignee ? ticket.assignee.name : null,
          group_name: ticket.group ? ticket.group.name : null,
          tags: ticket.tags || [],
          conversation,
          zendesk_created_at: ticket.created_at,
          zendesk_updated_at: ticket.updated_at
        };
      }));
      
      return mappedTickets;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }
  }
}
