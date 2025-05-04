// This script can be imported and used from a Next.js API route
// to analyze tickets for a specific user

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function analyzeTicketsForUser(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    throw new Error('Invalid user ID format');
  }
  
  console.log(`Starting ticket analysis for user: ${userId}`);
  
  // Use service role for unrestricted database access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Create a job record in the database
  const { data: jobData, error: jobError } = await supabase
    .from('import_jobs')
    .insert({
      user_id: userId,
      job_type: 'analysis',
      status: 'pending',
      progress: 0,
      provider: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  if (jobError) {
    console.error('Error creating analysis job:', jobError);
    throw new Error('Failed to create analysis job');
  }
  
  const jobId = jobData.id;
  console.log(`Created analysis job with ID: ${jobId}`);
  
  // 1. Get all analyzed ticket IDs first
  const { data: analyzedTickets, error: analyzedError } = await supabase
    .from('analysis')
    .select('ticket_id');
  
  if (analyzedError) {
    console.error('Error fetching analyzed tickets:', analyzedError);
    throw new Error('Failed to fetch analyzed tickets');
  }

  console.log(`Found ${analyzedTickets?.length || 0} already analyzed tickets in total`);
  
  // Filter out invalid UUIDs to avoid errors
  const analyzedIds = (analyzedTickets ?? [])
    .map(t => t.ticket_id)
    .filter(id => typeof id === 'string' && isUuid(id));
  
  console.log(`Valid analyzed ticket IDs: ${analyzedIds.length}`);

  // 2. Fetch tickets that don't have a corresponding row in the analysis table
  let ticketsQuery = supabase
    .from('tickets')
    .select('id, subject, description, conversation, user_id')
    .eq('user_id', userId); // Only get tickets for the current user
  
  // Only apply the filter if we have analyzed tickets
  if (analyzedIds.length > 0) {
    ticketsQuery = ticketsQuery.not('id', 'in', `(${analyzedIds.join(',')})`);
    console.log('Excluding analyzed tickets with IDs:', analyzedIds);
  }
  
  // Get all unanalyzed tickets
  const { data: ticketsToAnalyze, error: ticketsError } = await ticketsQuery;
  
  if (ticketsError) {
    console.error('Error fetching tickets:', ticketsError);
    throw new Error('Failed to fetch tickets for analysis');
  }

  // Log total tickets found
  console.log(`Total tickets to analyze for user ${userId}: ${ticketsToAnalyze?.length || 0}`);
  
  if (!ticketsToAnalyze || ticketsToAnalyze.length === 0) {
    console.log('No tickets to analyze, marking job as completed');
    
    // Update the job as completed with 0 tickets
    const { error: updateError } = await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        progress: 100,
        is_completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_tickets: 0
      })
      .eq('id', jobId);
      
    if (updateError) {
      console.error('Error updating job record:', updateError);
    }
    
    return {
      message: 'No tickets to analyze for this user',
      count: 0,
      jobId
    };
  }
  
  // Call the analyze-tickets API endpoint to start the analysis
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze-tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY.slice(-8)
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to analyze tickets');
    }
    
    return {
      message: 'Analysis started successfully',
      count: ticketsToAnalyze.length,
      jobId: result.jobId || jobId
    };
  } catch (error) {
    console.error('Error starting analysis:', error);
    
    // Update job to error status
    await supabase
      .from('import_jobs')
      .update({
        status: 'error',
        progress: 0,
        is_completed: true,
        error_message: error.message || 'Failed to start analysis',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
      
    throw error;
  }
}

// Helper function to validate UUID
function isUuid(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
} 