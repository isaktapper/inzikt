'use client'

import { useState, useEffect, useRef } from 'react';
import { Link2, AlertCircle, Check, Loader2, MessagesSquare, MessageSquare, TicketIcon, RefreshCw, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Checkbox } from "@/components/ui/checkbox";
import { 
  deleteIntegrationConnectionClient,
  IntegrationCredentials, 
  Provider,
  ZendeskCredentials
} from '@/utils/integrations';
import { createClientSupabaseClient } from '@/utils/supabase/client';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImportProgressIndicator } from "@/components/ImportProgressIndicator";
import { useImportProgress } from "@/contexts/ImportProgressContext";

interface IntegrationConnection {
  provider: Provider;
  credentials: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface ZendeskConnection extends IntegrationConnection {
  credentials: {
    subdomain: string;
    admin_email: string;
    api_token: string;
  };
}

interface Group {
  id: string;
  name: string;
}

interface Status {
  id: string;
  name: string;
}

interface ImportConfig {
  selectedGroups: string[];
  selectedStatuses: string[];
  ticketCount: number;
  importFrequency: 'manual' | 'daily' | 'weekly' | 'hourly';
}

interface ImportJob {
  id: string;
  user_id: string;
  provider: Provider;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  total_pages: number;
  current_page: number;
  total_tickets: number;
  created_at: string;
  updated_at: string;
}

export function IntegrationsTab() {
  const { showImportProgress } = useImportProgress();
  const [connections, setConnections] = useState<Record<Provider, IntegrationConnection | null>>({
    zendesk: null,
    intercom: null,
    freshdesk: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Zendesk form state
  const [zendeskForm, setZendeskForm] = useState({
    subdomain: '',
    admin_email: '',
    api_token: '',
  });

  // Intercom form state
  const [intercomForm, setIntercomForm] = useState({
    access_token: '',
    workspace_id: '',
  });

  // Freshdesk form state
  const [freshdeskForm, setFreshdeskForm] = useState({
    subdomain: '',
    api_key: '',
  });

  // Import configurations
  const [importConfigs, setImportConfigs] = useState<Record<Provider, ImportConfig>>({
    zendesk: {
      selectedGroups: [],
      selectedStatuses: [],
      ticketCount: 30,
      importFrequency: 'manual'
    },
    intercom: {
      selectedGroups: [],
      selectedStatuses: [],
      ticketCount: 30,
      importFrequency: 'manual'
    },
    freshdesk: {
      selectedGroups: [],
      selectedStatuses: [],
      ticketCount: 30,
      importFrequency: 'manual'
    }
  });

  // Available groups and statuses for each provider
  const [availableGroups, setAvailableGroups] = useState<Record<Provider, Group[]>>({
    zendesk: [],
    intercom: [],
    freshdesk: []
  });
  
  const [availableStatuses, setAvailableStatuses] = useState<Record<Provider, Status[]>>({
    zendesk: [],
    intercom: [],
    freshdesk: []
  });

  // Import modal states
  const [importModalOpen, setImportModalOpen] = useState<Provider | null>(null);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);

  // Active import job state
  const [activeImportJob, setActiveImportJob] = useState<ImportJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Form loading states
  const [formLoading, setFormLoading] = useState<Record<Provider, boolean>>({
    zendesk: false,
    intercom: false,
    freshdesk: false
  });

  const [editing, setEditing] = useState<Provider | false>(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState<Provider | null>(null);

  const supabase = createClientSupabaseClient();

  useEffect(() => {
    checkSession();
  }, []);

  // Add polling for active import jobs
  useEffect(() => {
    // Start looking for active jobs on component mount
    checkForActiveImportJobs();
    
    // Clean up any polling on component unmount
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);
  
  // Effect to manage polling based on active job status
  useEffect(() => {
    if (activeImportJob && ['pending', 'running'].includes(activeImportJob.status) && !isPolling) {
      startPolling();
    } else if ((!activeImportJob || !['pending', 'running'].includes(activeImportJob.status)) && isPolling) {
      stopPolling();
    }
  }, [activeImportJob, isPolling]);

  // Check for any active import jobs
  const checkForActiveImportJobs = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return;
      
      const userId = sessionData.session.user.id;
      
      // Look for pending or running jobs
      const { data: jobs, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'running'])
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error checking for active import jobs:', error);
        return;
      }
      
      if (jobs && jobs.length > 0) {
        console.log('Found active import job:', jobs[0]);
        setActiveImportJob(jobs[0]);
      }
    } catch (err) {
      console.error('Error checking for active import jobs:', err);
    }
  };
  
  // Start polling for job updates
  const startPolling = () => {
    setIsPolling(true);
    pollForJobUpdates();
  };
  
  // Stop polling
  const stopPolling = () => {
    setIsPolling(false);
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };
  
