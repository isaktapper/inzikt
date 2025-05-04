'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
// @ts-ignore
import { io, Socket } from 'socket.io-client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { CancelAnalysisButton } from "@/components/CancelAnalysisButton"

interface AnalysisProgressIndicatorProps {
  userId: string;
  onComplete?: () => void;
}

interface AnalysisProgress {
  userId: string;
  stage: 'analyzing' | 'processing' | 'completed' | 'failed';
  percentage: number;
  progress: number; // 0-100 value
  ticketsAnalyzed: number;
  totalTickets: number;
  isCompleted: boolean;
  jobId?: string;
}

// Socket.io event types
interface ServerToClientEvents {
  progress: (data: AnalysisProgress) => void;
  error: (error: { message: string }) => void;
}

export function AnalysisProgressIndicator({
  userId,
  onComplete
}: AnalysisProgressIndicatorProps) {
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasActiveAnalysis, setHasActiveAnalysis] = useState(false);
  const initialFetchDone = useRef(false);
  const socketRef = useRef<Socket<ServerToClientEvents> | null>(null);
  const supabase = createClientComponentClient();
  
  // Function to update the progress in the Jobs dropdown
  const updateJobsDropdownProgress = (data: AnalysisProgress | null) => {
    if (!data) return;
    
    const container = document.getElementById('analysis-progress-container');
    if (container) {
      // Update text
      const progressText = container.querySelector('div.text-xs');
      if (progressText) {
        if (data.isCompleted || data.stage === 'completed' || data.progress === 100) {
          progressText.textContent = `Completed: Analyzed ${data.ticketsAnalyzed || 0} tickets`;
          
          // Also update the badge if possible
          const parentItem = container.closest('.py-2');
          if (parentItem) {
            const badge = parentItem.querySelector('div.flex.w-full > div:last-child > *');
            if (badge) {
              badge.className = "bg-green-50 text-green-700 border-green-200";
              badge.textContent = "Completed";
            }
          }
        } else {
          progressText.textContent = `${data.stage ? data.stage.charAt(0).toUpperCase() + data.stage.slice(1) : 'Processing'}: ${data.ticketsAnalyzed}/${data.totalTickets}`;
        }
      }
    }
  };
  
  // Function to ensure analysis job exists in the database
  const ensureJobExists = useCallback(async (data: AnalysisProgress) => {
    if (!userId) return null;
    
    try {
      // Check if job already exists
      let jobId = data.jobId;
      
      if (!jobId) {
        // First check if an active job already exists for this user
        const { data: existingJobs, error: queryError } = await supabase
          .from('import_jobs')
          .select('id')
          .eq('user_id', userId)
          .eq('job_type', 'analysis')
          .or('status.eq.processing,status.eq.pending')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (!queryError && existingJobs && existingJobs.length > 0) {
          jobId = existingJobs[0].id;
        } else {
          // Create a new job record
          const { data: newJob, error: insertError } = await supabase
            .from('import_jobs')
            .insert({
              user_id: userId,
              job_type: 'analysis',
              status: data.isCompleted ? 'completed' : 'processing',
              progress: data.progress || 0,
              provider: 'system',
              is_completed: data.isCompleted,
            })
            .select('id')
            .single();
            
          if (insertError) {
            console.error('Error creating analysis job record:', insertError);
            return null;
          }
          
          jobId = newJob.id;
        }
      }
      
      // Special case: when there are no tickets to analyze
      const isNoTicketsCase = data.totalTickets === 0 && data.processedCount === 0;
      
      // Update job with latest progress
      await supabase
        .from('import_jobs')
        .update({
          status: data.isCompleted || isNoTicketsCase ? 'completed' : 'processing',
          progress: data.isCompleted || isNoTicketsCase ? 100 : (data.progress || 0),
          is_completed: data.isCompleted || isNoTicketsCase,
          completed_at: (data.isCompleted || isNoTicketsCase) ? new Date().toISOString() : null,
        })
        .eq('id', jobId);
        
      return jobId;
    } catch (error) {
      console.error('Error managing analysis job record:', error);
      return null;
    }
  }, [userId, supabase]);
  
  // Fetch progress (can be called manually)
  const fetchProgress = useCallback(async () => {
    if (!userId) {
      setHasActiveAnalysis(false);
      return;
    }
    
    try {
      setIsRefreshing(true);
      setError(null);
      
      console.log(`Fetching analysis progress for user: ${userId}`);
      
      const response = await fetch(`/api/analysis-progress?userId=${userId}`);
      
      if (response.status === 401) {
        console.error('Authentication error when fetching analysis progress. Session may have expired.');
        setError('Authentication error. Please refresh the page to login again.');
        setHasActiveAnalysis(false);
        return;
      }
      
      if (!response.ok) {
        console.error('Failed to fetch analysis progress:', response.status, response.statusText);
        setError(`Error ${response.status}: ${response.statusText}`);
        setHasActiveAnalysis(false);
        return;
      }
      
      const data = await response.json();
      
      // Check for errors in the response data
      if (data.error) {
        console.error('Error in analysis progress data:', data.error, data.details || '');
        setError(data.details ? `${data.error}: ${data.details}` : data.error);
        setHasActiveAnalysis(false);
        return;
      }
      
      // Check if we have a valid analysis job
      if (!data || !data.userId) {
        console.log('No active analysis job found');
        setHasActiveAnalysis(false);
        setProgress(null);
        return;
      }
      
      // Additional completion check - mark job as completed if progress is 100%
      if (data.progress === 100 && !data.isCompleted) {
        data.isCompleted = true;
        data.stage = 'completed';
      }
      
      // Ensure job exists in database
      const jobId = await ensureJobExists(data);
      if (jobId) {
        data.jobId = jobId;
      }
      
      setProgress(data);
      setHasActiveAnalysis(true);
      
      // Update the progress UI in the Jobs dropdown
      updateJobsDropdownProgress(data);
      
      // Handle completion
      if ((data.isCompleted || data.stage === 'completed' || data.progress === 100) && onComplete) {
        // Update job as completed in the database
        if (data.jobId) {
          await supabase
            .from('import_jobs')
            .update({
              status: 'completed',
              progress: 100,
              is_completed: true,
              completed_at: new Date().toISOString(),
            })
            .eq('id', data.jobId);
        }
        
        // Auto-dismiss after delay
        setTimeout(() => {
          onComplete();
        }, 3000);
      }
    } catch (error) {
      console.error('Error fetching analysis progress:', error);
      setError('Network error while fetching progress');
      setHasActiveAnalysis(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [userId, onComplete, ensureJobExists, supabase]);
  
  // Manual refresh function - defined after fetchProgress to avoid circular reference
  const handleRefresh = useCallback(() => {
    fetchProgress();
  }, [fetchProgress]); 
  
  // Try to set up Socket.io connection for real-time updates
  const setupWebSocket = useCallback(() => {
    // Only run in browser
    if (typeof window === 'undefined' || !userId) return;
    
    try {
      // Clean up existing connection
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Create Socket.io connection
      console.log(`Setting up Socket.io connection for user: ${userId}`);
      
      // Connect to the Socket.io server with the correct namespace and path
      const socket = io<ServerToClientEvents>('/analysis-progress', {
        path: '/api/ws',
        query: { userId },
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
      });
      
      socket.on('connect', () => {
        console.log('Socket.io connected for analysis progress updates');
        socketRef.current = socket;
      });
      
      socket.on('connect_error', (err: Error) => {
        console.error('Socket.io connection error:', err);
        // Don't set UI error, just fallback to manual refresh
      });
      
      socket.on('progress', async (data: AnalysisProgress) => {
        try {
          console.log('Received Socket.io progress update:', data);
          
          // Additional completion check - mark job as completed if progress is 100%
          if (data.progress === 100 && !data.isCompleted) {
            data.isCompleted = true;
            data.stage = 'completed';
          }
          
          // Ensure job exists in database and update progress
          const jobId = await ensureJobExists(data);
          if (jobId) {
            data.jobId = jobId;
          }
          
          setProgress(data);
          setHasActiveAnalysis(true);
          
          // Update the progress UI in the Jobs dropdown
          updateJobsDropdownProgress(data);
          
          // Handle completion
          if ((data.isCompleted || data.stage === 'completed' || data.progress === 100) && onComplete) {
            // Update job as completed in the database
            if (data.jobId) {
              await supabase
                .from('import_jobs')
                .update({
                  status: 'completed',
                  progress: 100,
                  is_completed: true,
                  completed_at: new Date().toISOString(),
                })
                .eq('id', data.jobId);
            }
            
            socket.disconnect();
            socketRef.current = null;
            
            setTimeout(() => {
              onComplete();
            }, 3000);
          }
        } catch (err) {
          console.error('Error handling Socket.io message:', err);
        }
      });
      
      socket.on('error', (errorData: { message: string }) => {
        console.error('Socket.io server error:', errorData);
      });
      
      socket.on('disconnect', () => {
        console.log('Socket.io connection closed');
        socketRef.current = null;
      });
      
    } catch (error) {
      console.error('Error setting up Socket.io:', error);
    }
  }, [userId, onComplete, ensureJobExists, supabase]);
  
  // Load progress on mount and clean up on unmount
  useEffect(() => {
    if (userId && !initialFetchDone.current) {
      fetchProgress();
      initialFetchDone.current = true;
      
      // Try to set up Socket.io connection
      setupWebSocket();
      
      // Set a timeout to check if socket connection was established
      // If not, we'll set up polling as fallback
      const fallbackTimeout = setTimeout(() => {
        if (!socketRef.current) {
          console.log('Socket.io connection not established after timeout, using fallback polling');
          
          // Set up polling every 10 seconds as fallback
          const pollInterval = setInterval(() => {
            if (!socketRef.current) {
              console.log('Polling for analysis progress (fallback)');
              fetchProgress();
            } else {
              // If socket gets connected later, clear the interval
              clearInterval(pollInterval);
            }
          }, 10000); // 10 seconds interval
          
          // Clean up interval on component unmount
          return () => {
            clearInterval(pollInterval);
          };
        }
      }, 3000); // Wait 3 seconds for socket to connect
      
      return () => {
        // Clean up Socket.io connection on unmount
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        
        // Clear the fallback timeout
        clearTimeout(fallbackTimeout);
      };
    } else if (!userId) {
      setHasActiveAnalysis(false);
      setProgress(null);
      
      return () => {
        // Cleanup function
      };
    }
  }, [userId, fetchProgress, setupWebSocket]);
  
  // Reset initialFetchDone when userId changes
  useEffect(() => {
    initialFetchDone.current = false;
  }, [userId]);
  
  // If no active analysis or progress after initial fetch, don't show anything
  if (!hasActiveAnalysis || (!progress && !error)) {
    return null;
  }
  
  // Component doesn't render a UI element anymore
  // It just connects to the websocket and updates the progress in the Jobs dropdown
  return (
    <>
      {progress && (
        <div className="flex items-center">
          <p>Analyzing tickets: {progress.ticketsAnalyzed}/{progress.totalTickets}</p>
          
          <div className="ml-4">
            <CancelAnalysisButton 
              size="sm" 
              variant="outline" 
              onCancel={() => {
                if (onComplete) onComplete();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
} 