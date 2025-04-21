import { NextResponse } from 'next/server';
import { adminSupabase } from '@/utils/supabase/server';
import {
  IntegrationCredentials,
  Provider,
  saveIntegrationConnection,
  deleteIntegrationConnection,
  getIntegrationConnection
} from '@/utils/integrations';

// Export this to make the API route revalidate on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper function to get user ID from request
async function getUserId(request: Request) {
  // Try to get auth from the Authorization header first
  const headersList = request.headers;
  const authorization = headersList.get('authorization');
  
  if (authorization && authorization.startsWith('Bearer ')) {
    const token = authorization.split(' ')[1];
    // Verify the token
    const { data: tokenData, error: tokenError } = await adminSupabase.auth.getUser(token);
    
    if (tokenData?.user) {
      console.log('Found user from token:', tokenData.user.id);
      return tokenData.user.id;
    } else {
      console.error('Token verification failed:', tokenError);
    }
  }
  
  // If no token, try to get session directly with admin client
  try {
    // Get session directly from Supabase using the admin client
    const { data, error } = await adminSupabase.auth.getSession();
    
    if (data.session && data.session.user) {
      console.log('Found user from admin session:', data.session.user.id);
      return data.session.user.id;
    } else if (error) {
      console.error('Error getting session from admin client:', error);
    }
  } catch (sessionError) {
    console.error('Error retrieving session:', sessionError);
  }
  
  return null;
}

export async function GET(request: Request) {
  try {
    const userId = await getUserId(request);
    
    // If no user ID found, return authentication error
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if a specific provider is requested
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider') as Provider | null;
    
    // Check if this is a test endpoint
    const isTest = url.searchParams.get('test') === 'true';
    if (isTest) {
      return NextResponse.json({
        success: true,
        message: 'Authentication test successful',
        user: {
          id: userId
        }
      });
    }
    
    // Log the request type
    console.log('Request type:', provider ? `Single provider: ${provider}` : 'All providers');
    
    if (provider) {
      // Get a specific connection
      if (!['zendesk', 'intercom', 'freshdesk'].includes(provider)) {
        return NextResponse.json(
          { error: 'Invalid provider' },
          { status: 400 }
        );
      }
      
      const connection = await getIntegrationConnection(userId, provider);
      console.log(`Connection for ${provider}:`, connection);
      
      return NextResponse.json({
        connection
      });
    } else {
      // Get connections for each provider
      try {
        const zendesk = await getIntegrationConnection(userId, 'zendesk');
        const intercom = await getIntegrationConnection(userId, 'intercom');
        const freshdesk = await getIntegrationConnection(userId, 'freshdesk');
        
        console.log('Retrieved connections:', { zendesk, intercom, freshdesk });
        
        return NextResponse.json({
          connections: {
            zendesk,
            intercom,
            freshdesk
          }
        });
      } catch (connectionError) {
        console.error('Error retrieving connections:', connectionError);
        throw connectionError;
      }
    }
  } catch (error) {
    console.error('Error fetching integration connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration connections', details: error },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get the integration credentials from the request body
    const integration = await request.json() as IntegrationCredentials;
    
    // Validate the provider
    if (!['zendesk', 'intercom', 'freshdesk'].includes(integration.provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }
    
    const userId = await getUserId(request);
    
    // If no user ID found, return authentication error
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Save the integration connection
    const connectionId = await saveIntegrationConnection(userId, integration);
    
    // Get the updated connection
    const connection = await getIntegrationConnection(userId, integration.provider);
    
    return NextResponse.json({
      id: connectionId,
      connection,
      success: true,
      message: `${integration.provider} integration connected successfully`
    });
    
  } catch (error) {
    console.error('Error saving integration connection:', error);
    return NextResponse.json(
      { error: 'Failed to save integration connection' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the provider from the query string
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider') as Provider | null;
    const deleteTickets = url.searchParams.get('deleteTickets') === 'true';
    
    if (!provider || !['zendesk', 'intercom', 'freshdesk'].includes(provider)) {
      return NextResponse.json(
        { error: 'Valid provider required' },
        { status: 400 }
      );
    }
    
    const userId = await getUserId(request);
    
    // If no user ID found, return authentication error
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Delete tickets associated with this provider if requested
    if (deleteTickets) {
      console.log(`Deleting ${provider} tickets for user ${userId}`);
      
      let ticketFilter = {};
      
      // For Freshdesk and Zendesk, we need to handle ID prefixes
      if (provider === 'freshdesk') {
        // Delete tickets where zendesk_id starts with 'freshdesk_'
        const { error } = await adminSupabase
          .from('tickets')
          .delete()
          .eq('user_id', userId)
          .like('zendesk_id', 'freshdesk_%');
          
        if (error) {
          console.error(`Error deleting ${provider} tickets:`, error);
        }
      } else if (provider === 'zendesk') {
        // Delete tickets where zendesk_id does not start with 'freshdesk_'
        // This assumes Zendesk tickets have numeric IDs without prefixes
        const { error } = await adminSupabase
          .from('tickets')
          .delete()
          .eq('user_id', userId)
          .not('zendesk_id', 'like', 'freshdesk_%');
          
        if (error) {
          console.error(`Error deleting ${provider} tickets:`, error);
        }
      }
    }
    
    // Delete the integration connection
    await deleteIntegrationConnection(userId, provider);
    
    return NextResponse.json({
      success: true,
      message: `${provider} integration disconnected successfully${deleteTickets ? ' and tickets deleted' : ''}`
    });
    
  } catch (error) {
    console.error('Error deleting integration connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete integration connection' },
      { status: 500 }
    );
  }
} 