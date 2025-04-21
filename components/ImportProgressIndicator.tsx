'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
// @ts-ignore
import { io, Socket } from 'socket.io-client'

// Provider type from existing code
type Provider = 'zendesk' | 'intercom' | 'freshdesk';

interface ImportProgressIndicatorProps {
  jobId: string;
  onComplete?: () => void;
}

interface ImportProgress {
  jobId: string;
  provider: Provider | string;
  stage: 'scanning' | 'processing' | 'importing' | 'completed' | 'failed';
  totalTickets: number;
  processedCount: number;
  percentage: number;
  progress: number; // 0-100 value from Supabase
  currentTicket?: {
    id: string | number;
    position: number;
  };
  isCompleted: boolean;
}

// Socket.io event types
interface ServerToClientEvents {
  progress: (data: ImportProgress) => void;
  error: (error: { message: string }) => void;
}

export function ImportProgressIndicator({ 
  jobId, 
  onComplete
}: ImportProgressIndicatorProps) {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasActiveImport, setHasActiveImport] = useState(false);
  const initialFetchDone = useRef(false);
  const socketRef = useRef<Socket<ServerToClientEvents> | null>(null);
  
  // Function to update the progress in the Jobs dropdown
  const updateJobsDropdownProgress = (data: ImportProgress | null) => {
    if (!data) return;
    
    const container = document.getElementById('import-progress-container');
    if (container) {
      // Update text
      const progressText = container.querySelector('div.text-xs');
      if (progressText) {
        if (data.isCompleted || data.stage === 'completed' || data.progress === 100) {
          progressText.textContent = `Completed: Imported ${data.totalTickets || 0} tickets`;
          
          // Also update the badge if possible
          const parentItem = container.closest('.py-2');
          if (parentItem) {
            const badge = parentItem.querySelector('div.flex.w-full > div:last-child > *');
            if (badge) {
              badge.className = "bg-green-50 text-green-700 border-green-200";
              badge.textContent = "Completed";
            }
          }
        } else if (data.currentTicket) {
          progressText.textContent = `Processing ${data.stage || 'import'}: ${data.currentTicket.position}/${data.totalTickets}`;
        } else {
          progressText.textContent = `${data.stage ? data.stage.charAt(0).toUpperCase() + data.stage.slice(1) : 'Processing'}`;
        }
      }
    }
  };
  
  // Fetch progress (can be called manually)
  const fetchProgress = useCallback(async () => {
    if (!jobId) {
      setHasActiveImport(false);
      return;
    }
    
    try {
      setIsRefreshing(true);
      setError(null);
      
      console.log(`Fetching import progress for job: ${jobId}`);
      
      const response = await fetch(`/api/import-progress?jobId=${jobId}`);
      
      if (response.status === 401) {
        console.error('Authentication error when fetching import progress. Session may have expired.');
        setError('Authentication error. Please refresh the page to login again.');
        setHasActiveImport(false);
        return;
      }
      
      if (!response.ok) {
        console.error('Failed to fetch import progress:', response.status, response.statusText);
        setError(`Error ${response.status}: ${response.statusText}`);
        setHasActiveImport(false);
        return;
      }
      
      const data = await response.json();
      
      // Check for errors in the response data
      if (data.error) {
        console.error('Error in import progress data:', data.error, data.details || '');
        setError(data.details ? `${data.error}: ${data.details}` : data.error);
        setHasActiveImport(false);
        return;
      }
      
      // Check if we have a valid import job
      if (!data || !data.jobId) {
        console.log('No active import job found');
        setHasActiveImport(false);
        setProgress(null);
        return;
      }
      
      // Additional completion check - mark job as completed if progress is 100%
      if (data.progress === 100 && !data.isCompleted) {
        data.isCompleted = true;
        data.stage = 'completed';
      }
      
      setProgress(data);
      setHasActiveImport(true);
      
      // Update the progress UI in the Jobs dropdown
      updateJobsDropdownProgress(data);
      
      // Handle completion
      if ((data.isCompleted || data.stage === 'completed' || data.progress === 100) && onComplete) {
        // Auto-dismiss after delay
        setTimeout(() => {
          onComplete();
        }, 3000);
      }
    } catch (error) {
      console.error('Error fetching import progress:', error);
      setError('Network error while fetching progress');
      setHasActiveImport(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [jobId, onComplete]);
  
  // Manual refresh function - defined after fetchProgress to avoid circular reference
  const handleRefresh = useCallback(() => {
    fetchProgress();
  }, [fetchProgress]); 
  
  // Try to set up Socket.io connection for real-time updates
  const setupWebSocket = useCallback(() => {
    // Only run in browser
    if (typeof window === 'undefined' || !jobId) return;
    
    try {
      // Clean up existing connection
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Create Socket.io connection
      console.log(`Setting up Socket.io connection for job: ${jobId}`);
      
      // Connect to the Socket.io server with the correct namespace and path
      const socket = io<ServerToClientEvents>('/import-progress', {
        path: '/api/ws',
        query: { jobId },
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
      });
      
      socket.on('connect', () => {
        console.log('Socket.io connected for job progress updates');
        socketRef.current = socket;
      });
      
      socket.on('connect_error', (err: Error) => {
        console.error('Socket.io connection error:', err);
        // Don't set UI error, just fallback to manual refresh
      });
      
      socket.on('progress', (data: ImportProgress) => {
        try {
          console.log('Received Socket.io progress update:', data);
          
          // Additional completion check - mark job as completed if progress is 100%
          if (data.progress === 100 && !data.isCompleted) {
            data.isCompleted = true;
            data.stage = 'completed';
          }
          
          setProgress(data);
          setHasActiveImport(true);
          
          // Update the progress UI in the Jobs dropdown
          updateJobsDropdownProgress(data);
          
          // Handle completion
          if ((data.isCompleted || data.stage === 'completed' || data.progress === 100) && onComplete) {
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
  }, [jobId, onComplete]);
  
  // Load progress on mount and clean up on unmount
  useEffect(() => {
    if (jobId && !initialFetchDone.current) {
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
              console.log('Polling for import progress (fallback)');
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
    } else if (!jobId) {
      setHasActiveImport(false);
      setProgress(null);
      
      return () => {
        // Cleanup function
      };
    }
  }, [jobId, fetchProgress, setupWebSocket]);
  
  // Reset initialFetchDone when jobId changes
  useEffect(() => {
    initialFetchDone.current = false;
  }, [jobId]);
  
  // If no active import or progress after initial fetch, don't show anything
  if (!hasActiveImport || (!progress && !error)) {
    return null;
  }
  
  // Component doesn't render a UI element anymore
  // It just connects to the websocket and updates the progress in the Jobs dropdown
  return null;
} 