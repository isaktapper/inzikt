'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format, formatDistanceToNow } from 'date-fns'
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Job {
  id: string
  user_id: string
  job_type: 'import' | 'analysis' | 'export'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled'
  progress: number
  provider?: string
  created_at: string
  completed_at?: string
  updated_at?: string
  total_tickets?: number
  total_pages?: number
  current_page?: number
  error?: string
  details?: any
  is_completed?: boolean
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancelingJobs, setCancelingJobs] = useState<Record<string, boolean>>({})
  const supabase = createClientComponentClient()

  const fetchJobs = async () => {
    try {
      setIsLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('Current auth user in fetchJobs:', user);
      
      // Call the server-side API endpoint to get jobs, bypassing RLS
      const apiUrl = `/api/debug/get-jobs?limit=100${user ? `&userId=${user.id}` : ''}`;
      console.log(`Fetching jobs via API: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error fetching jobs:', errorData);
        return;
      }
      
      const result = await response.json();
      const data = result.jobs || [];
      
      console.log(`API returned ${data.length} jobs:`, data);
      
      // Format jobs for display
      const formattedJobs = data.map((job: any) => {
        // Determine status with more detailed logging
        let status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled' = 'processing'
        
        if (job.status === 'completed') {
          status = 'completed'
          console.log(`Job ${job.id} has status='completed'`)
        } else if (job.is_completed === true) {
          status = 'completed'
          console.log(`Job ${job.id} has is_completed=true`)
        } else if (job.status === 'failed') {
          status = 'failed'
          console.log(`Job ${job.id} has status='failed'`)
        } else if (job.status === 'canceled') {
          status = 'canceled'
          console.log(`Job ${job.id} has status='canceled'`)
        } else if (job.progress === 100) {
          status = 'completed'
          console.log(`Job ${job.id} has progress=100`)
        } else if (job.status === 'pending') {
          status = 'pending'
          console.log(`Job ${job.id} has status='pending'`)
        } else {
          status = 'processing'
          console.log(`Job ${job.id} has status='${job.status || 'undefined'}' and progress=${job.progress}`)
        }
        
        return {
          id: job.id,
          user_id: job.user_id || 'unknown',
          job_type: job.job_type || 'import',
          status,
          progress: job.progress || 0,
          provider: job.provider,
          created_at: job.created_at,
          updated_at: job.updated_at,
          completed_at: job.completed_at || (status === 'completed' ? job.updated_at : undefined),
          total_tickets: job.total_tickets,
          total_pages: job.total_pages,
          current_page: job.current_page,
          error: job.error,
          details: job,
          is_completed: job.is_completed,
        }
      })
      
      console.log('Formatted jobs for display:', formattedJobs)
      setJobs(formattedJobs)
    } catch (error) {
      console.error('Error in fetchJobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const cancelJob = async (jobId: string, jobType: string) => {
    try {
      setCancelingJobs(prev => ({ ...prev, [jobId]: true }));
      
      // Use appropriate endpoint based on job type
      const endpoint = jobType === 'analysis' 
        ? '/api/analyze-tickets/cancel'
        : '/api/jobs/cancel';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel job');
      }
      
      toast({
        title: `${jobType.charAt(0).toUpperCase() + jobType.slice(1)} job canceled`,
        description: "The job has been successfully canceled.",
      });
      
      // Refresh the jobs list
      fetchJobs();
    } catch (error) {
      console.error('Error canceling job:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to cancel job',
        variant: "destructive",
      });
    } finally {
      setCancelingJobs(prev => ({ ...prev, [jobId]: false }));
    }
  };

  useEffect(() => {
    fetchJobs()
    
    // Set up real-time subscription for job updates
    const channel = supabase
      .channel('jobs-history-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'import_jobs',
      }, payload => {
        console.log('Received real-time update for import_jobs in history page:', payload)
        fetchJobs()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Job type to human-readable name mapping
  const getJobTypeName = (type: string) => {
    switch (type) {
      case 'import': return 'Import'
      case 'analysis': return 'Analysis'
      case 'export': return 'Export'
      default: return 'Job'
    }
  }
  
  // Job status badge
  const JobStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>
      case 'canceled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Canceled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" className="mr-2" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Background Jobs History</h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-muted-foreground">Loading jobs history...</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No job history found</p>
        </div>
      ) : (
        <Table>
          <TableCaption>A list of your recent background jobs.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Job Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Results</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map(job => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {job.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    ) : job.status === 'failed' ? (
                      <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                    ) : job.status === 'canceled' ? (
                      <XCircle className="h-4 w-4 mr-2 text-gray-500" />
                    ) : (
                      <Loader2 className="h-4 w-4 mr-2 text-blue-500 animate-spin" />
                    )}
                    {getJobTypeName(job.job_type)}
                    {job.provider && ` (${job.provider})`}
                  </div>
                </TableCell>
                <TableCell>
                  <JobStatusBadge status={job.status} />
                </TableCell>
                <TableCell>
                  {format(new Date(job.created_at), 'MMM d, h:mm a')}
                </TableCell>
                <TableCell className="text-right">
                  {job.total_tickets !== undefined ? (
                    <>{job.total_tickets} tickets</>
                  ) : job.progress > 0 ? (
                    <>{job.progress}% complete</>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {(job.status === 'pending' || job.status === 'processing') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => cancelJob(job.id, job.job_type)}
                      disabled={cancelingJobs[job.id]}
                      className="text-red-600 hover:text-red-800 border-red-200 hover:border-red-800"
                    >
                      {cancelingJobs[job.id] ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Canceling...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Cancel
                        </>
                      )}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}