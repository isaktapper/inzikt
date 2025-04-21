import { cookies as getCookies } from 'next/headers';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { DashboardContent } from './components/DashboardContent';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch the current user
  const { data: { user } } = await supabase.auth.getUser();
  const firstName = user?.user_metadata?.full_name 
    ? user.user_metadata.full_name.split(' ')[0]
    : null;

  // ✅ Fetch from the view instead of doing a manual join
  const { data: tickets, error } = await supabase
    .from('tickets_with_analysis') // 👈 updated view name
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tickets:', error);
    return <div>Error loading dashboard data</div>;
  }
  
  // Log the first ticket to see its structure
  if (tickets && tickets.length > 0) {
    const sampleTicket = tickets[0];
    console.log('Sample ticket data structure:', sampleTicket);
    
    // Check for direct AI fields
    if (sampleTicket.aiSummary || sampleTicket.aiDescription || sampleTicket.aiTags) {
      console.log('Direct AI fields found:', {
        aiSummary: sampleTicket.aiSummary,
        aiDescription: sampleTicket.aiDescription,
        aiTags: sampleTicket.aiTags
      });
    }
    
    // Check for nested analysis structure
    if (sampleTicket.analysis) {
      console.log('Nested analysis structure found:', sampleTicket.analysis);
    }
  }

  // Check for Zendesk connection without redirecting
  const { data: connectionData } = await supabase
    .from('zendesk_connections')
    .select('zendesk_token, subdomain, api_key')
    .eq('user_id', user?.id)
    .single();

  const hasValidConnection = Boolean(
    connectionData &&
    connectionData.zendesk_token &&
    connectionData.subdomain &&
    connectionData.api_key
  );

  const cookieStore = await getCookies();
  const zendeskCookie = cookieStore.get('zendesk_token');
  const hasZendeskCookie = Boolean(zendeskCookie && zendeskCookie.value);

  // Only check if there's a valid connection in the zendesk_connections table
  const isZendeskConnected = Boolean(connectionData);
  const hasTickets = Array.isArray(tickets) && tickets.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <DashboardContent 
        initialTickets={tickets || []} 
        isZendeskConnected={isZendeskConnected}
        firstName={firstName}
      />
    </div>
  );
}
