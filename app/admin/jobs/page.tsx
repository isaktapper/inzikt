import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

export default function JobsPage() {
  const isLoading = false;
  const scheduledJobs = [];
  const recentExecutions = [];

  const toggleJobStatus = (jobId, enabled) => {
    // Implementation of toggleJobStatus
  };

  const runJobManually = (jobId) => {
    // Implementation of runJobManually
  };

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="jobs">Scheduled Jobs</TabsTrigger>
          <TabsTrigger value="executions">Job Executions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="jobs">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin mr-2" />
              <span className="text-muted-foreground">Loading jobs...</span>
            </div>
          ) : scheduledJobs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No scheduled jobs found</p>
            </div>
          ) : (
            <Table>
              <TableCaption>List of scheduled jobs</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Type</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.job_type}</TableCell>
                    <TableCell>
                      {job.frequency}
                      {job.cron_expression && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({job.cron_expression})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {job.last_run
                        ? formatDistanceToNow(new Date(job.last_run), { addSuffix: true })
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(job.next_run), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={job.enabled ? "default" : "outline"}
                        className={job.enabled ? "bg-green-50 text-green-700 border-green-200" : ""}
                      >
                        {job.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleJobStatus(job.id, job.enabled)}
                      >
                        {job.enabled ? (
                          <><Pause className="h-4 w-4 mr-1" /> Disable</>
                        ) : (
                          <><Play className="h-4 w-4 mr-1" /> Enable</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runJobManually(job.id)}
                      >
                        <Play className="h-4 w-4 mr-1" /> Run Now
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        
        <TabsContent value="executions">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin mr-2" />
              <span className="text-muted-foreground">Loading executions...</span>
            </div>
          ) : recentExecutions.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No job executions found</p>
            </div>
          ) : (
            <Table>
              <TableCaption>Recent job executions</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentExecutions.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-medium">
                      {execution.scheduled_jobs?.job_type || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {execution.status === 'completed' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                      ) : execution.status === 'failed' ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <AlertCircle className="h-3 w-3 mr-1" /> Failed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Clock className="h-3 w-3 mr-1" /> Running
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(execution.started_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {execution.duration_ms 
                        ? `${(execution.duration_ms / 1000).toFixed(2)}s` 
                        : 'In progress'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {execution.error ? (
                        <span className="text-red-600">{execution.error}</span>
                      ) : execution.result ? (
                        <span className="text-xs">
                          {typeof execution.result === 'object' 
                            ? JSON.stringify(execution.result) 
                            : execution.result}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 