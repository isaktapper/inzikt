'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft, Save, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { setupSystemJobs } from '@/lib/cron/setup-default-jobs'

export default function CronSettingsPage() {
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  
  const setupDefaultJobs = async () => {
    try {
      await setupSystemJobs();
      
      toast({
        title: 'Default jobs created',
        description: 'System maintenance jobs have been set up.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to set up default jobs. See console for details.',
        variant: 'destructive',
      });
      console.error(error);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" className="mr-2" asChild>
          <Link href="/admin/settings">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Cron Job Settings</h1>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Jobs</CardTitle>
            <CardDescription>
              Configure system-wide maintenance and scheduled tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create default system maintenance jobs for database cleanup and other automated tasks.
            </p>
            <Button onClick={setupDefaultJobs}>
              <Plus className="h-4 w-4 mr-1" />
              Set Up Default System Jobs
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Job Runner Configuration</CardTitle>
            <CardDescription>
              Configure the cron job runner settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cron-token" className="text-right">
                  Cron Secret Token
                </Label>
                <Input
                  id="cron-token"
                  value={process.env.NEXT_PUBLIC_CRON_SECRET_PREVIEW || '••••••••••••••••'}
                  className="col-span-3"
                  disabled
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cron-schedule" className="text-right">
                  Schedule
                </Label>
                <Input
                  id="cron-schedule"
                  value="*/15 * * * *"
                  className="col-span-3"
                  disabled
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cron-status" className="text-right">
                  Job Runner Status
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch id="cron-status" checked={true} disabled />
                  <Label htmlFor="cron-status">Active</Label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              These settings are configured in your Vercel project. To modify them, update the environment variables and vercel.json file.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 