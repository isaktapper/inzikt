'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClientSupabaseClient } from '@/utils/supabase/client'
import { Progress } from '@/components/ui/progress'
import { Loader2, X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
// @ts-ignore
import { io, Socket } from 'socket.io-client'

interface ProgressIndicatorProps {
  userId: string;
  onComplete?: () => void;
}

interface AnalysisProgress {
  userId: string;
  totalTickets: number;
  processedCount: number;
  isCompleted: boolean;
  lastUpdateTime: number;
}

// Socket.io event types
interface ServerToClientEvents {
  progress: (data: AnalysisProgress) => void;
  error: (error: { message: string }) => void;
}

export function AnalysisProgressIndicator({ userId, onComplete }: ProgressIndicatorProps) {
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket<ServerToClientEvents> | null>(null);
  const initialFetchDone = useRef(false);

  // Fetch progress function
  const fetchProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/analysis-progress?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }
      
      const data = await response.json();
      
      // Check for status changes
      const wasCompleted = progress?.isCompleted;
      setProgress(data);
      
      // Handle completion
      if (!wasCompleted && data.isCompleted && data.totalTickets > 0) {
        // Update the progress in the Jobs dropdown
        updateJobsDropdownProgress(100);
        
        // Call completion callback
        setTimeout(() => {
          onComplete?.();
        }, 3000);
      } else if (data.totalTickets > 0) {
        // Update the progress in the Jobs dropdown
        const percentage = Math.round((data.processedCount / Math.max(1, data.totalTickets)) * 100);
        updateJobsDropdownProgress(percentage);
      }
    } catch (error) {
      console.error('Error fetching analysis progress:', error);
      setError('Failed to fetch progress');
    }
  }, [userId, progress, onComplete]);

  // Function to update the progress in the Jobs dropdown
  const updateJobsDropdownProgress = (percentage: number) => {
    const container = document.getElementById('analysis-progress-container');
    if (container) {
      // Update progress bar
      const progressBar = container.querySelector('div > div');
      if (progressBar) {
        progressBar.setAttribute('style', `width: ${percentage}%`);
      }
      
      // Update text
      const progressText = container.querySelector('div.text-xs');
      if (progressText && progress) {
        progressText.textContent = progress.isCompleted 
          ? `Completed: ${progress.processedCount} of ${progress.totalTickets} tickets`
          : `Analyzing ${progress.processedCount} of ${progress.totalTickets} tickets (${percentage}%)`;
      }
    }
  };

  // Set up Socket.io connection
  const setupWebSocket = useCallback(() => {
    // Only run in browser
    if (typeof window === 'undefined' || !userId) return;
    
    try {
      // Clean up existing connection
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      console.log(`Setting up Socket.io connection for analysis progress (user: ${userId})`);
      
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
        // If socket fails, we'll do a manual fetch
        if (!initialFetchDone.current) {
          fetchProgress();
          initialFetchDone.current = true;
        }
      });
      
      socket.on('progress', (data: AnalysisProgress) => {
        try {
          console.log('Received Socket.io analysis progress update:', data);
          
          // Check for status changes
          const wasCompleted = progress?.isCompleted;
          setProgress(data);
          
          // Update progress in Jobs dropdown
          const percentage = Math.round((data.processedCount / Math.max(1, data.totalTickets)) * 100);
          updateJobsDropdownProgress(percentage);
          
          // Handle completion
          if (!wasCompleted && data.isCompleted && data.totalTickets > 0) {
            socket.disconnect();
            socketRef.current = null;
            
            // Auto-dismiss after delay
            setTimeout(() => {
              onComplete?.();
            }, 3000);
          }
        } catch (err) {
          console.error('Error handling Socket.io message:', err);
        }
      });
      
      socket.on('error', (errorData: { message: string }) => {
        console.error('Socket.io server error:', errorData);
        setError(errorData.message || 'Server error');
      });
      
      socket.on('disconnect', () => {
        console.log('Socket.io connection closed');
        socketRef.current = null;
      });
      
    } catch (error) {
      console.error('Error setting up Socket.io:', error);
      // Fall back to manual fetch if socket setup fails
      if (!initialFetchDone.current) {
        fetchProgress();
        initialFetchDone.current = true;
      }
    }
  }, [userId, fetchProgress, progress]);

  // Set up connection and fetch initial data
  useEffect(() => {
    if (userId) {
      // Try to set up socket connection first
      setupWebSocket();
      
      // Fall back to polling if socket not connected after short timeout
      const fallbackTimeout = setTimeout(() => {
        if (!socketRef.current && !initialFetchDone.current) {
          console.log('Socket.io connection not established, using fallback polling');
          fetchProgress();
          initialFetchDone.current = true;
          
          // Set up polling every 5 seconds for updates
          const pollInterval = setInterval(() => {
            fetchProgress();
          }, 5000);
          
          return () => clearInterval(pollInterval);
        }
      }, 3000);
      
      return () => {
        // Clean up Socket.io connection on unmount
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        clearTimeout(fallbackTimeout);
      };
    }
  }, [userId, setupWebSocket, fetchProgress]);
  
  // The component doesn't render a UI element anymore
  // It just connects to the websocket and updates the progress in the Jobs dropdown
  return null;
} 