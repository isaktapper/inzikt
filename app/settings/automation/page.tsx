'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { setupUserJobs } from '@/lib/cron/setup-default-jobs'
import { scheduleJob, updateScheduledJob, deleteScheduledJob } from '@/lib/cron/manager'

export default function AutomationSettingsPage() {
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [jobs, setJobs] = useState([])
  const [providers, setProviders] = useState([])
  
  // Fetch user info and jobs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('No authenticated user')
        }
        
        setUserId(user.id)
        
        // Fetch user's jobs
        const { data: jobsData, error: jobsError } = await supabase
          .from('scheduled_jobs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at')
        
        if (jobsError) throw jobsError
        setJobs(jobsData || [])
        
        // Fetch available providers
        const { data: providerData, error: providerError } = await supabase
          .from('integration_import_configs')
          .select('provider')
          .eq('user_id', user.id)
        
        if (providerError) throw providerError
        setProviders(providerData.map(p => p.provider) || [])
      } catch (error) {
        console.error('Error fetching user data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load automation settings',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [supabase, toast])
  
  // Toggle job enabled status
  const toggleJobStatus = async (jobId, enabled) => {
    try {
      await updateScheduledJob(jobId, { enabled: !enabled })
      
      // Update local state
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, enabled: !enabled } : job
      ))
      
      toast({
        title: 'Job updated',
        description: `Job ${!enabled ? 'enabled' : 'disabled'} successfully`,
      })
    } catch (error) {
      console.error('Error toggling job status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update job',
        variant: 'destructive'
      })
    }
  }
  
  // Delete a job
  const deleteJob = async (jobId) => {
    try {
      await deleteScheduledJob(jobId)
      
      // Update local state
      setJobs(jobs.filter(job => job.id !== jobId))
      
      toast({
        title: 'Job deleted',
        description: 'Scheduled job removed successfully',
      })
    } catch (error) {
      console.error('Error deleting job:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive'
      })
    }
  }
  
  // Set up default automation jobs
  const setupAutomation = async () => {
    try {
      await setupUserJobs(userId, providers)
      
      // Refresh jobs list
      const { data, error } = await supabase
        .from('scheduled_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at')
      
      if (error) throw error
      setJobs(data || [])
      
      toast({
        title: 'Automation set up',
        description: 'Default automation jobs have been created',
      })
    } catch (error) {
      console.error('Error setting up automation:', error)
      toast({
        title: 'Error',
        description: 'Failed to set up automation',
        variant: 'destructive'
      })
    }
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" className="mr-2" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Automation Settings</h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Jobs</CardTitle>
              <CardDescription>
                Configure automated tasks to run on a schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    No automated jobs set up yet. 
                  </p>
                  <Button onClick={setupAutomation}>
                    <Plus className="h-4 w-4 mr-1" />
                    Set Up Default Automation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{job.job_type}</h3>
                        <p className="text-sm text-muted-foreground">
                          Runs {job.frequency}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={job.enabled} 
                          onCheckedChange={() => toggleJobStatus(job.id, job.enabled)} 
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteJob(job.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button onClick={setupAutomation} className="mt-4">
                    <Plus className="h-4 w-4 mr-1" />
                    Add More Automation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 