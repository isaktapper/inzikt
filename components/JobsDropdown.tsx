'use client'

import { useState, useEffect } from 'react'
import { Briefcase, Clock, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow, formatDistance } from 'date-fns'
import { useImportProgress } from '@/contexts/ImportProgressContext'
import { useAnalysisProgress } from '@/contexts/AnalysisProgressContext'

interface Job {
  id: string
  user_id: string
  job_type: 'import' | 'analysis' | 'export'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  provider?: string
  created_at: string
  completed_at?: string
  error?: string
  details?: any
}

export function JobsDropdown() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [activeJobsCount, setActiveJobsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  
  // Get import progress state
  const { currentJobId: importJobId } = useImportProgress()
  
  // Get analysis progress state
  const { isAnalyzing } = useAnalysisProgress()

  // Track total active jobs (database + current progress indicators)
  const calculateActiveBadgeCount = (dbJobsCount: number) => {
    let count = dbJobsCount;
    // Add import job if active
    if (importJobId) count++;
    // Add analysis job if active
    if (isAnalyzing) count++;
    return count;
  };

  // Fetch jobs on load and set up real-time updates
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true)
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          return
        }
        
        // Get the last 10 jobs for this user
        const { data, error } = await supabase
          .from('import_jobs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (error) {
          console.error('Error fetching jobs:', error)
          return
        }
        
        // Format jobs for display
        const formattedJobs = data.map(job => ({
          id: job.id,
          user_id: job.user_id,
          job_type: job.job_type || 'import',
          // Better status determination logic
          status: job.is_completed === true ? 'completed' : 
                 job.status === 'failed' ? 'failed' : 
                 job.status || (job.progress === 100 ? 'completed' : 'processing'),
          progress: job.progress || 0,
          provider: job.provider,
          created_at: job.created_at,
          completed_at: job.completed_at,
          error: job.error,
          details: job,
        }))
        
        setJobs(formattedJobs)
        
        // Count active jobs
        const activeCount = formattedJobs.filter(
          job => job.status === 'pending' || job.status === 'processing'
        ).length
        
        setActiveJobsCount(activeCount)
      } catch (error) {
        console.error('Error in fetchJobs:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchJobs()
    
    // Set up real-time subscription for job updates
    const channel = supabase
      .channel('jobs-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'import_jobs',
      }, payload => {
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
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Calculate total active jobs including live progress indicators
  const totalActiveJobs = calculateActiveBadgeCount(activeJobsCount);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Briefcase className="h-4 w-4 mr-1" />
          Jobs
          {totalActiveJobs > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {totalActiveJobs}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Background Jobs</DropdownMenuLabel>
        
        {isLoading && !isAnalyzing && !importJobId ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading jobs...</span>
          </div>
        ) : jobs.length === 0 && !isAnalyzing && !importJobId ? (
          <div className="py-4 px-2 text-center text-sm text-muted-foreground">
            No recent jobs found
          </div>
        ) : (
          <>
            <DropdownMenuGroup>
              {/* Active Jobs Section */}
              {(jobs.filter(job => job.status === 'pending' || job.status === 'processing').length > 0 || isAnalyzing || importJobId) && (
                <>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground mt-1">
                    Active Jobs
                  </DropdownMenuLabel>
                  
                  {/* Ongoing Analysis Job */}
                  {isAnalyzing && (
                    <DropdownMenuItem className="py-2 flex flex-col items-start">
                      <div className="flex w-full justify-between items-center">
                        <div className="flex items-center">
                          <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="font-medium">Analysis</span>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>
                      </div>
                      
                      <div id="analysis-progress-container" className="w-full">
                        <div className="text-xs text-muted-foreground mt-1">
                          Processing ticket analysis...
                        </div>
                      </div>
                    </DropdownMenuItem>
                  )}
                  
                  {/* Import Progress Job */}
                  {importJobId && (
                    <DropdownMenuItem className="py-2 flex flex-col items-start">
                      <div className="flex w-full justify-between items-center">
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 text-blue-500 animate-spin" />
                          <span className="font-medium">Import</span>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>
                      </div>
                      
                      <div id="import-progress-container" className="w-full">
                        <div className="text-xs text-muted-foreground mt-1">
                          Importing tickets...
                        </div>
                      </div>
                    </DropdownMenuItem>
                  )}
                  
                  {/* Regular Jobs */}
                  {jobs
                    .filter(job => job.status === 'pending' || job.status === 'processing')
                    .map(job => (
                      <DropdownMenuItem key={job.id} className="py-2 flex flex-col items-start">
                        <div className="flex w-full justify-between items-center">
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 mr-2 text-blue-500 animate-spin" />
                            <span className="font-medium">
                              {getJobTypeName(job.job_type)}
                              {job.provider && ` (${job.provider})`}
                            </span>
                          </div>
                          <JobStatusBadge status={job.status} />
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-1 w-full flex justify-between">
                          <span>Started {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                          <span>ID: {job.id.split('-')[0]}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    
                  <DropdownMenuSeparator />
                </>
              )}
              
              {/* Recent Jobs Section */}
              {jobs.filter(job => job.status !== 'pending' && job.status !== 'processing').length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Completed Jobs
                  </DropdownMenuLabel>
                  
                  {jobs
                    .filter(job => job.status === 'completed')
                    .slice(0, 5)
                    .map(job => (
                      <DropdownMenuItem key={job.id} className="py-2">
                        <div className="flex w-full justify-between items-center">
                          <div className="flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                            <div>
                              <div className="font-medium">
                                {getJobTypeName(job.job_type)}
                                {job.provider && ` (${job.provider})`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(job.created_at), 'MMM d, h:mm a')}
                                {job.completed_at && ` • Took ${formatDistance(
                                  new Date(job.created_at),
                                  new Date(job.completed_at)
                                )}`}
                              </div>
                            </div>
                          </div>
                          <JobStatusBadge status={job.status} />
                        </div>
                      </DropdownMenuItem>
                    ))}
                    
                  {jobs.filter(job => job.status === 'failed').length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        Failed Jobs
                      </DropdownMenuLabel>
                      
                      {jobs
                        .filter(job => job.status === 'failed')
                        .slice(0, 3)
                        .map(job => (
                          <DropdownMenuItem key={job.id} className="py-2">
                            <div className="flex w-full justify-between items-center">
                              <div className="flex items-center">
                                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                <div>
                                  <div className="font-medium">
                                    {getJobTypeName(job.job_type)}
                                    {job.provider && ` (${job.provider})`}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(job.created_at), 'MMM d, h:mm a')}
                                    {job.error && (
                                      <span className="block text-red-500 truncate max-w-[180px]" title={job.error}>
                                        {job.error}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <JobStatusBadge status={job.status} />
                            </div>
                          </DropdownMenuItem>
                        ))}
                    </>
                  )}
                </>
              )}
            </DropdownMenuGroup>
            
            {jobs.length > 8 && (
              <div className="py-2 px-2 text-center text-xs text-muted-foreground">
                Showing {Math.min(jobs.length, 8)} of {jobs.length} jobs
              </div>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <a href="/jobs" className="flex w-full justify-center items-center py-2 text-sm">
                <Clock className="h-4 w-4 mr-2" />
                View all jobs history
              </a>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 