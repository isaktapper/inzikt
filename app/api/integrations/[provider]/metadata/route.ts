import { NextResponse } from 'next/server';
import { adminSupabase } from '@/utils/supabase/server';

// Define the interface for groups and statuses
interface Group {
  id: string;
  name: string;
}

interface Status {
  id: string;
  name: string;
}

// This API route will fetch the groups and statuses from the integration provider
export async function GET(
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
    
    const provider = params.provider;
    
    if (!provider || !['zendesk', 'intercom', 'freshdesk'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }
    
    // Get the connection for this provider
    const { data: connection } = await adminSupabase
      .from('integration_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();
    
    if (!connection) {
      return NextResponse.json(
        { error: `No ${provider} connection found. Please connect first.` },
        { status: 404 }
      );
    }

    let groups: Group[] = [];
    let statuses: Status[] = [];
    
    if (provider === 'zendesk') {
      // Fetch groups from Zendesk API
      try {
        const { subdomain, email, api_token } = connection.credentials;
        
        // Base64 encode the auth credentials
        const auth = Buffer.from(`${email}/token:${api_token}`).toString('base64');
        
        // Fetch groups (actually "groups" in Zendesk are "groups")
        const groupsResponse = await fetch(`https://${subdomain}.zendesk.com/api/v2/groups.json`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });
        
        const groupsData = await groupsResponse.json();
        
        if (groupsResponse.ok && groupsData.groups) {
          groups = groupsData.groups.map((group: any) => ({
            id: group.id.toString(),
            name: group.name
          }));
        } else {
          console.error('Error fetching Zendesk groups:', groupsData);
        }
        
        // Fetch ticket statuses (which are predefined in Zendesk)
        statuses = [
          { id: 'new', name: 'New' },
          { id: 'open', name: 'Open' },
          { id: 'pending', name: 'Pending' },
          { id: 'hold', name: 'Hold' },
          { id: 'solved', name: 'Solved' },
          { id: 'closed', name: 'Closed' }
        ];
        
        // Alternatively, you could fetch ticket fields to get custom statuses:
        // const ticketFieldsResponse = await fetch(`https://${subdomain}.zendesk.com/api/v2/ticket_fields.json`...
        
      } catch (zendeskError) {
        console.error('Error fetching from Zendesk API:', zendeskError);
        return NextResponse.json(
          { error: 'Failed to fetch Zendesk metadata' },
          { status: 500 }
        );
      }
    } else if (provider === 'intercom') {
      // Fetch teams from Intercom API
      try {
        const { access_token } = connection.credentials;
        
        // Fetch teams (equivalent to groups)
        const teamsResponse = await fetch('https://api.intercom.io/teams', {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Accept': 'application/json'
          }
        });
        
        const teamsData = await teamsResponse.json();
        
        if (teamsResponse.ok && teamsData.teams) {
          groups = teamsData.teams.map((team: any) => ({
            id: team.id,
            name: team.name
          }));
        } else {
          console.error('Error fetching Intercom teams:', teamsData);
        }
        
        // Intercom conversation statuses
        statuses = [
          { id: 'open', name: 'Open' },
          { id: 'closed', name: 'Closed' },
          { id: 'snoozed', name: 'Snoozed' }
        ];
        
      } catch (intercomError) {
        console.error('Error fetching from Intercom API:', intercomError);
        return NextResponse.json(
          { error: 'Failed to fetch Intercom metadata' },
          { status: 500 }
        );
      }
    } else if (provider === 'freshdesk') {
      // Fetch groups from Freshdesk API
      try {
        const { subdomain, api_key } = connection.credentials;
        
        // Base64 encode the auth credentials
        const auth = Buffer.from(`${api_key}:X`).toString('base64');
        
        // Fetch groups
        const groupsResponse = await fetch(`https://${subdomain}.freshdesk.com/api/v2/groups`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });
        
        const groupsData = await groupsResponse.json();
        
        if (groupsResponse.ok && Array.isArray(groupsData)) {
          groups = groupsData.map((group: any) => ({
            id: group.id.toString(),
            name: group.name
          }));
        } else {
          console.error('Error fetching Freshdesk groups:', groupsData);
        }
        
        // Fetch ticket statuses
        const statusesResponse = await fetch(`https://${subdomain}.freshdesk.com/api/v2/ticket_fields`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });
        
        const statusesData = await statusesResponse.json();
        
        if (statusesResponse.ok && Array.isArray(statusesData)) {
          // Look for the status field
          const statusField = statusesData.find((field: any) => field.name === 'status');
          if (statusField && statusField.choices) {
            statuses = Object.entries(statusField.choices).map(([id, name]: [string, any]) => ({
              id,
              name: name.toString()
            }));
          } else {
            // Default statuses
            statuses = [
              { id: '2', name: 'Open' },
              { id: '3', name: 'Pending' },
              { id: '4', name: 'Resolved' },
              { id: '5', name: 'Closed' }
            ];
          }
        } else {
          console.error('Error fetching Freshdesk statuses:', statusesData);
          // Default statuses
          statuses = [
            { id: '2', name: 'Open' },
            { id: '3', name: 'Pending' },
            { id: '4', name: 'Resolved' },
            { id: '5', name: 'Closed' }
          ];
        }
        
      } catch (freshdeskError) {
        console.error('Error fetching from Freshdesk API:', freshdeskError);
        return NextResponse.json(
          { error: 'Failed to fetch Freshdesk metadata' },
          { status: 500 }
        );
      }
    }
    
    // Return the metadata
    return NextResponse.json({
      provider,
      groups,
      statuses
    });
    
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
} 