  // Poll for job updates
  const pollForJobUpdates = async () => {
    if (!activeImportJob) return;
    
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', activeImportJob.id)
        .single();
      
      if (error) {
        console.error('Error polling for job updates:', error);
      } else if (data) {
        setActiveImportJob(data);
        
        // If job is completed or failed, stop polling
        if (data.status === 'completed' || data.status === 'failed') {
          return; // Stop polling
        }
      }
      
      // Continue polling every 5 seconds
      pollTimeoutRef.current = setTimeout(pollForJobUpdates, 5000);
    } catch (err) {
      console.error('Error polling for job updates:', err);
    }
  };

  const checkSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current session
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        setError(`Session error: ${sessionError.message}`);
        return;
      }
      
      if (!data?.session) {
        console.log("No session found, checking if we can create a new session...");
        
        // Try to create a new session via sign-in with stored credentials if possible
        // This is a workaround for cases where the session is missing but the user should be logged in
        try {
          // First, attempt to get the user without a session
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData?.user) {
            console.log("Found user but no session, attempting to sign in again...");
            // Redirect to login to re-establish the session
            window.location.href = '/login';
            return;
          } else {
            console.error("No user found and no session");
            setError("Authentication required. Please log in.");
            return;
          }
        } catch (userError) {
          console.error("Failed to check user:", userError);
          setError("Authentication required. Please log in.");
          return;
        }
      }
      
      // If we reach here, we have a valid session
      console.log("Valid session found, fetching connections");
      fetchConnections();
    } catch (err: any) {
      console.error("Session check error:", err);
      setError("Error checking authentication status. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      setConnectLoading(true);
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.error('No active session found when fetching connections');
        return;
      }
      
      const userId = sessionData.session.user.id;
      console.log('Fetching connections for user:', userId);
      
      // Fetch all connections from the general integration_connections table
      const { data: allConnections, error: connectionsError } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('user_id', userId);
      
      if (connectionsError) {
        console.error('Error fetching integration connections:', connectionsError);
      } else {
        console.log('Found connections:', allConnections);
        
        // Reset connections
        const newConnections: Record<Provider, IntegrationConnection | null> = {
          zendesk: null,
          intercom: null,
          freshdesk: null
        };
        
        // Process each connection by provider
        if (allConnections) {
          allConnections.forEach(conn => {
            if (['zendesk', 'intercom', 'freshdesk'].includes(conn.provider)) {
              newConnections[conn.provider as Provider] = {
                provider: conn.provider as Provider,
                credentials: conn.credentials,
                created_at: conn.created_at,
                updated_at: conn.updated_at
              } as IntegrationConnection;
            }
          });
        }
        
        // Fetch Zendesk connections from dedicated table (for backward compatibility)
        const { data: zendeskData, error: zendeskError } = await supabase
          .from('zendesk_connections')
          .select('*')
          .eq('user_id', userId)
          .limit(1)
          .single();
        
        if (zendeskError && zendeskError.code !== 'PGRST116') {
          console.error('Error fetching Zendesk connection:', zendeskError);
        } else if (zendeskData) {
          console.log('Found Zendesk connection in dedicated table:', zendeskData);
          newConnections.zendesk = {
            provider: 'zendesk',
            credentials: {
              subdomain: zendeskData.subdomain,
              admin_email: zendeskData.admin_email,
              api_token: zendeskData.api_token,
            },
            created_at: zendeskData.created_at,
            updated_at: zendeskData.updated_at
          } as ZendeskConnection;
        }
        
        // Set all connections at once
        setConnections(newConnections);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setConnectLoading(false);
    }
  };

  // Use effect to fetch connections on mount and whenever auth state changes
  useEffect(() => {
    fetchConnections();
    
    // Subscribe to auth state changes to update connections when user logs in/out
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchConnections();
      } else if (event === 'SIGNED_OUT') {
        // Reset connection states
        setConnections({
          zendesk: null,
          intercom: null,
          freshdesk: null
        });
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSaveIntegration = async (provider: Provider) => {
    // Intercom integrations are disabled (coming soon feature)
    if (provider === 'intercom' as Provider) {
      return;
    }
    
    try {
      setFormLoading(prev => ({ ...prev, [provider]: true }));
      setError(null);
      setSuccess(null);

      // Get the current session to include the token
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        console.error('No active session found');
        throw new Error('Authentication required. Please log in.');
      }
      
      const token = sessionData.session.access_token;
      
      // For Zendesk, store in zendesk_connections table
      if (provider === 'zendesk') {
        // First update the zendesk_connections table
        const { error: zendeskError } = await supabase
          .from('zendesk_connections')
          .upsert({
            user_id: sessionData.session.user.id,
            subdomain: zendeskForm.subdomain,
            admin_email: zendeskForm.admin_email,
            api_token: zendeskForm.api_token,
            updated_at: new Date().toISOString()
          });
          
        if (zendeskError) {
          console.error('Error saving Zendesk connection:', zendeskError);
          throw new Error(`Failed to save Zendesk connection: ${zendeskError.message}`);
        }
        
        // Also update the general integration_connections table for consistency
        const integrationData: IntegrationCredentials = {
          provider: 'zendesk',
          credentials: {
            subdomain: zendeskForm.subdomain,
            email: zendeskForm.admin_email,
            api_token: zendeskForm.api_token,
          }
        };
        
        const response = await fetch('/api/integrations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(integrationData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to save integration');
        }

        // Clear sensitive form fields
        setZendeskForm(prev => ({ ...prev, api_token: '' }));
        
        setConnections(prev => ({
          ...prev,
          [provider]: data.connection
        }));
        
        setSuccess(`Successfully connected ${provider}`);
      } else {
        // Handle other providers normally
        let integrationData: IntegrationCredentials;

        switch (provider) {
          case 'intercom':
            integrationData = {
              provider: 'intercom',
              credentials: {
                access_token: intercomForm.access_token,
                workspace_id: intercomForm.workspace_id || undefined,
              }
            };
            break;
          case 'freshdesk':
            // We only need to use the general integration_connections table
            integrationData = {
              provider: 'freshdesk',
              credentials: {
                subdomain: freshdeskForm.subdomain,
                api_key: freshdeskForm.api_key,
              }
            };
            break;
          default:
            throw new Error('Invalid provider');
        }

        const response = await fetch('/api/integrations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(integrationData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to save integration');
        }

        // Clear sensitive form fields
        if (provider === 'intercom') {
          setIntercomForm(prev => ({ ...prev, access_token: '' }));
        } else if (provider === 'freshdesk') {
          setFreshdeskForm(prev => ({ ...prev, api_key: '' }));
        }

        setConnections(prev => ({
          ...prev,
          [provider]: data.connection
        }));

        setSuccess(`Successfully connected ${provider}`);
      }
      
      setEditing(false);
    } catch (err: any) {
      console.error(`Error saving ${provider} integration:`, err);
      setError(err.message || `Failed to connect ${provider}`);
    } finally {
      setFormLoading(prev => ({ ...prev, [provider]: false }));
      setConnectLoading(false);
    }
  };

  const handleDisconnect = async (provider: Provider) => {
    try {
      setConnectLoading(true);
      
      // Get the current session to include the token
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        console.error('No active session found');
        throw new Error('Authentication required. Please log in.');
      }
      
      const token = sessionData.session.access_token;
      
      // Special handling for Zendesk to delete from zendesk_connections as well
      if (provider === 'zendesk') {
        // Delete from zendesk_connections table
        const { error: zendeskDeleteError } = await supabase
          .from('zendesk_connections')
          .delete()
          .eq('user_id', sessionData.session.user.id);
          
        if (zendeskDeleteError) {
          console.error('Error deleting from zendesk_connections:', zendeskDeleteError);
          // Don't throw here, still try the main disconnection
        }
      }
      
      // Delete from integration_connections through the API
      const response = await fetch(`/api/integrations?provider=${provider}&deleteTickets=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to disconnect ${provider}`);
      }
      
      setConnections(prev => ({
        ...prev,
        [provider]: null
      }));
      
      setSuccess(`Successfully disconnected ${provider} and removed associated tickets`);
    } catch (err: any) {
      console.error(`Error disconnecting ${provider}:`, err);
      setError(err.message || `Failed to disconnect ${provider}`);
    } finally {
      setConnectLoading(false);
      setConfirmDisconnect(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('zendesk_')) {
      const field = name.replace('zendesk_', '');
      setZendeskForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleToggleConnection = (checked: boolean, provider: Provider = 'zendesk') => {
    if (checked) {
      setEditing(provider);
    } else {
      handleDisconnect(provider);
    }
  };

  // Handle opening the import configuration modal
  const handleOpenImportModal = async (provider: Provider) => {
    // Intercom imports are disabled (coming soon feature)
    if (provider === 'intercom' as Provider) {
      return;
    }
    
    try {
      // Clear out any old error
      setError(null);
      setImportModalOpen(provider);
      console.log(`Opening import modal for ${provider}...`);
      
      // Fetch available groups and statuses for the provider
      try {
        setFetchingMetadata(true);
        
        // Get the current session to include the token
        const { data } = await supabase.auth.getSession();
        
        if (!data?.session) {
          console.error('No active session found');
          setError('Authentication required. Please log in.');
          setFetchingMetadata(false);
          return;
        }
        
        const token = data.session.access_token;
        console.log(`Got session token for ${provider}, fetching metadata...`);
        
        // Fetch available groups and statuses
        const response = await fetch(`/api/integrations/${provider}/metadata`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Metadata API error for ${provider}:`, errorData);
          throw new Error(errorData.error || `Failed to fetch ${provider} metadata`);
        }
        
        const metadata = await response.json();
        console.log(`Received metadata for ${provider}:`, metadata);
        
        // Update available groups and statuses
        setAvailableGroups(prev => ({
          ...prev,
          [provider]: metadata.groups || []
        }));
        
        setAvailableStatuses(prev => ({
          ...prev,
          [provider]: metadata.statuses || []
        }));
        
        // Load saved configuration if it exists
        const { data: configData, error: configError } = await supabase
          .from('integration_import_configs')
          .select('*')
          .eq('provider', provider)
          .single();
        
        if (configError) {
          // If error is not found, that's okay - just use defaults
          if (configError.code !== 'PGRST116') {
            console.error(`Error fetching ${provider} import config:`, configError);
          } else {
            console.log(`No existing import config for ${provider}, using defaults`);
          }
        }
        
        if (configData) {
          console.log(`Loaded saved import config for ${provider}:`, configData);
          setImportConfigs(prev => ({
            ...prev,
            [provider]: {
              selectedGroups: configData.selected_groups || [],
              selectedStatuses: configData.selected_statuses || [],
              ticketCount: configData.ticket_count || 30,
              importFrequency: configData.import_frequency || 'manual'
            }
          }));
        }
        
      } catch (err: any) {
        console.error(`Error fetching ${provider} metadata:`, err);
        setError(err.message || `Failed to load ${provider} configuration options`);
      } finally {
        setFetchingMetadata(false);
      }
    } catch (err: any) {
      console.error(`Error opening import modal:`, err);
      setError(err.message || 'Failed to open import modal');
    }
  };

  // Function to ensure the integration_import_configs table exists
  const ensureImportConfigsTable = async () => {
    try {
      console.log('Checking if integration_import_configs table exists...');
      
      // Try to query the table to see if it exists
      const { error: schemaError } = await supabase
        .from('integration_import_configs')
        .select('count')
        .limit(1);
        
      if (schemaError) {
        console.error('Error checking integration_import_configs table:', schemaError);
        
        if (schemaError.code === '42P01') {
          console.log('Table does not exist, attempting to create it...');
          
          // We need to use an admin API to create the table
          // For security reasons, we'll call a server API endpoint to create the table
          
          // Get the current session
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (!sessionData?.session) {
            throw new Error('Authentication required to create table');
          }
          
          // Call API to create the table
          setSuccess('The integration_import_configs table does not exist. Please run the SQL script to create it, or contact your administrator.');
          
          // In a real application, you might want to add an admin API endpoint to create the table:
          /*
          const response = await fetch('/api/admin/create-integration-import-configs-table', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionData.session.access_token}`,
            },
          });
          
          if (!response.ok) {
            throw new Error('Failed to create integration_import_configs table');
          }
          
          setSuccess('Successfully created integration_import_configs table');
          */
          
          return false;
        }
      } else {
        console.log('integration_import_configs table exists!');
        return true;
      }
      
      return true;
    } catch (err: any) {
      console.error('Error ensuring integration_import_configs table:', err);
      setError('Failed to check or create integration_import_configs table: ' + err.message);
      return false;
    }
  };

  // Modify the handleSaveImportConfig function to check for the table first
  const handleSaveImportConfig = async (provider: Provider) => {
    try {
      setFetchingMetadata(true);
      
      // Get the current session
      const { data } = await supabase.auth.getSession();
      
      if (!data?.session) {
        console.error('No active session found');
        setError('Authentication required. Please log in.');
        setFetchingMetadata(false);
        return false;
      }
      
      // Check if the table exists first
      const tableExists = await ensureImportConfigsTable();
      if (!tableExists) {
        setFetchingMetadata(false);
        return false;
      }
      
      console.log(`Saving import config for ${provider} with user ID:`, data.session.user.id);
      console.log('Config data:', {
        provider,
        selected_groups: importConfigs[provider].selectedGroups,
        selected_statuses: importConfigs[provider].selectedStatuses,
        ticket_count: importConfigs[provider].ticketCount,
        import_frequency: importConfigs[provider].importFrequency,
        user_id: data.session.user.id
      });
      
      // First check if a record already exists
      const { data: existingConfig, error: queryError } = await supabase
        .from('integration_import_configs')
        .select('id')
        .eq('user_id', data.session.user.id)
        .eq('provider', provider)
        .single();
        
      if (queryError && queryError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is expected if no record exists
        console.error(`Error checking for existing ${provider} import configuration:`, queryError);
      }
      
      let saveError;
      
      if (existingConfig) {
        // Update existing record
        console.log(`Updating existing config with ID ${existingConfig.id}`);
        const { error } = await supabase
          .from('integration_import_configs')
          .update({
            selected_groups: importConfigs[provider].selectedGroups,
            selected_statuses: importConfigs[provider].selectedStatuses,
            ticket_count: importConfigs[provider].ticketCount,
            import_frequency: importConfigs[provider].importFrequency,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);
          
        saveError = error;
      } else {
        // Insert new record
        console.log(`Creating new config for ${provider}`);
        const { error } = await supabase
          .from('integration_import_configs')
          .insert({
            provider,
            selected_groups: importConfigs[provider].selectedGroups,
            selected_statuses: importConfigs[provider].selectedStatuses,
            ticket_count: importConfigs[provider].ticketCount,
            import_frequency: importConfigs[provider].importFrequency,
            user_id: data.session.user.id
          });
          
        saveError = error;
      }
      
      if (saveError) {
        console.error(`Error saving ${provider} import configuration:`, saveError);
        throw new Error(`Failed to save ${provider} import configuration: ${saveError.message} (code: ${saveError.code})`);
      }
      
      setSuccess(`${provider} import configuration saved successfully`);
      setImportModalOpen(null);
      return true;
    } catch (err: any) {
      console.error(`Error saving ${provider} import configuration:`, err);
      setError(err.message || `Failed to save ${provider} import configuration`);
      return false;
    } finally {
      setFetchingMetadata(false);
    }
  };

  // Start import process
  const handleStartImport = async (provider: Provider) => {
    // Intercom imports are disabled (coming soon feature)
    if (provider === 'intercom' as Provider) {
      return;
    }
    
    try {
      setImportInProgress(true);
      setError(null); // Clear any previous errors
      setSuccess(`Starting ${provider} import...`);
      
      // Reset and initialize import progress
      setImportConfigs(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          selectedGroups: [],
          selectedStatuses: [],
          ticketCount: 30,
          importFrequency: 'manual'
        }
      }));
      
      // Get the current session
      const { data } = await supabase.auth.getSession();
      
      if (!data?.session) {
        console.error('No active session found');
        setError('Authentication required. Please log in.');
        setImportInProgress(false);
        return;
      }
      
      const token = data.session.access_token;
      
      // Always check for existing configuration in the database
      setImportConfigs(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          selectedGroups: [],
          selectedStatuses: [],
          ticketCount: 30,
          importFrequency: 'manual'
        }
      }));
      
      // Call import API endpoint with current config
      // Note: The API will use the database config but we still send our local config as fallback
      console.log(`Starting import for ${provider} with config:`, importConfigs[provider]);
      setSuccess(`Fetching data from ${provider}...`);
      
      const response = await fetch(`/api/integrations/${provider}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          config: importConfigs[provider]
        }),
      });
      
      const resultData = await response.json();
      
      if (!response.ok) {
        console.error(`Error response from import API:`, resultData);
        throw new Error(resultData.error || `Failed to start ${provider} import`);
      }
      
      console.log('Import job started:', resultData);
      
      // Check if we got a job ID back
      if (resultData.jobId) {
        // Fetch the job details
        const { data: jobData, error: jobError } = await supabase
          .from('import_jobs')
          .select('*')
          .eq('id', resultData.jobId)
          .single();
          
        if (!jobError && jobData) {
          // Set the active job to trigger polling
          setActiveImportJob(jobData);
        }
        
        setSuccess(`${provider} import started. You can check the progress in the indicator.`);
      } else {
        // Legacy case - API returned direct results without job tracking
        setImportConfigs(prev => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            selectedGroups: [],
            selectedStatuses: [],
            ticketCount: 30,
            importFrequency: 'manual'
          }
        }));
        
        console.log(`Import completed successfully:`, resultData);
        
        // Display success message with ticket count information
        if (resultData.importDetails && resultData.importDetails.ticketsImported !== undefined) {
          setSuccess(`Successfully imported ${resultData.importDetails.ticketsImported} tickets from ${provider}!`);
        } else {
          setSuccess(`${provider} import completed successfully!`);
        }
      }
    } catch (err: any) {
      console.error(`Error starting ${provider} import:`, err);
      setError(err.message || `Failed to start ${provider} import`);
    } finally {
      setImportInProgress(false);
    }
  };

  // Handle checkbox changes for groups and statuses
  const toggleGroupSelection = (provider: Provider, groupId: string) => {
    setImportConfigs(prev => {
      const selected = prev[provider].selectedGroups;
      const newSelected = selected.includes(groupId)
        ? selected.filter(id => id !== groupId)
        : [...selected, groupId];
        
      return {
        ...prev,
        [provider]: {
          ...prev[provider],
          selectedGroups: newSelected
        }
      };
    });
  };

  const toggleStatusSelection = (provider: Provider, statusId: string) => {
    setImportConfigs(prev => {
      const selected = prev[provider].selectedStatuses;
      const newSelected = selected.includes(statusId)
        ? selected.filter(id => id !== statusId)
        : [...selected, statusId];
        
      return {
        ...prev,
        [provider]: {
          ...prev[provider],
          selectedStatuses: newSelected
        }
      };
    });
  };

  // Modal for configuring import settings
  const renderImportConfigModal = () => {
    if (!importModalOpen) return null;
    
    const provider = importModalOpen;
    const config = importConfigs[provider];
    const groups = availableGroups[provider];
    const statuses = availableStatuses[provider];
    
    return (
      <Dialog open={!!importModalOpen} onOpenChange={() => setImportModalOpen(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Configure {provider} Import</DialogTitle>
            <DialogDescription>
              Select which data to import from your {provider} account.
            </DialogDescription>
          </DialogHeader>
          
          {fetchingMetadata ? (
            <div className="py-6 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading configuration options...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Select Groups</h3>
                
                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No groups available</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {groups.map(group => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`group-${group.id}`}
                          checked={config.selectedGroups.includes(group.id)}
                          onCheckedChange={() => toggleGroupSelection(provider, group.id)}
                        />
                        <label 
                          htmlFor={`group-${group.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {group.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Select Statuses</h3>
                
                {statuses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No statuses available</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {statuses.map(status => (
                      <div key={status.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`status-${status.id}`}
                          checked={config.selectedStatuses.includes(status.id)}
                          onCheckedChange={() => toggleStatusSelection(provider, status.id)}
                        />
                        <label 
                          htmlFor={`status-${status.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {status.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`ticket-count-${provider}`}>Tickets to Import</Label>
                <Input
                  id={`ticket-count-${provider}`}
                  type="number"
                  min="1"
                  max="90"
                  value={config.ticketCount}
                  onChange={e => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value) && value > 0) {
                      setImportConfigs(prev => ({
                        ...prev,
                        [provider]: {
                          ...prev[provider],
                          ticketCount: value
                        }
                      }));
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Number of tickets to import
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`frequency-${provider}`}>Import Frequency</Label>
                <Select
                  value={config.importFrequency}
                  onValueChange={(value: 'manual' | 'daily' | 'weekly' | 'hourly') => {
                    setImportConfigs(prev => ({
                      ...prev,
                      [provider]: {
                        ...prev[provider],
                        importFrequency: value
                      }
                    }));
                  }}
                >
                  <SelectTrigger id={`frequency-${provider}`}>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How often should data be synced from {provider}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setImportModalOpen(null)}
              disabled={fetchingMetadata}
            >
              Cancel
            </Button>
            <Button
              disabled={fetchingMetadata}
              onClick={() => handleSaveImportConfig(provider)}
            >
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Add a new UI component to display the auth test button and login button when needed
  const renderAuthErrorUI = () => {
    if (!error || !error.includes('Authentication required')) return null;
    
    return (
      <div className="space-y-4 p-4 border rounded-md bg-card">
        <h3 className="text-lg font-semibold">Authentication Issue</h3>
        <p className="text-sm text-muted-foreground">
          There appears to be an issue with your session. You can try testing your auth connection or logging in again.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              try {
                setLoading(true);
                setError("Testing authentication...");
                
                // Get the current session - don't try to refresh as it will fail
                const { data } = await supabase.auth.getSession();
                
                if (!data?.session) {
                  setError("No active session. Please log in again.");
                  return;
                }
                
                // Test the API with the token
                const response = await fetch('/api/integrations?test=true', {
                  method: 'GET',
                  credentials: 'include',
                  headers: {
                    'Authorization': `Bearer ${data.session.access_token}`,
                  },
                });
                
                const responseData = await response.json();
                
                if (response.ok) {
                  setError(null);
                  setSuccess(`Auth test successful! User ID: ${responseData.user.id}. Click 'Retry Loading' to fetch your integrations.`);
                } else {
                  setError(`Auth test failed: ${responseData.error}`);
                }
              } catch (e: any) {
                setError(`Auth test error: ${e.message}`);
              } finally {
                setLoading(false);
              }
            }}
          >
            Test Auth
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => {
              window.location.href = '/login';
            }}
          >
            Go to Login
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSuccess(null);
              checkSession();
            }}
          >
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  // Debug function to check connections and metadata
  const debugIntegrations = async () => {
    try {
      // Get the current session to include the token
      const { data } = await supabase.auth.getSession();
      
      if (!data?.session) {
        console.error('No active session found');
        setError('Authentication required. Please log in.');
        return;
      }
      
      const token = data.session.access_token;
      
      // Check if the integration_import_configs table exists
      console.log('Checking if integration_import_configs table exists...');
      const { error: schemaError } = await supabase
        .from('integration_import_configs')
        .select('count')
        .limit(1);
        
      if (schemaError) {
        console.error('Error checking integration_import_configs table:', schemaError);
        if (schemaError.code === '42P01') {
          setError('The integration_import_configs table does not exist in your database. Please create it first.');
          return;
        }
      } else {
        console.log('integration_import_configs table exists!');
      }
      
      const response = await fetch('/api/debug/integrations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const debugData = await response.json();
      console.log('Integration debug data:', debugData);
      
      if (response.ok) {
        setSuccess('Debug info printed to console');
      } else {
        setError('Debug check failed. See console for details.');
      }
    } catch (err: any) {
      console.error('Debug check error:', err);
      setError(err.message || 'Failed to run debug check');
    }
  };

  // Use mock data for testing (only in development)
  const loadMockData = () => {
    // Only in development
    if (process.env.NODE_ENV !== 'production') {
      setConnections({
        zendesk: {
          provider: 'zendesk',
          credentials: {
            subdomain: 'mockcompany',
            admin_email: 'test@example.com',
            api_token: 'fake-token'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as ZendeskConnection,
        intercom: {
          provider: 'intercom',
          credentials: {
            access_token: 'fake-intercom-token',
            workspace_id: 'fake-workspace'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any,
        freshdesk: {
          provider: 'freshdesk',
          credentials: {
            subdomain: 'mockcompany',
            api_key: 'fake-api-key'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any
      });

      // Mock groups and statuses
      setAvailableGroups({
        zendesk: [
          { id: 'z1', name: 'Support' },
          { id: 'z2', name: 'Sales' },
          { id: 'z3', name: 'Engineering' }
        ],
        intercom: [
          { id: 'i1', name: 'Customer Success' },
          { id: 'i2', name: 'Product' }
        ],
        freshdesk: [
          { id: 'f1', name: 'Tier 1 Support' },
          { id: 'f2', name: 'Tier 2 Support' },
          { id: 'f3', name: 'Technical Team' }
        ]
      });

      setAvailableStatuses({
        zendesk: [
          { id: 'new', name: 'New' },
          { id: 'open', name: 'Open' },
          { id: 'pending', name: 'Pending' },
          { id: 'solved', name: 'Solved' },
          { id: 'closed', name: 'Closed' }
        ],
        intercom: [
          { id: 'open', name: 'Open' },
          { id: 'closed', name: 'Closed' },
          { id: 'snoozed', name: 'Snoozed' }
        ],
        freshdesk: [
          { id: '2', name: 'Open' },
          { id: '3', name: 'Pending' },
          { id: '4', name: 'Resolved' },
          { id: '5', name: 'Closed' }
        ]
      });

      setSuccess('Loaded mock data for testing');
    }
  };

  // At the end of the component, before the final return, add:
  // Add debug button for development
  const renderDebugButton = () => {
    if (process.env.NODE_ENV !== 'production') {
      return (
        <div className="mt-8 border-t pt-4">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={debugIntegrations}>
              Debug Integrations
            </Button>
            <Button variant="outline" size="sm" onClick={loadMockData}>
              Load Mock Data
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            These buttons are only visible in development mode
          </p>
        </div>
      );
    }
    return null;
  };

  // Update the useEffect that calls showImportProgress
  useEffect(() => {
    const jobId = activeImportJob?.id;
    // Only run this effect if we have a job ID and it's not already being tracked
    if (jobId && activeImportJob) {
      showImportProgress(jobId, () => {
        console.log('Import job completed:', jobId);
        setActiveImportJob(null);
      });
    }
  }, [activeImportJob?.id, showImportProgress]);

  // Render the UI
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Import in progress indicator */}
      {importInProgress && !activeImportJob && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-500 mr-2" />
          <AlertDescription className="text-blue-700 flex items-center">
            Import in progress... This may take a few minutes depending on the amount of data.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Zendesk Integration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <MessagesSquare className="mr-2 h-5 w-5" />
              Zendesk Integration
            </CardTitle>
            <CardDescription>
              Connect your Zendesk account to integrate with your helpdesk.
            </CardDescription>
          </div>
          {connections.zendesk ? (
            <div className="flex items-center space-x-2">
              <AlertDialog open={confirmDisconnect === 'zendesk'} onOpenChange={(isOpen) => {
                if (!isOpen) setConfirmDisconnect(null);
              }}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDisconnect('zendesk')}
                    disabled={connectLoading}
                  >
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to disconnect Zendesk?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete all tickets imported from Zendesk. 
                      This data cannot be recovered once deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDisconnect('zendesk')}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={connectLoading}
                    >
                      {connectLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        "Yes, disconnect and delete tickets"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setEditing('zendesk')}
                disabled={connectLoading || editing === 'zendesk'}
              >
                Connect
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {editing === 'zendesk' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zendesk_subdomain">Zendesk Domain</Label>
                <Input
                  id="zendesk_subdomain"
                  name="zendesk_subdomain"
                  value={zendeskForm.subdomain}
                  onChange={handleInputChange}
                  placeholder="your-company"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Zendesk subdomain (the part before .zendesk.com)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zendesk_admin_email">Zendesk Email</Label>
                <Input
                  id="zendesk_admin_email"
                  name="zendesk_admin_email"
                  type="email"
                  value={zendeskForm.admin_email}
                  onChange={handleInputChange}
                  placeholder="your-email@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zendesk_api_token">API Token</Label>
                <Input
                  id="zendesk_api_token"
                  name="zendesk_api_token"
                  type="password"
                  value={zendeskForm.api_token}
                  onChange={handleInputChange}
                  placeholder="••••••••••••••••••••"
                  required={!connections.zendesk}
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your Zendesk Admin settings
                </p>
              </div>
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(false)}
                  disabled={connectLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveIntegration('zendesk')}
                  disabled={
                    connectLoading ||
                    !zendeskForm.subdomain ||
                    !zendeskForm.admin_email ||
                    (!connections.zendesk && !zendeskForm.api_token)
                  }
                >
                  {connectLoading ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            </div>
          ) : (
            connections.zendesk && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm font-medium">Connection Status</h3>
                    <p className="flex items-center text-green-600">
                      <Check className="mr-1 h-4 w-4" /> 
                      Connected as {connections.zendesk.credentials.admin_email}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Zendesk Domain</h3>
                    <p>{connections.zendesk.credentials.subdomain}.zendesk.com</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Connected On</h3>
                    <p>{new Date(connections.zendesk.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing('zendesk')}
                    disabled={connectLoading}
                  >
                    Edit Connection
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenImportModal('zendesk')}
                  >
                    Configure Import
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStartImport('zendesk')}
                  >
                    Start Import
                  </Button>
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Freshdesk Integration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <TicketIcon className="mr-2 h-5 w-5" />
              Freshdesk Integration
            </CardTitle>
            <CardDescription>
              Connect your Freshdesk account to integrate support tickets.
            </CardDescription>
          </div>
          {connections.freshdesk ? (
            <div className="flex items-center space-x-2">
              <AlertDialog open={confirmDisconnect === 'freshdesk'} onOpenChange={(isOpen) => {
                if (!isOpen) setConfirmDisconnect(null);
              }}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDisconnect('freshdesk')}
                    disabled={connectLoading}
                  >
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to disconnect Freshdesk?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete all tickets imported from Freshdesk. 
                      This data cannot be recovered once deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDisconnect('freshdesk')}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={connectLoading}
                    >
                      {connectLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        "Yes, disconnect and delete tickets"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setEditing('freshdesk')}
                disabled={connectLoading || editing === 'freshdesk'}
              >
                Connect
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {editing === 'freshdesk' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="freshdesk_subdomain">Freshdesk Domain</Label>
                <Input
                  id="freshdesk_subdomain"
                  name="freshdesk_subdomain"
                  value={freshdeskForm.subdomain}
                  onChange={(e) => setFreshdeskForm(prev => ({ ...prev, subdomain: e.target.value }))}
                  placeholder="your-company"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Freshdesk subdomain (the part before .freshdesk.com)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="freshdesk_api_key">API Key</Label>
                <Input
                  id="freshdesk_api_key"
                  name="freshdesk_api_key"
                  type="password"
                  value={freshdeskForm.api_key}
                  onChange={(e) => setFreshdeskForm(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="••••••••••••••••••••"
                  required={!connections.freshdesk}
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your Freshdesk profile settings
                </p>
              </div>
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(false)}
                  disabled={connectLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveIntegration('freshdesk')}
                  disabled={
                    connectLoading ||
                    !freshdeskForm.subdomain ||
                    (!connections.freshdesk && !freshdeskForm.api_key)
                  }
                >
                  {connectLoading ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            </div>
          ) : (
            connections.freshdesk && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm font-medium">Connection Status</h3>
                    <p className="flex items-center text-green-600">
                      <Check className="mr-1 h-4 w-4" /> 
                      Connected to Freshdesk
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Freshdesk Domain</h3>
                    <p>{connections.freshdesk.credentials.subdomain}.freshdesk.com</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Connected On</h3>
                    <p>{new Date(connections.freshdesk.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing('freshdesk')}
                    disabled={connectLoading}
                  >
                    Edit Connection
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenImportModal('freshdesk')}
                  >
                    Configure Import
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStartImport('freshdesk')}
                  >
                    Start Import
                  </Button>
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Intercom Integration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Intercom Integration
              <span className="ml-2 inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800">
                Coming soon
              </span>
            </CardTitle>
            <CardDescription>
              Connect your Intercom account to integrate customer messaging.
            </CardDescription>
          </div>
          {connections.intercom ? (
            <div className="flex items-center space-x-2">
              <AlertDialog open={confirmDisconnect === 'intercom'} onOpenChange={(isOpen) => {
                if (!isOpen) setConfirmDisconnect(null);
              }}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDisconnect('intercom')}
                    disabled={connectLoading}
                  >
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to disconnect Intercom?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will remove access to your Intercom data. 
                      Your connection settings will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDisconnect('intercom')}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={connectLoading}
                    >
                      {connectLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        "Yes, disconnect"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setEditing('intercom')}
                disabled={true}
              >
                Coming soon
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {editing === 'intercom' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="intercom_access_token">Access Token</Label>
                <Input
                  id="intercom_access_token"
                  name="intercom_access_token"
                  type="password"
                  value={intercomForm.access_token}
                  onChange={(e) => setIntercomForm(prev => ({ ...prev, access_token: e.target.value }))}
                  placeholder="••••••••••••••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  Your Intercom API access token
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="intercom_workspace_id">Workspace ID (optional)</Label>
                <Input
                  id="intercom_workspace_id"
                  name="intercom_workspace_id"
                  value={intercomForm.workspace_id}
                  onChange={(e) => setIntercomForm(prev => ({ ...prev, workspace_id: e.target.value }))}
                  placeholder="Optional workspace identifier"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(false)}
                  disabled={connectLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveIntegration('intercom')}
                  disabled={
                    connectLoading ||
                    !intercomForm.access_token
                  }
                >
                  {connectLoading ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            </div>
          ) : (
            connections.intercom && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm font-medium">Connection Status</h3>
                    <p className="flex items-center text-green-600">
                      <Check className="mr-1 h-4 w-4" /> 
                      Connected to Intercom
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Workspace ID</h3>
                    <p>{connections.intercom.credentials.workspace_id || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Connected On</h3>
                    <p>{new Date(connections.intercom.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing('intercom')}
                    disabled={true}
                  >
                    Edit Connection
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenImportModal('intercom')}
                    disabled={true}
                  >
                    Configure Import
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStartImport('intercom')}
                    disabled={true}
                  >
                    Start Import
                  </Button>
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>
      
      {/* Display error or success messages */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mt-4 border-green-500 text-green-500">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Render the auth error UI */}
      {renderAuthErrorUI()}

      {/* Render the import configuration modal */}
      {renderImportConfigModal()}
      
      {/* Debug button (development only) */}
      {renderDebugButton()}
    </div>
  );
} 