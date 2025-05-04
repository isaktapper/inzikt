import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AutomatedImportParams {
  user_id: string;
  provider: string;
  days_back?: number;
}

export async function runAutomatedImport(params: AutomatedImportParams): Promise<any> {
  const { user_id, provider, days_back = 7 } = params;
  
  console.log(`Running automated import for user ${user_id}, provider ${provider}, days_back ${days_back}`);
  
  // Get import configuration for the user and provider
  const { data: config, error: configError } = await supabase
    .from('integration_import_configs')
    .select('*')
    .eq('user_id', user_id)
    .eq('provider', provider)
    .single();
    
  if (configError) {
    throw new Error(`Failed to fetch import configuration: ${configError.message}`);
  }
  
  if (!config) {
    throw new Error(`No import configuration found for user ${user_id} and provider ${provider}`);
  }
  
  // Create an import job
  const { data: jobData, error: jobError } = await supabase
    .from('import_jobs')
    .insert({
      user_id,
      provider,
      job_type: 'import',
      status: 'pending',
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();
    
  if (jobError) {
    throw new Error(`Failed to create import job: ${jobError.message}`);
  }
  
  // Call the import API endpoint
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const importResponse = await fetch(`${appUrl}/api/integrations/${provider}/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-supabase-auth': process.env.SUPABASE_SERVICE_ROLE_KEY!
    },
    body: JSON.stringify({
      userId: user_id,
      daysBack: days_back,
      selectedGroups: config.selected_groups,
      selectedStatuses: config.selected_statuses,
      importFrequency: config.import_frequency
    })
  });
  
  const importResult = await importResponse.json();
  
  if (!importResponse.ok) {
    throw new Error(`Import API error: ${importResult.error || importResponse.statusText}`);
  }
  
  return {
    jobId: jobData.id,
    importId: importResult.jobId,
    message: importResult.message
  };
} 