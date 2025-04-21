import { createServerSupabaseClient } from './supabase/server';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

// Define Provider type
export type Provider = 'zendesk' | 'intercom' | 'freshdesk';

// Define credential types
export interface ZendeskCredentials {
  api_token: string;
  email: string;
  subdomain: string;
}

export interface IntercomCredentials {
  access_token: string;
  workspace_id?: string;
}

export interface FreshdeskCredentials {
  api_key: string;
  subdomain: string;
}

// Define result types
export interface ConnectionWithCredentials {
  id: string;
  provider: Provider;
  credentials: any;
  user_id: string;
}

export interface TypeOption {
  id: string | number;
  name: string;
}

export interface StatusOption {
  id: string | number;
  name: string;
}

export type IntegrationCredentials = 
  | { provider: 'zendesk', credentials: ZendeskCredentials }
  | { provider: 'intercom', credentials: IntercomCredentials }
  | { provider: 'freshdesk', credentials: FreshdeskCredentials };

/**
 * Save integration connection to database (server-side)
 */
export async function saveIntegrationConnection(
  userId: string,
  integration: IntegrationCredentials
) {
  const supabase = await createServerSupabaseClient();
  
  // Check if connection already exists
  const { data: existingConnection } = await supabase
    .from('integration_connections')
    .select('id')
    .eq('user_id', userId)
    .eq('provider', integration.provider)
    .single();
  
  if (existingConnection) {
    // Update existing connection
    const { error } = await supabase
      .from('integration_connections')
      .update({
        credentials: integration.credentials,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingConnection.id);
    
    if (error) throw error;
    return existingConnection.id;
  } else {
    // Create new connection
    const { data: newConnection, error } = await supabase
      .from('integration_connections')
      .insert({
        user_id: userId,
        provider: integration.provider,
        credentials: integration.credentials,
      })
      .select('id')
      .single();
    
    if (error) throw error;
    return newConnection?.id;
  }
}

/**
 * Save integration connection to database (client-side)
 * This function should be used via API routes, not directly in client components
 */
export async function saveIntegrationConnectionClient(
  integration: IntegrationCredentials
) {
  // Use fetch API to make a request to your API endpoint
  const response = await fetch('/api/integrations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(integration),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save integration');
  }
  
  const data = await response.json();
  return data.id;
}

/**
 * Get integration connection from database (server-side)
 */
export async function getIntegrationConnection(userId: string, provider: Provider) {
  const supabase = await createServerSupabaseClient();
  
  try {
    console.log(`Fetching ${provider} connection for user ${userId}`);
    
    const { data, error } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();
    
    if (error) {
      // Log details about the error
      console.error(`Error fetching ${provider} connection:`, error);
      
      // Only return null for "not found" errors
      if (error.code === 'PGRST116') {
        console.log(`No ${provider} connection found for user ${userId}`);
        return null;
      }
      
      // For other errors, throw so they can be handled
      throw error;
    }
    
    console.log(`Found ${provider} connection:`, data);
    return data;
  } catch (error) {
    console.error(`Unexpected error in getIntegrationConnection for ${provider}:`, error);
    throw error;
  }
}

/**
 * Get integration connection from database (client-side)
 * This function should be used via API routes, not directly in client components
 */
export async function getIntegrationConnectionClient(provider: Provider) {
  // Use fetch API to make a request to your API endpoint
  const response = await fetch(`/api/integrations?provider=${provider}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get integration');
  }
  
  const data = await response.json();
  return data.connection;
}

/**
 * Delete integration connection from database (server-side)
 */
export async function deleteIntegrationConnection(userId: string, provider: Provider) {
  const supabase = await createServerSupabaseClient();
  
  const { error } = await supabase
    .from('integration_connections')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider);
  
  if (error) throw error;
  return true;
}

/**
 * Delete integration connection from database (client-side)
 * This function should be used via API routes, not directly in client components
 */
export async function deleteIntegrationConnectionClient(provider: Provider) {
  // Use fetch API to make a request to your API endpoint
  const response = await fetch(`/api/integrations?provider=${provider}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete integration');
  }
  
  return true;
}

export async function getConnection(provider: string): Promise<ConnectionWithCredentials | null> {
  try {
    // Get supabase client
    const supabase = await createServerSupabaseClient();
    
    // Implementation would go here
    return null; // Placeholder return
  } catch (error) {
    console.error(`Error in getConnection for ${provider}:`, error);
    return null;
  }
}

export async function getTicketTypes(provider: string): Promise<TypeOption[]> {
  try {
    // First try to get from Supabase
    const supabase = await createServerSupabaseClient();
    
    // Implementation would go here
    return []; // Placeholder return
  } catch (error) {
    console.error(`Error in getTicketTypes for ${provider}:`, error);
    return [];
  }
}

export async function getTicketStatuses(provider: string): Promise<StatusOption[]> {
  try {
    // First try to get from Supabase
    const supabase = await createServerSupabaseClient();
    
    // Implementation would go here
    return []; // Placeholder return
  } catch (error) {
    console.error(`Unexpected error in getTicketStatuses for ${provider}:`, error);
    throw error;
  }
} 